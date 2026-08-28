import Link from "next/link";
import {
  adminServiceConnections,
  buildAdminHref,
  getAdminChildren,
  type AdminIntegrityKind,
  type AdminParentId,
  type AdminRouteResolution,
  type AdminWorkflowNode
} from "@/lib/admin-navigation";
import styles from "./admin-workspace.module.css";

type AdminWorkspaceProps = {
  route: AdminRouteResolution;
};

const integrityCopy: Record<AdminIntegrityKind, { title: string; body: string }> = {
  capacity: {
    title: "Use real workload and capacity",
    body: "Capacity should reflect assigned work, active commitments, configured limits, and actual staffing rather than estimates presented as facts."
  },
  payment: {
    title: "Use recorded payment status",
    body: "A payment, refund, or reconciliation should only be treated as complete when the recorded financial activity confirms it."
  },
  funding: {
    title: "Funding does not create participant access",
    body: "Sponsors, facilities, nonprofits, and grant-supported partners do not receive participant information simply because they fund a program."
  },
  scheduling: {
    title: "Keep one coordinated schedule",
    body: "Customer interviews, facility activities, creator commitments, and administrative scheduling should stay aligned so the same event is not represented differently in different areas."
  },
  communications: {
    title: "Keep communication together",
    body: "Send and track customer, family, facility, creator, and program communication from one coordinated place."
  },
  consent: {
    title: "Access and permission are separate",
    body: "Administrative access never overrides a participant's choices about recording, sharing, performance, photography, publication, or other uses."
  },
  reporting: {
    title: "Report what actually happened",
    body: "Use real records and timestamps for reporting, and do not turn participation or satisfaction measures into unsupported clinical claims."
  },
  export: {
    title: "Protect information when exporting",
    body: "Exports should respect the person's access level, the purpose of the export, participant permissions, and applicable retention or deletion requirements."
  },
  monitoring: {
    title: "Use traceable operational information",
    body: "Alerts and incidents should reflect actual failures, service health, blockers, or operational conditions."
  },
  configuration: {
    title: "Protect high-impact settings",
    body: "Settings should not override privacy, payment integrity, required approvals, or security protections."
  },
  identity: {
    title: "Keep roles and access clear",
    body: "Customers, families, facilities, creators, sponsors, partners, and administrators should receive only the access appropriate to their role."
  }
};

function IntegrityNotice({ kind }: { kind?: AdminIntegrityKind }) {
  if (!kind) return null;
  const copy = integrityCopy[kind];
  return <div className={styles.integrity}><strong>{copy.title}</strong><span>{copy.body}</span></div>;
}

function adminDescription(node: AdminWorkflowNode) {
  return `Use this area to review or manage ${node.label.toLowerCase()} across Honor a Life Song.`;
}

function ServiceGate({ node }: { node: AdminWorkflowNode }) {
  if (!node.action) {
    const connected = node.boundaries.some((boundary) => adminServiceConnections[boundary]);
    return connected ? null : <div className={styles.gate}><strong>Data is not available yet.</strong><span>This area will show operational information when it becomes available.</span></div>;
  }

  const connected = adminServiceConnections[node.action.service];
  if (connected) return <button type="button">{node.action.label}</button>;
  return <div className={styles.gate}>
    <strong>This action is currently unavailable.</strong>
    <span>You can review this area now, but changes cannot be submitted here yet.</span>
    <button disabled type="button">{node.action.label}</button>
  </div>;
}

function RecordContext({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  if (!node.recordKind || !route.recordId) return null;
  return <div className={styles.contextPill}>
    <span>Selected {node.recordKind.replaceAll("_", " ")}</span>
    <strong>{route.recordId}</strong>
  </div>;
}

function ProgramTemplateOverlap({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  if (node.id !== "catalog-program-templates" && node.id !== "settings-program-templates") return null;
  const target = node.id === "catalog-program-templates"
    ? { parentId: "settings" as const, childId: "settings-program-templates" }
    : { parentId: "catalog" as const, childId: "catalog-program-templates" };
  return <div className={styles.sharedRecord}>
    <strong>Program Templates</strong>
    <span>Program Templates can be opened from both Catalog & Pricing and Settings so operations staff can reach the same program setup from either task.</span>
    <Link className={styles.primaryLink} href={buildAdminHref({ ...target, recordId: route.recordId })}>Open the other Program Templates view</Link>
  </div>;
}

function WorkflowSurface({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  return <section className={styles.workflowSurface} aria-labelledby="admin-workflow-heading">
    <p className={styles.kicker}>Operations</p>
    <div className={styles.moduleIntro}>
      <div>
        <h2 id="admin-workflow-heading">{node.label}</h2>
        <p>{adminDescription(node)}</p>
      </div>
      <RecordContext node={node} route={route} />
    </div>
    <IntegrityNotice kind={node.integrity} />
    <ProgramTemplateOverlap node={node} route={route} />
    <ServiceGate node={node} />
  </section>;
}

function MonitoringLeaf() {
  return <section className={styles.leafSurface} aria-labelledby="monitoring-heading">
    <p className={styles.kicker}>Operations</p>
    <h2 id="monitoring-heading">Monitoring & Incidents</h2>
    <p>Review service health, failures, incidents, and recovery information that may affect customers, programs, creators, payments, messages, or delivery.</p>
    <div className={styles.leafNotice}>
      <strong>No monitoring information is available yet.</strong>
      <span>Operational alerts and incidents will appear here when monitoring is connected.</span>
    </div>
  </section>;
}

export function AdminWorkspace({ route }: AdminWorkspaceProps) {
  const parentId = route.parent.id as AdminParentId;
  const children = getAdminChildren(parentId);

  return <div className={styles.adminModule}>
    {children.length > 0 && <nav className={styles.childNav} aria-label={`${route.parent.label} options`}>
      {children.map((child) => <Link
        aria-current={route.child?.id === child.id ? "page" : undefined}
        className={route.child?.id === child.id ? styles.active : ""}
        href={buildAdminHref({ parentId, childId: child.id, recordId: route.child?.id === child.id ? route.recordId : undefined })}
        key={child.id}
      >{child.label}</Link>)}
    </nav>}

    {parentId === "monitoring"
      ? <MonitoringLeaf />
      : route.child
        ? <WorkflowSurface node={route.child} route={route} />
        : <>
          <div className={styles.moduleIntro}>
            <div>
              <p className={styles.kicker}>Operations</p>
              <h2>{route.parent.label}</h2>
              <p>{route.parent.description}</p>
            </div>
          </div>
          <section className={styles.workflowGrid} aria-label={`${route.parent.label} options`}>
            {children.map((child) => <article key={child.id}>
              <h3>{child.label}</h3>
              <p>{adminDescription(child)}</p>
              <Link href={buildAdminHref({ parentId, childId: child.id })}>Open {child.label.toLowerCase()}</Link>
            </article>)}
          </section>
        </>}
  </div>;
}
