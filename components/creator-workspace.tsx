import Link from "next/link";
import { referenceCreatorContext } from "@/fixtures/reference-data";
import {
  buildCreatorHref,
  creatorLeafDestinations,
  creatorParentCarriesWorkContext,
  creatorServiceConnections,
  getCreatorChildren,
  type CreatorParentId,
  type CreatorRouteResolution,
  type CreatorWorkflowNode
} from "@/lib/creator-navigation";
import styles from "./creator-workspace.module.css";

type CreatorWorkspaceProps = {
  route: CreatorRouteResolution;
};

function BoundaryList({ node }: { node: CreatorWorkflowNode }) {
  return <div className={styles.boundaries} aria-label="Shared platform boundaries">
    {node.boundaries.map((boundary) => <span key={boundary}>{boundary}</span>)}
  </div>;
}

function ExposureNotice({ node }: { node: CreatorWorkflowNode }) {
  if (!node.exposure) return null;
  const copy = node.exposure === "creator_internal"
    ? "Creator/internal only. Do not expose this material through Customer, Facility, Sponsor, public, or Secure Delivery surfaces."
    : node.exposure === "delivery_candidate"
      ? "Delivery candidate only. Final approval, entitlement, consent, and Secure Delivery checks still apply."
      : "Authorized collaboration only. Access remains scoped to the applicable customer/family/reviewer context.";
  return <div className={styles.exposure}><strong>Information boundary</strong><span>{copy}</span></div>;
}

function ConsentNotice({ node }: { node: CreatorWorkflowNode }) {
  if (!node.requiredConsentScopes?.length) return null;
  return <div className={styles.consent}><strong>Authorization + consent</strong><span>Creator authorization alone is insufficient. Required scope: {node.requiredConsentScopes.join(", ")}.</span></div>;
}

function ServiceGate({ node }: { node: CreatorWorkflowNode }) {
  if (!node.action) {
    return <div className={styles.gate}><strong>Structural workflow available</strong><span>Authoritative records for this workflow are not connected in the reference chassis.</span></div>;
  }
  const connected = creatorServiceConnections[node.action.service];
  return <div className={styles.gate}>
    <strong>{connected ? "Production service connected" : "Production action gated"}</strong>
    <span>{connected ? `${node.action.service} is available through the shared platform boundary.` : `${node.action.service} is not connected; the platform will not simulate success.`}</span>
    <button disabled={!connected} type="button">{node.action.label}</button>
  </div>;
}

function WorkflowGuardrail({ node }: { node: CreatorWorkflowNode }) {
  if (!node.id.startsWith("production-")) return null;
  return <div className={styles.guardrail}>
    <strong>Production prerequisite</strong>
    <span>The selected CreativeWork must be governed as Approved for Production before production begins. A lyric draft, uploaded recording, or completed production subtask cannot bypass review, approval, quality review, final approval, or Secure Delivery.</span>
  </div>;
}

function TargetLink({ node, creativeWorkId }: { node: CreatorWorkflowNode; creativeWorkId?: string }) {
  if (!node.target) return null;
  const targetWorkId = creativeWorkId && creatorParentCarriesWorkContext(node.target.parentId) ? creativeWorkId : undefined;
  return <Link className={styles.primaryLink} href={buildCreatorHref({ ...node.target, creativeWorkId: targetWorkId })}>Open corresponding workflow</Link>;
}

function WorkSelectionRequired({ node, route }: { node: CreatorWorkflowNode; route: CreatorRouteResolution }) {
  if (!node.requiresCreativeWork || route.creativeWorkId) return null;
  return <section className={styles.selectionState} aria-labelledby="creator-selection-heading">
    <h2 id="creator-selection-heading">Select assigned work first</h2>
    <p>{node.label} operates on a selected canonical CreativeWork or assignment context. The platform does not guess which song/story the creator intended to open, and no authoritative assignment repository is connected in the reference chassis.</p>
    <Link className={styles.primaryLink} href={buildCreatorHref({
      parentId: route.parent.id as CreatorParentId,
      childId: route.child?.id,
      grandchildId: route.grandchild?.id,
      creativeWorkId: referenceCreatorContext.creativeWorkId
    })}>Open synthetic reference context</Link>
  </section>;
}

function WorkflowSurface({ node, route }: { node: CreatorWorkflowNode; route: CreatorRouteResolution }) {
  const selectionRequired = node.requiresCreativeWork && !route.creativeWorkId;
  if (selectionRequired) return <WorkSelectionRequired node={node} route={route} />;

  return <section className={styles.workflowSurface} aria-labelledby="creator-workflow-heading">
    <p className={styles.kicker}>Concrete workflow boundary</p>
    <h2 id="creator-workflow-heading">{node.label}</h2>
    <p>{node.description}</p>
    {route.creativeWorkId && <div className={styles.contextPill}><span>Selected CreativeWork</span><strong>{route.creativeWorkId}</strong></div>}
    <BoundaryList node={node} />
    <ConsentNotice node={node} />
    <ExposureNotice node={node} />
    <WorkflowGuardrail node={node} />
    <TargetLink node={node} creativeWorkId={route.creativeWorkId} />
    <ServiceGate node={node} />
  </section>;
}

function ChildNavigation({ route }: { route: CreatorRouteResolution }) {
  const parentId = route.parent.id as CreatorParentId;
  const children = getCreatorChildren(parentId);
  if (!children.length) return null;

  return <nav className={styles.childNav} aria-label={`${route.parent.label} workflows`}>
    {children.map((child) => <Link
      aria-current={route.child?.id === child.id ? "page" : undefined}
      className={route.child?.id === child.id ? styles.active : undefined}
      href={buildCreatorHref({ parentId, childId: child.id, creativeWorkId: route.creativeWorkId })}
      key={child.id}
    >{child.label}</Link>)}
  </nav>;
}

function LyricsGrandchildNavigation({ route }: { route: CreatorRouteResolution }) {
  if (route.parent.id !== "song" || route.child?.id !== "song-lyrics") return null;
  return <nav className={styles.grandchildNav} aria-label="Lyrics workflows">
    <span>Lyrics</span>
    <div>
      {route.child.grandchildren?.map((grandchild) => <Link
        aria-current={route.grandchild?.id === grandchild.id ? "page" : undefined}
        className={route.grandchild?.id === grandchild.id ? styles.active : undefined}
        href={buildCreatorHref({
          parentId: "song",
          childId: "song-lyrics",
          grandchildId: grandchild.id,
          creativeWorkId: route.creativeWorkId
        })}
        key={grandchild.id}
      >{grandchild.label}</Link>)}
    </div>
  </nav>;
}

function ModuleLanding({ route }: { route: CreatorRouteResolution }) {
  const parentId = route.parent.id as CreatorParentId;
  const children = getCreatorChildren(parentId);
  const leaf = creatorLeafDestinations[parentId];

  if (!children.length && leaf) return <WorkflowSurface node={leaf} route={route} />;

  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Creator module</p><h2>{route.parent.label}</h2><p>{route.parent.description}</p></div>
      {route.creativeWorkId && <div className={styles.contextPill}><span>Selected CreativeWork</span><strong>{route.creativeWorkId}</strong></div>}
    </div>
    {children.some((child) => child.requiresCreativeWork) && !route.creativeWorkId && <div className={styles.selectionHint}><strong>Selected-work context required</strong><span>Open a workflow to select a canonical CreativeWork context. The UI will not infer one from unrelated state.</span></div>}
    <div className={styles.workflowGrid}>
      {children.map((child) => <article key={child.id}>
        <h3>{child.label}</h3>
        <p>{child.description}</p>
        <BoundaryList node={child} />
        <Link href={buildCreatorHref({ parentId, childId: child.id, creativeWorkId: route.creativeWorkId })}>Open workflow</Link>
      </article>)}
    </div>
  </section>;
}

function LyricsLanding({ route }: { route: CreatorRouteResolution }) {
  if (route.child?.id !== "song-lyrics" || route.grandchild) return null;
  if (!route.creativeWorkId) return <WorkSelectionRequired node={route.child} route={route} />;

  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Nested lyric workflow</p><h2>Lyrics</h2><p>The active CreativeWork stays in the route while moving among Draft, Version History, and Comparison.</p></div>
      <div className={styles.contextPill}><span>Selected CreativeWork</span><strong>{route.creativeWorkId}</strong></div>
    </div>
    <div className={styles.workflowGrid}>
      {route.child.grandchildren?.map((grandchild) => <article key={grandchild.id}>
        <h3>{grandchild.label}</h3>
        <p>{grandchild.description}</p>
        <Link href={buildCreatorHref({ parentId: "song", childId: "song-lyrics", grandchildId: grandchild.id, creativeWorkId: route.creativeWorkId })}>Open lyric workflow</Link>
      </article>)}
    </div>
  </section>;
}

export function CreatorWorkspace({ route }: CreatorWorkspaceProps) {
  const activeWorkflow = route.grandchild ?? route.child;

  return <div className={styles.creatorModule}>
    <div className={styles.structureBanner}>
      <strong>Workflow structure active</strong>
      <span>Human-led story-to-song workflows are navigable. Assignment, story, lyric, approval, production, media, scheduling, messaging, delivery, and audit services remain explicitly gated where they are not connected.</span>
    </div>
    <ChildNavigation route={route} />
    <LyricsGrandchildNavigation route={route} />
    {route.child?.id === "song-lyrics" && !route.grandchild
      ? <LyricsLanding route={route} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} route={route} />
        : <ModuleLanding route={route} />}
  </div>;
}
