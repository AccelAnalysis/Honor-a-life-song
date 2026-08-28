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

function titleize(value?: string | null) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function facilityDescription(node: FacilityWorkflowNode) {
  const descriptions: Record<string, string> = {
    "dashboard-program-status": "See the current stage of the Project Ageless program and what comes next.",
    "dashboard-action-items": "See the next items that need attention for this program.",
    "program-dates": "Review the planned start and end dates for the program.",
    "participant-participation-status": "Review whether the selected participant is currently taking part in the program.",
    "participant-detail": "Open a participant to review contact, participation, accessibility, consent, story, song, and family information."
  };
  return descriptions[node.id] ?? `Use this area to view or manage ${node.label.toLowerCase()} for this Project Ageless program.`;
}

function ServiceGate({ node }: { node: FacilityWorkflowNode }) {
  if (!node.action) return null;
  const connected = facilityServiceConnections[node.action.service];
  if (connected) return <button type="button">{node.action.label}</button>;
  return <div className={styles.gate}>
    <strong>This action is currently unavailable online.</strong>
    <span>You can review this area now. Contact the Honor a Life Song team if you need help making a change.</span>
    <button disabled type="button">{node.action.label}</button>
  </div>;
}

function WorkflowFacts({ node, participantId }: { node: FacilityWorkflowNode; participantId?: string }) {
  if (node.id === "dashboard-program-status" || node.id === "dashboard-action-items") {
    const nextState = getNextProgramJourneyState(referenceProgramRun.status);
    return <div className={styles.factGrid}>
      <div><span>Program status</span><strong>{titleize(referenceProgramRun.status)}</strong></div>
      <div><span>Next step</span><strong>{nextState ? titleize(nextState) : "Program complete"}</strong></div>
    </div>;
  }

  if (node.id === "program-dates") {
    return <div className={styles.factGrid}>
      <div><span>Program start</span><strong>{referenceProgramRun.startsOn ?? "Not scheduled"}</strong></div>
      <div><span>Program end</span><strong>{referenceProgramRun.endsOn ?? "Not scheduled"}</strong></div>
    </div>;
  }

  if (node.id === "participant-participation-status") {
    return <div className={styles.factGrid}>
      <div><span>Participant</span><strong>{participantId ? "Selected" : "Not selected"}</strong></div>
      <div><span>Participation status</span><strong>{participantId === referenceParticipant.id ? titleize(referenceParticipant.participationStatus) : "Not available"}</strong></div>
    </div>;
  }

  return null;
}

function TargetLink({ node, programRunId }: { node: FacilityWorkflowNode; programRunId: string }) {
  if (!node.target) return null;
  return <Link className={styles.primaryLink} href={buildFacilityHref({ ...node.target, programRunId })}>Open related area</Link>;
}

function WorkflowSurface({ node, programRunId, participantId }: { node: FacilityWorkflowNode; programRunId: string; participantId?: string }) {
  return <section className={styles.workflowSurface} aria-labelledby="facility-workflow-heading">
    <p className={styles.kicker}>Project Ageless</p>
    <h2 id="facility-workflow-heading">{node.label}</h2>
    <p>{facilityDescription(node)}</p>
    <WorkflowFacts node={node} participantId={participantId} />
    <TargetLink node={node} programRunId={programRunId} />
    <ServiceGate node={node} />
  </section>;
}

function ChildNavigation({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  const children = getFacilityChildren(route.parent.id as Parameters<typeof getFacilityChildren>[0]);
  return <nav className={styles.childNav} aria-label={`${route.parent.label} options`}>
    {children.map((child) => <Link
      className={route.child?.id === child.id ? styles.active : undefined}
      href={buildFacilityHref({ parentId: route.parent.id as Parameters<typeof getFacilityChildren>[0], childId: child.id, programRunId })}
      key={child.id}
    >{child.label}</Link>)}
  </nav>;
}

function ParticipantGrandchildNavigation({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  if (route.child?.id !== "participant-detail" || !route.participantId) return null;
  return <nav className={styles.grandchildNav} aria-label="Participant details">
    <span>Participant Detail</span>
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
      <div><p className={styles.kicker}>Project Ageless</p><h2>{route.parent.label}</h2><p>{route.parent.description}</p></div>
      <div className={styles.contextPill}><span>Current program</span><strong>In progress</strong></div>
    </div>
    <div className={styles.workflowGrid}>
      {children.map((child) => <article key={child.id}>
        <h3>{child.label}</h3>
        <p>{facilityDescription(child)}</p>
        <Link href={buildFacilityHref({ parentId, childId: child.id, programRunId })}>Open {child.label.toLowerCase()}</Link>
      </article>)}
    </div>
  </section>;
}

function ParticipantDetailLanding({ route, programRunId }: { route: FacilityRouteResolution; programRunId: string }) {
  if (route.child?.id !== "participant-detail") return null;

  if (!route.participantId) {
    const isCurrentProgram = programRunId === referenceFacilityContext.programRunId;
    return <section className={styles.selectionState}>
      <h2>Choose a participant</h2>
      <p>Select a participant before opening their contact, participation, story, song, family, or permission information.</p>
      {isCurrentProgram
        ? <Link className={styles.primaryLink} href={buildFacilityHref({ parentId: "participants", childId: "participant-detail", participantId: referenceFacilityContext.participantId, programRunId })}>Open participant details</Link>
        : <span>No participant is selected.</span>}
    </section>;
  }

  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Participant details</p><h2>Selected participant</h2><p>Choose an area below to review or manage information for this participant.</p></div>
    </div>
    <div className={styles.workflowGrid}>
      {route.child.grandchildren?.map((grandchild) => <article key={grandchild.id}>
        <h3>{grandchild.label}</h3><p>{facilityDescription(grandchild)}</p>
        <Link href={buildFacilityHref({ parentId: "participants", childId: "participant-detail", participantId: route.participantId, grandchildId: grandchild.id, programRunId })}>Open {grandchild.label.toLowerCase()}</Link>
      </article>)}
    </div>
  </section>;
}

export function FacilityWorkspace({ route }: FacilityWorkspaceProps) {
  const programRunId = route.programRunId ?? referenceFacilityContext.programRunId;
  const activeWorkflow = route.grandchild ?? route.child;

  return <div className={styles.facilityModule}>
    <ChildNavigation route={route} programRunId={programRunId} />
    <ParticipantGrandchildNavigation route={route} programRunId={programRunId} />
    {route.child?.id === "participant-detail" && !route.grandchild
      ? <ParticipantDetailLanding route={route} programRunId={programRunId} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} participantId={route.participantId} programRunId={programRunId} />
        : <ModuleLanding route={route} programRunId={programRunId} />}
  </div>;
}
