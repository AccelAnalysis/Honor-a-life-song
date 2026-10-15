import Link from "next/link";
import { SongwritingEntry, SongwritingStudio } from "@/components/songwriting-studio";
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
    "song-lyrics": "Move from interview notes to a draft, then review, compare, and refine until the song is finished.",
    "lyrics-draft": "Write the working lyric and save the next version.",
    "lyrics-review": "Read the current version and decide what happens next.",
    "lyrics-comparison": "Read two versions side by side.",
    "lyrics-refine": "Shape the latest version into the next one.",
    "lyrics-version-history": "Read every saved version, oldest first.",
    "story-interview-notes": "Keep the interview notes this song is drawn from.",
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

function showsSongwriting(route: CreatorRouteResolution) {
  if (route.child?.id === "story-interview-notes" || route.child?.id === "song-lyrics") return true;
  return route.parent.id === "song" && !route.child;
}

export function CreatorWorkspace({ route }: CreatorWorkspaceProps) {
  const activeWorkflow = route.grandchild ?? route.child;
  const songwriting = showsSongwriting(route);

  return <div className={styles.creatorModule}>
    {route.parent.id === "creator-home" && !route.child ? <SongwritingEntry /> : null}
    <ChildNavigation route={route} />
    <LyricsGrandchildNavigation route={route} />
    {songwriting
      ? <SongwritingStudio route={route} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} route={route} />
        : <ModuleLanding route={route} />}
  </div>;
}
