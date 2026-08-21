import Link from "next/link";
import { getNextProgramJourneyState } from "@/domain/workflows";
import { referenceFacilityContext, referenceParticipant, referenceProgramRun } from "@/fixtures/reference-data";
import {
  buildFacilityHref,
  facilityServiceConnections,
  getFacilityChildren,
  type FacilityRouteResolution,
  type FacilityWorkflowNode
} from "@/lib/facility-navigation";
import styles from "./facility-workspace.module.css";

type FacilityWorkspaceProps = {
  route: FacilityRouteResolution;
};

function BoundaryList({ node }: { node: FacilityWorkflowNode }) {
  return <div className={styles.boundaries} aria-label="Shared platform boundaries">
    {node.boundaries.map((boundary) => <span key={boundary}>{boundary}</span>)}
  </div>;
}

function ServiceGate({ node }: { node: FacilityWorkflowNode }) {
  if (!node.action) return <div className={styles.gate}><strong>Structural workflow available</strong><span>Authoritative records for this workflow are not connected in the reference chassis.</span></div>;
  const connected = facilityServiceConnections[node.action.service];
  return <div className={styles.gate}>
    <strong>{connected ? "Production service connected" : "Production action gated"}</strong>
    <span>{connected ? `${node.action.service} is available through the shared platform boundary.` : `${node.action.service} is not connected; the platform will not simulate success.`}</span>
    {node.action.consentScope && <span><b>Authorization + consent:</b> {node.action.consentScope}</span>}
    <button disabled={!connected} type="button">{node.action.label}</button>
  </div>;
}

function WorkflowFacts({ node, participantId }: { node: FacilityWorkflowNode; participantId?: string }) {
  if (node.id === "dashboard-program-status" || node.id === "dashboard-action-items") {
    const nextState = getNextProgramJourneyState(referenceProgramRun.status);
    return <div className={styles.factGrid}>
      <div><span>Reference ProgramRun state</span><strong>{referenceProgramRun.status}</strong></div>
      <div><span>Next governed state</span><strong>{nextState ?? "Program lifecycle complete"}</strong></div>
    </div>;
  }

  if (node.id === "program-dates") {
    return <div className={styles.factGrid}>
      <div><span>Reference start</span><strong>{referenceProgramRun.startsOn ?? "Not configured"}</strong></div>
      <div><span>Reference end</span><strong>{referenceProgramRun.endsOn ?? "Not configured"}</strong></div>
    </div>;
  }

  if (node.id === "participant-participation-status") {
    return <div className={styles.factGrid}>
      <div><span>Selected participant</span><strong>{participantId ?? "No participant selected"}</strong></div>
      <div><span>Program participation status</span><strong>{participantId === referenceParticipant.id ? referenceParticipant.participationStatus : "Authoritative record not connected"}</strong></div>
    </div>;
  }

  if (participantId) {
    return <div className={styles.factGrid}><div><span>Selected participant context</span><strong>{participantId}</strong></div></div>;
  }

  return null;
}

function TargetLink({ node, programRunId }: { node: FacilityWorkflowNode; programRunId: string }) {
  if (!node.target) return null;
  return <Link className={styles.primaryLink} href={buildFacilityHref({ ...node.target, programRunId })}>Open corresponding workflow</Link>;
}

function WorkflowSurface({ node, programRunId, participantId }: { node: FacilityWorkflowNode; programRunId: string; participantId?: string }) {
  return <section className={styles.workflowSurface} aria-labelledby="facility-workflow-heading">
    <p className={styles.kicker}>Concrete workflow boundary</p>
    <h2 id="facility-workflow-heading">{node.label}</h2>
    <p>{node.description}</p>
    <BoundaryList node={node} />
    <WorkflowFacts node={node} participantId={participantId} />
    <TargetLink node={node} programRunId={programRunId} />
    <ServiceGate node={node} />
  </section>;
}

function ChildNavigation({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  const children = getFacilityChildren(route.parent.id as Parameters<typeof getFacilityChildren>[0]);
  return <nav className={styles.childNav} aria-label={`${route.parent.label} workflows`}>
    {children.map((child) => <Link
      className={route.child?.id === child.id ? styles.active : undefined}
      href={buildFacilityHref({ parentId: route.parent.id as Parameters<typeof getFacilityChildren>[0], childId: child.id, programRunId })}
      key={child.id}
    >{child.label}</Link>)}
  </nav>;
}

function ParticipantGrandchildNavigation({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  if (route.child?.id !== "participant-detail" || !route.participantId) return null;
  return <nav className={styles.grandchildNav} aria-label="Participant Detail workflows">
    <span>Participant Detail · {route.participantId}</span>
    <div>
      {route.child.grandchildren?.map((grandchild) => <Link
        className={route.grandchild?.id === grandchild.id ? styles.active : undefined}
        href={buildFacilityHref({
          parentId: "participants",
          childId: "participant-detail",
          participantId: route.participantId,
          grandchildId: grandchild.id,
          programRunId
        })}
        key={grandchild.id}
      >{grandchild.label}</Link>)}
    </div>
  </nav>;
}

function ModuleLanding({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  const parentId = route.parent.id as Parameters<typeof getFacilityChildren>[0];
  const children = getFacilityChildren(parentId);
  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Facility module</p><h2>{route.parent.label}</h2><p>{route.parent.description}</p></div>
      <div className={styles.contextPill}><span>ProgramRun</span><strong>{programRunId}</strong></div>
    </div>
    <div className={styles.workflowGrid}>
      {children.map((child) => <article key={child.id}>
        <h3>{child.label}</h3>
        <p>{child.description}</p>
        <BoundaryList node={child} />
        <Link href={buildFacilityHref({ parentId, childId: child.id, programRunId })}>Open workflow</Link>
      </article>)}
    </div>
  </section>;
}

function ParticipantDetailLanding({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  if (route.child?.id !== "participant-detail") return null;

  if (!route.participantId) {
    const isReferenceProgram = programRunId === referenceFacilityContext.programRunId;
    return <section className={styles.selectionState}>
      <h2>Participant Detail</h2>
      <p>A selected Participant record is required before participant-detail grandchildren can be opened. Selection belongs to the canonical ProgramRun roster; a participant does not need an authenticated account.</p>
      {isReferenceProgram
        ? <Link className={styles.primaryLink} href={buildFacilityHref({ parentId: "participants", childId: "participant-detail", participantId: referenceFacilityContext.participantId, programRunId })}>Open reference participant context</Link>
        : <span>Participant repository is not connected for this ProgramRun.</span>}
    </section>;
  }

  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Selected participant</p><h2>{route.participantId}</h2><p>Participant context remains in the route while moving among the source-defined detail workflows.</p></div>
    </div>
    <div className={styles.workflowGrid}>
      {route.child.grandchildren?.map((grandchild) => <article key={grandchild.id}>
        <h3>{grandchild.label}</h3><p>{grandchild.description}</p>
        <Link href={buildFacilityHref({ parentId: "participants", childId: "participant-detail", participantId: route.participantId, grandchildId: grandchild.id, programRunId })}>Open participant workflow</Link>
      </article>)}
    </div>
  </section>;
}

export function FacilityWorkspace({ route }: FacilityWorkspaceProps) {
  const programRunId = route.programRunId ?? referenceFacilityContext.programRunId;
  const activeWorkflow = route.grandchild ?? route.child;

  return <div className={styles.facilityModule}>
    <div className={styles.structureBanner}>
      <strong>Workflow structure active</strong>
      <span>Shared production services remain explicitly gated; no participant, scheduling, messaging, media, funding, delivery, or reporting success is simulated.</span>
    </div>
    <ChildNavigation route={route} programRunId={programRunId} />
    <ParticipantGrandchildNavigation route={route} programRunId={programRunId} />
    {route.child?.id === "participant-detail" && !route.grandchild
      ? <ParticipantDetailLanding route={route} programRunId={programRunId} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} participantId={route.participantId} programRunId={programRunId} />
        : <ModuleLanding route={route} programRunId={programRunId} />}
  </div>;
}
