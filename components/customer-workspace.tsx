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

function BoundaryList({ node }: { node: CustomerWorkflowNode }) {
  return <div className={styles.boundaries} aria-label="Shared platform boundaries">
    {node.boundaries.map((boundary) => <span key={boundary}>{boundary}</span>)}
  </div>;
}

function ExposureNotice({ node }: { node: CustomerWorkflowNode }) {
  if (!node.exposure) return null;
  const copy = node.exposure === "family_scoped"
    ? "Family access is scoped to the selected order and the permissions actually granted; family relationship alone does not create ownership or broad access."
    : node.exposure === "secure_delivery"
      ? "Final assets remain behind Secure Delivery entitlement, consent, and asset-authorization checks; permanent public object-storage URLs are not exposed."
      : "Customer-private information remains limited to the authorized order/song journey and does not expose internal Creator, Facility, Sponsor, or Admin records.";
  return <div className={styles.exposure}><strong>Information boundary</strong><span>{copy}</span></div>;
}

function ConsentNotice({ node }: { node: CustomerWorkflowNode }) {
  if (node.managesConsentScope) {
    return <div className={styles.consent}>
      <strong>Authorization and consent are separate</strong>
      <span>This workflow manages the <code>{node.managesConsentScope}</code> consent scope. The actor must also be authorized to grant, restrict, or withdraw that consent on the subject&apos;s behalf.</span>
    </div>;
  }
  if (!node.requiredConsentScopes?.length) return null;
  return <div className={styles.consent}>
    <strong>Authorization + consent required</strong>
    <span>Required scope: {node.requiredConsentScopes.join(", ")}. Entitlement alone does not satisfy consent.</span>
  </div>;
}

function ReleaseNotice({ node }: { node: CustomerWorkflowNode }) {
  if (node.release !== "P1") return null;
  return <div className={styles.release}>
    <strong>P1 integration point</strong>
    <span>The source-defined destination is represented now, but the richer P1 capability is not falsely marked production-live.</span>
  </div>;
}

function IntegrityNotice({ node }: { node: CustomerWorkflowNode }) {
  if (node.id === "reviews-approve-lyrics") {
    return <div className={styles.integrity}><strong>Exact-version approval</strong><span>Lyric approval must identify the exact LyricVersion being approved and move forward only through the governed workflow authority.</span></div>;
  }
  if (node.id === "orders-deposit-balance" || node.id === "orders-refund-status") {
    return <div className={styles.integrity}><strong>Server-authoritative commerce</strong><span>Client state, redirects, query parameters, or visual success cannot mark an order paid or refunded.</span></div>;
  }
  if (node.id === "journey-production") {
    return <div className={styles.integrity}><strong>Customer production view only</strong><span>Composition notes, arrangements, stems, raw recordings, mixing/mastering controls, creator assignments, and internal QA remain outside the Customer workspace.</span></div>;
  }
  return null;
}

function ServiceGate({ node }: { node: CustomerWorkflowNode }) {
  if (!node.action) {
    return <div className={styles.gate}><strong>Structural workflow available</strong><span>Authoritative records for this workflow are not connected in the reference chassis.</span></div>;
  }
  const connected = customerServiceConnections[node.action.service];
  return <div className={styles.gate}>
    <strong>{connected ? "Production service connected" : "Production action gated"}</strong>
    <span>{connected ? `${node.action.service} is available through the shared platform boundary.` : `${node.action.service} is not connected; the platform will not simulate success.`}</span>
    <button disabled={!connected} type="button">{node.action.label}</button>
  </div>;
}

function OrderSelectionRequired({ node, route }: { node: CustomerWorkflowNode; route: CustomerRouteResolution }) {
  if (!node.requiresOrder || route.orderId) return null;
  return <section className={styles.selectionState} aria-labelledby="customer-selection-heading">
    <p className={styles.kicker}>Selected order required</p>
    <h2 id="customer-selection-heading">Choose the song journey first</h2>
    <p>{node.label} operates on one canonical order/song journey. The platform does not guess which order the customer intended to open.</p>
    <Link className={styles.primaryLink} href={buildCustomerHref({
      parentId: route.parent.id as CustomerParentId,
      childId: route.child?.id,
      grandchildId: route.grandchild?.id,
      orderId: referenceCustomerContext.orderId
    })}>Open synthetic reference order</Link>
  </section>;
}

function TargetLink({ node, orderId }: { node: CustomerWorkflowNode; orderId?: string }) {
  if (!node.target) return null;
  return <Link className={styles.primaryLink} href={buildCustomerHref({ ...node.target, orderId })}>Open corresponding workflow</Link>;
}

function JourneyProgressPanel({ orderId }: { orderId?: string }) {
  if (!orderId) return null;
  const phases = deriveJourneyProgress(referenceCustomerContext.journeyState);
  return <div className={styles.timeline} aria-label="Governed song journey progress">
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
  if (!nextAction) return <div className={styles.emptyState}>The governed reference state does not require a customer action. No artificial call to action is being created.</div>;
  return <div className={styles.nextAction}>
    <span>Derived from: {referenceCustomerContext.journeyState}</span>
    <strong>{nextAction.label}</strong>
    <Link href={buildCustomerHref({ parentId: nextAction.parentId, childId: nextAction.childId, orderId })}>Open next workflow</Link>
  </div>;
}

function WorkflowSurface({ node, route }: { node: CustomerWorkflowNode; route: CustomerRouteResolution }) {
  if (node.requiresOrder && !route.orderId) return <OrderSelectionRequired node={node} route={route} />;

  return <section className={styles.workflowSurface} aria-labelledby="customer-workflow-heading">
    <p className={styles.kicker}>Concrete workflow boundary</p>
    <h2 id="customer-workflow-heading">{node.label}</h2>
    <p>{node.description}</p>
    {route.orderId && <div className={styles.contextPill}><span>Selected Order / Song Journey</span><strong>{route.orderId}</strong></div>}
    {node.id === "dashboard-progress-timeline" && <JourneyProgressPanel orderId={route.orderId} />}
    {node.id === "dashboard-next-action" && <NextActionPanel orderId={route.orderId} />}
    {(node.id === "reviews-current-draft" || node.id === "reviews-previous-versions") && <div className={styles.emptyState}>Reference mode intentionally contains no fabricated lyric content. Production must load only LyricVersion records actually shared with this customer.</div>}
    {node.id === "dashboard-recent-activity" && <div className={styles.emptyState}>No fabricated activity is shown. Production activity must be filtered to customer-appropriate events for the selected order.</div>}
    <BoundaryList node={node} />
    <ConsentNotice node={node} />
    <ExposureNotice node={node} />
    <ReleaseNotice node={node} />
    <IntegrityNotice node={node} />
    <TargetLink node={node} orderId={route.orderId} />
    <ServiceGate node={node} />
  </section>;
}

function ChildNavigation({ route }: { route: CustomerRouteResolution }) {
  const parentId = route.parent.id as CustomerParentId;
  const children = getCustomerChildren(parentId);
  if (!children.length) return null;

  return <nav className={styles.childNav} aria-label={`${route.parent.label} workflows`}>
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
  return <nav className={styles.grandchildNav} aria-label="Upload workflows">
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
      <div><p className={styles.kicker}>Customer module</p><h2>{route.parent.label}</h2><p>{route.parent.description}</p></div>
      {route.orderId && <div className={styles.contextPill}><span>Selected Order / Song Journey</span><strong>{route.orderId}</strong></div>}
    </div>
    {children.some((child) => child.requiresOrder) && !route.orderId && <div className={styles.selectionHint}><strong>Selected-order context required</strong><span>Open a child workflow to choose the canonical order/song journey. The UI will not infer one from unrelated state.</span></div>}
    <div className={styles.workflowGrid}>
      {children.map((child) => <article key={child.id}>
        <h3>{child.label}</h3>
        <p>{child.description}</p>
        <BoundaryList node={child} />
        {child.release === "P1" && <small>P1 integration point</small>}
        <Link href={buildCustomerHref({ parentId, childId: child.id, orderId: route.orderId })}>Open workflow</Link>
      </article>)}
    </div>
  </section>;
}

function UploadLanding({ route }: { route: CustomerRouteResolution }) {
  if (route.child?.id !== "story-uploads" || route.grandchild) return null;
  if (!route.orderId) return <OrderSelectionRequired node={route.child} route={route} />;
  return <section>
    <div className={styles.moduleIntro}>
      <div><p className={styles.kicker}>Genuine grandchild hierarchy</p><h2>Uploads</h2><p>Photos, Documents, Audio, and Other Memories are separate route-backed grandchildren under Story & Memories → Uploads. All remain attached to the same selected order/story context.</p></div>
      <div className={styles.contextPill}><span>Selected Order / Song Journey</span><strong>{route.orderId}</strong></div>
    </div>
    <div className={styles.workflowGrid}>
      {route.child.grandchildren?.map((grandchild) => <article key={grandchild.id}>
        <h3>{grandchild.label}</h3>
        <p>{grandchild.description}</p>
        <Link href={buildCustomerHref({ parentId: "story", childId: "story-uploads", grandchildId: grandchild.id, orderId: route.orderId })}>Open upload workflow</Link>
      </article>)}
    </div>
  </section>;
}

export function CustomerWorkspace({ route }: CustomerWorkspaceProps) {
  const activeWorkflow = route.grandchild ?? route.child;

  return <div className={styles.customerModule}>
    <div className={styles.structureBanner}>
      <strong>Workflow structure active</strong>
      <span>The source-defined Customer / Family song-journey hierarchy is navigable. Production persistence, scheduling, payments, messaging, uploads, invitations, approvals, consent mutation, fulfillment, and secure-delivery actions remain explicitly gated where services are not connected.</span>
    </div>
    <ChildNavigation route={route} />
    <UploadGrandchildNavigation route={route} />
    {route.child?.id === "story-uploads" && !route.grandchild
      ? <UploadLanding route={route} />
      : activeWorkflow
        ? <WorkflowSurface node={activeWorkflow} route={route} />
        : <ModuleLanding route={route} />}
  </div>;
}
