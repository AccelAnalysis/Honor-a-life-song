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

function creatorDescription(node: CreatorWorkflowNode) {
  const descriptions: Record<string, string> = {
    "song-lyrics": "Draft, review, compare, and refine the lyrics for the selected song.",
    "production-composition": "Develop the composition after the song is approved for production.",
    "production-arrangement": "Shape the arrangement and musical structure for the approved song.",
    "production-recording": "Track the recording work for the approved song.",
    "production-editing": "Refine the recorded performance before final mixing.",
    "production-mixing": "Balance and prepare the recording for finalization.",
    "production-mastering-finalization": "Prepare the finished recording for final quality review.",
    "production-quality-review": "Complete the final creative and technical review before delivery."
  };
  return descriptions[node.id] ?? `Use this area to view or manage ${node.label.toLowerCase()} for the selected song.`;
}

function ConsentNotice({ node }: { node: CreatorWorkflowNode }) {
  if (!node.requiredConsentScopes?.length) return null;
  return <div className={styles.consent}><strong>Sharing permission required</strong><span>Make sure the necessary participant permission is in place before using or sharing this material.</span></div>;
}

function ServiceGate({ node }: { node: CreatorWorkflowNode }) {
  if (!node.action) return null;
  const connected = creatorServiceConnections[node.action.service];
  if (connected) return <button type="button">{node.action.label}</button>;
  return <div className={styles.gate}>
    <strong>This action is currently unavailable online.</strong>
    <span>You can review this area now, but changes cannot be submitted here yet.</span>
    <button disabled type="button">{node.action.label}</button>
  </div>;
}

function WorkflowGuardrail({ node }: { node: CreatorWorkflowNode }) {
  if (!node.id.startsWith("production-")) return null;
  return <div className={styles.guardrail}>
    <strong>Ready for production</strong>
    <span>Begin production only after the song has completed the required review and approval.</span>
  </div>;
}

function TargetLink({ node, creativeWorkId }: { node: CreatorWorkflowNode; creativeWorkId?: string }) {
  if (!node.target) return null;
  const targetWorkId = creativeWorkId && creatorParentCarriesWorkContext(node.target.parentId) ? creativeWorkId : undefined;
  return <Link className={styles.primaryLink} href={buildCreatorHref({ ...node.target, creativeWorkId: targetWorkId })}>Open related area</Link>;
}

function WorkSelectionRequired({ node, route }: { node: CreatorWorkflowNode; route: CreatorRouteResolution }) {
  if (!node.requiresCreativeWork || route.creativeWorkId) return null;
  return <section className={styles.selectionState} aria-labelledby="creator-selection-heading">
    <h2 id="creator-selection-heading">Choose an assigned song first</h2>
    <p>{node.label} belongs to a specific song or assignment. Select the work you want to open.</p>
    <Link className={styles.primaryLink} href={buildCreatorHref({
      parentId: route.parent.id as CreatorParentId,
      childId: route.child?.id,
      grandchildId: route.grandchild?.id,
      creativeWorkId: referenceCreatorContext.creativeWorkId
    })}>Open assigned song</Link>
  </section>;
}

function WorkflowSurface({ node, route }: { node: CreatorWorkflowNode; route: CreatorRouteResolution }) {
  const selectionRequired = node.requiresCreativeWork && !route.creativeWorkId;
  if (selectionRequired) return <WorkSelectionRequired node={node} route={route} />;

  return <section className={styles.workflowSurface} aria-labelledby="creator-workflow-heading">
    <p className={styles.kicker}>Creator Studio</p>
    <h2 id="creator-workflow-heading">{node.label}</h2>
    <p>{creatorDescription(node)}</p>
    {route.creativeWorkId && <div className={styles.contextPill}><span>Selected song</span><strong>In progress</strong></div>}
    <ConsentNotice node={node} />
    <WorkflowGuardrail node={node} />
    <TargetLink node={node} creativeWorkId={route.creativeWorkId} />
    <ServiceGate node={node} />
  </section>;
}

function ChildNavigation({ route }: { route: CreatorRouteResolution }) {
  const parentId = route.parent.id as CreatorParentId;
  const children = getCreatorChildren(parentId);
  if (!children.length) return null;

  return <nav className={styles.childNav} aria-label={`${route.parent.label} options`}>
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
  return <nav className={styles.grandchildNav} aria-label="Lyrics options">
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
      <div><p className={styles.kicker}>Creator Studio</p><h2>{route.parent.label}</h2><p>{route.parent.description}</p></div>
      {route.creativeWorkId && <div className={styles.contextPill}><span>Selected song</span><strong>In progress</strong></div>}
    </div>
    {children.some((child) => child.requiresCreativeWork) && !route.creativeWorkId && <div className={styles.selectionHint}><strong>Choose an assigned song to continue</strong><span>Open an area below to begin.</span></div>}
    <div className={styles.workflowGrid}>
      {children.map((child) => <article key={child.id}>
        <h3>{child.label}</h3>
        <p>{creatorDescription(child)}</p>
        <Link href={buildCreatorHref({ parentId, childId: child.id, creativeWorkId: route.creativeWorkId })}>Open {child.label.toLowerCase()}</Link>
      </article>)}
    </div>
  </section>;
}

function LyricsLanding({ route }: { route: CreatorRouteResolution }) {
  if (route.child?.id !== "song-lyrics" || route.grandchild) return null;
  if (!route.creativeWorkId) return <WorkSelectionRequired node={route.child} route={route} />;

  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Song Workspace</p><h2>Lyrics</h2><p>Draft, review, compare, and refine the lyrics for this song.</p></div>
      <div className={styles.contextPill}><span>Selected song</span><strong>In progress</strong></div>
    </div>
    <div className={styles.workflowGrid}>
      {route.child.grandchildren?.map((grandchild) => <article key={grandchild.id}>
        <h3>{grandchild.label}</h3>
        <p>{creatorDescription(grandchild)}</p>
        <Link href={buildCreatorHref({ parentId: "song", childId: "song-lyrics", grandchildId: grandchild.id, creativeWorkId: route.creativeWorkId })}>Open {grandchild.label.toLowerCase()}</Link>
      </article>)}
    </div>
  </section>;
}

export function CreatorWorkspace({ route }: CreatorWorkspaceProps) {
  const activeWorkflow = route.grandchild ?? route.child;

  return <div className={styles.creatorModule}>
    <ChildNavigation route={route} />
    <LyricsGrandchildNavigation route={route} />
    {route.child?.id === "song-lyrics" && !route.grandchild
      ? <LyricsLanding route={route} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} route={route} />
        : <ModuleLanding route={route} />}
  </div>;
}
