import Link from "next/link";
import { deriveCustomerNextAction, deriveJourneyProgress } from "@/domain/customer";
import { referenceCustomerContext } from "@/fixtures/reference-data";
import {
  buildCustomerHref,
  customerLeafDestinations,
  customerServiceConnections,
  getCustomerChildren,
  type CustomerParentId,
  type CustomerRouteResolution,
  type CustomerWorkflowNode
} from "@/lib/customer-navigation";
import styles from "./customer-workspace.module.css";

type CustomerWorkspaceProps = {
  route: CustomerRouteResolution;
};

function customerDescription(node: CustomerWorkflowNode) {
  const descriptions: Record<string, string> = {
    "dashboard-current-song": "Return to the song or program you are currently part of.",
    "dashboard-progress-timeline": "See where your song is in the journey from story to finished recording.",
    "dashboard-next-action": "See whether there is anything you need to review, share, schedule, or approve.",
    "dashboard-messages": "Read messages about your song and the next steps in the process.",
    "dashboard-recent-activity": "See recent updates connected to your song.",
    "journey-request": "Review the request that started this song journey.",
    "journey-interview": "See interview details and move into interview scheduling or preparation.",
    "journey-story-development": "Follow the story as memories and details are shaped into the song.",
    "journey-lyrics": "See when lyrics are ready for you to review.",
    "journey-production": "Follow the song as it moves through recording and final preparation.",
    "journey-delivery": "Open the finished song and keepsakes when they are ready.",
    "story-guided-questions": "Answer guided questions that help us understand the person and the memories that matter.",
    "story-life-timeline": "Add important moments that help tell the story in the right order.",
    "story-people-relationships": "Add the people and relationships that matter to this story.",
    "story-places": "Add places that hold meaning in the story.",
    "story-important-events": "Add milestones and moments you want the songwriter to understand.",
    "story-values-personality": "Share personality, values, sayings, passions, and qualities that should come through in the song.",
    "story-favorite-music-style": "Share musical preferences that can help guide the feel of the song.",
    "story-uploads": "Add photographs, documents, audio, and other memories that help tell the story.",
    "uploads-photos": "Add photographs that help bring the story to life.",
    "uploads-documents": "Add letters, notes, clippings, or other documents connected to the story.",
    "uploads-audio": "Add voice recordings or other audio that helps preserve a memory or detail.",
    "uploads-other-memories": "Add other materials that may help the songwriter understand the story.",
    "interviews-schedule": "Choose a time for your story conversation.",
    "interviews-upcoming": "Review the details for your next interview.",
    "interviews-reschedule": "Choose a different time for an interview.",
    "interviews-preparation": "See simple prompts that can help you get ready for the conversation.",
    "reviews-current-draft": "Read the lyrics currently shared with you for review.",
    "reviews-previous-versions": "Look back at earlier versions that were shared with you.",
    "reviews-submit-feedback": "Share comments about the version you are reviewing.",
    "reviews-request-revision": "Ask for a change when something important needs to be adjusted.",
    "reviews-approve-lyrics": "Approve the lyrics when they feel ready to move forward.",
    "family-invite": "Invite a family member to contribute to the story when appropriate."
  };

  return descriptions[node.id] ?? `Use this area to view or manage ${node.label.toLowerCase()} for your song.`;
}

function ServiceGate({ node }: { node: CustomerWorkflowNode }) {
  if (!node.action) return null;
  const connected = customerServiceConnections[node.action.service];
  if (connected) return <button type="button">{node.action.label}</button>;
  return <div className={styles.gate}>
    <strong>This action is currently unavailable online.</strong>
    <span>You can still review this area. Contact Honor a Life Song if you need help making a change.</span>
    <button disabled type="button">{node.action.label}</button>
  </div>;
}

function OrderSelectionRequired({ node, route }: { node: CustomerWorkflowNode; route: CustomerRouteResolution }) {
  if (!node.requiresOrder || route.orderId) return null;
  return <section className={styles.selectionState} aria-labelledby="customer-selection-heading">
    <p className={styles.kicker}>Choose a song</p>
    <h2 id="customer-selection-heading">Choose the song journey you want to open</h2>
    <p>{node.label} belongs to a specific song. Select a song first to continue.</p>
    <Link className={styles.primaryLink} href={buildCustomerHref({
      parentId: route.parent.id as CustomerParentId,
      childId: route.child?.id,
      grandchildId: route.grandchild?.id,
      orderId: referenceCustomerContext.orderId
    })}>Explore this song journey</Link>
  </section>;
}

function TargetLink({ node, orderId }: { node: CustomerWorkflowNode; orderId?: string }) {
  if (!node.target) return null;
  return <Link className={styles.primaryLink} href={buildCustomerHref({ ...node.target, orderId })}>Open related area</Link>;
}

function JourneyProgressPanel({ orderId }: { orderId?: string }) {
  if (!orderId) return null;
  const phases = deriveJourneyProgress(referenceCustomerContext.journeyState);
  return <div className={styles.timeline} aria-label="Song journey progress">
    {phases.map((phase) => <div className={styles.timelineRow} data-status={phase.status} key={phase.state}>
      <span className={styles.timelineDot} aria-hidden="true" />
      <span>{phase.state}</span>
      <small>{phase.status}</small>
    </div>)}
  </div>;
}

function NextActionPanel({ orderId }: { orderId?: string }) {
  if (!orderId) return null;
  const nextAction = deriveCustomerNextAction(referenceCustomerContext.journeyState);
  if (!nextAction) return <div className={styles.emptyState}>There is nothing you need to do right now.</div>;
  return <div className={styles.nextAction}>
    <strong>{nextAction.label}</strong>
    <Link href={buildCustomerHref({ parentId: nextAction.parentId, childId: nextAction.childId, orderId })}>Continue</Link>
  </div>;
}

function WorkflowSurface({ node, route }: { node: CustomerWorkflowNode; route: CustomerRouteResolution }) {
  if (node.requiresOrder && !route.orderId) return <OrderSelectionRequired node={node} route={route} />;

  return <section className={styles.workflowSurface} aria-labelledby="customer-workflow-heading">
    <p className={styles.kicker}>My Song</p>
    <h2 id="customer-workflow-heading">{node.label}</h2>
    <p>{customerDescription(node)}</p>
    {route.orderId && <div className={styles.contextPill}><span>Current song</span><strong>In progress</strong></div>}
    {node.id === "dashboard-progress-timeline" && <JourneyProgressPanel orderId={route.orderId} />}
    {node.id === "dashboard-next-action" && <NextActionPanel orderId={route.orderId} />}
    {(node.id === "reviews-current-draft" || node.id === "reviews-previous-versions") && <div className={styles.emptyState}>No lyrics have been shared here yet.</div>}
    {node.id === "dashboard-recent-activity" && <div className={styles.emptyState}>No recent activity to show.</div>}
    <TargetLink node={node} orderId={route.orderId} />
    <ServiceGate node={node} />
  </section>;
}

function ChildNavigation({ route }: { route: CustomerRouteResolution }) {
  const parentId = route.parent.id as CustomerParentId;
  const children = getCustomerChildren(parentId);
  if (!children.length) return null;

  return <nav className={styles.childNav} aria-label={`${route.parent.label} options`}>
    {children.map((child) => <Link
      aria-current={route.child?.id === child.id ? "page" : undefined}
      className={route.child?.id === child.id ? styles.active : undefined}
      href={buildCustomerHref({ parentId, childId: child.id, orderId: route.orderId })}
      key={child.id}
    >{child.label}</Link>)}
  </nav>;
}

function UploadGrandchildNavigation({ route }: { route: CustomerRouteResolution }) {
  if (route.parent.id !== "story" || route.child?.id !== "story-uploads") return null;
  return <nav className={styles.grandchildNav} aria-label="Upload options">
    <span>Story & Memories / Uploads</span>
    <div>
      {route.child.grandchildren?.map((grandchild) => <Link
        aria-current={route.grandchild?.id === grandchild.id ? "page" : undefined}
        className={route.grandchild?.id === grandchild.id ? styles.active : undefined}
        href={buildCustomerHref({ parentId: "story", childId: "story-uploads", grandchildId: grandchild.id, orderId: route.orderId })}
        key={grandchild.id}
      >{grandchild.label}</Link>)}
    </div>
  </nav>;
}

function ModuleLanding({ route }: { route: CustomerRouteResolution }) {
  const parentId = route.parent.id as CustomerParentId;
  const children = getCustomerChildren(parentId);
  const leaf = customerLeafDestinations[parentId];

  if (!children.length && leaf) return <WorkflowSurface node={leaf} route={route} />;

  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>My Song</p><h2>{route.parent.label}</h2><p>{route.parent.description}</p></div>
      {route.orderId && <div className={styles.contextPill}><span>Current song</span><strong>In progress</strong></div>}
    </div>
    {children.some((child) => child.requiresOrder) && !route.orderId && <div className={styles.selectionHint}><strong>Choose a song to continue</strong><span>Open an area below to begin.</span></div>}
    <div className={styles.workflowGrid}>
      {children.map((child) => <article key={child.id}>
        <h3>{child.label}</h3>
        <p>{customerDescription(child)}</p>
        <Link href={buildCustomerHref({ parentId, childId: child.id, orderId: route.orderId })}>Open {child.label.toLowerCase()}</Link>
      </article>)}
    </div>
  </section>;
}

function UploadLanding({ route }: { route: CustomerRouteResolution }) {
  if (route.child?.id !== "story-uploads" || route.grandchild) return null;
  if (!route.orderId) return <OrderSelectionRequired node={route.child} route={route} />;
  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Story & Memories</p><h2>Uploads</h2><p>Add photographs, documents, audio, and other memories that can help tell the story.</p></div>
      <div className={styles.contextPill}><span>Current song</span><strong>In progress</strong></div>
    </div>
    <div className={styles.workflowGrid}>
      {route.child.grandchildren?.map((grandchild) => <article key={grandchild.id}>
        <h3>{grandchild.label}</h3>
        <p>{customerDescription(grandchild)}</p>
        <Link href={buildCustomerHref({ parentId: "story", childId: "story-uploads", grandchildId: grandchild.id, orderId: route.orderId })}>Open {grandchild.label.toLowerCase()}</Link>
      </article>)}
    </div>
  </section>;
}

export function CustomerWorkspace({ route }: CustomerWorkspaceProps) {
  const activeWorkflow = route.grandchild ?? route.child;

  return <div className={styles.customerModule}>
    <ChildNavigation route={route} />
    <UploadGrandchildNavigation route={route} />
    {route.child?.id === "story-uploads" && !route.grandchild
      ? <UploadLanding route={route} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} route={route} />
        : <ModuleLanding route={route} />}
  </div>;
}
