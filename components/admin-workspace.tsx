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

const policyCopy: Record<AdminIntegrityKind, string> = {
  capacity: "Capacity should reflect assigned work, active commitments, configured limits, and actual staffing rather than estimates presented as facts.",
  payment: "A payment, refund, or reconciliation should only be treated as complete when the recorded financial activity confirms it.",
  funding: "Sponsors, facilities, nonprofits, and grant-supported partners do not receive participant information simply because they fund a program.",
  scheduling: "Customer interviews, facility activities, creator commitments, and administrative scheduling should stay aligned so the same event is not represented differently in different areas.",
  communications: "Send and track customer, family, facility, creator, and program communication from one coordinated place.",
  consent: "Administrative access never overrides a participant's choices about recording, sharing, performance, photography, publication, or other uses.",
  reporting: "Use real records and timestamps for reporting, and do not turn participation or satisfaction measures into unsupported clinical claims.",
  export: "Exports should respect the person's access level, the purpose of the export, participant permissions, and applicable retention or deletion requirements.",
  monitoring: "Alerts and incidents should reflect actual failures, service health, blockers, or operational conditions.",
  configuration: "Settings should not override privacy, payment integrity, required approvals, or security protections.",
  identity: "Customers, families, facilities, creators, sponsors, partners, and administrators should receive only the access appropriate to their role."
};

const columnsByParent: Record<AdminParentId, readonly string[]> = {
  "admin-home": ["Area", "Status", "Updated"],
  requests: ["Request", "Type", "Status", "Received"],
  programs: ["Work", "Customer / Facility", "Status", "Due"],
  people: ["Name", "Type", "Access", "Activity"],
  catalog: ["Item", "Type", "Rule / Price", "Status"],
  finance: ["Reference", "Party", "Status", "Amount"],
  scheduling: ["Date", "Type", "With", "Status"],
  communications: ["Recipient", "Channel", "Status", "Sent"],
  consent: ["Person", "Permission", "Status", "Updated"],
  reports: ["Report", "Period", "Updated"],
  monitoring: ["Service", "Status", "Updated"],
  settings: ["Setting", "Status", "Updated"]
};

function serviceAvailable(node: AdminWorkflowNode) {
  if (node.action) return adminServiceConnections[node.action.service];
  return node.boundaries.some((boundary) => adminServiceConnections[boundary]);
}

function ActionArea({ node }: { node: AdminWorkflowNode }) {
  if (!node.action) return null;
  const connected = adminServiceConnections[node.action.service];
  return <div className={styles.actionArea}>
    <button disabled={!connected} type="button">{node.action.label}</button>
    {!connected && <span>Not available yet</span>}
  </div>;
}

function RecordContext({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  if (!node.recordKind || !route.recordId) return null;
  return <div className={styles.recordLine}>
    <span>{node.recordKind.replaceAll("_", " ")}</span>
    <strong>Selected</strong>
  </div>;
}

function PolicyDetails({ node }: { node: AdminWorkflowNode }) {
  if (!node.integrity) return null;
  return <details className={styles.policyDetails}>
    <summary>Permissions and data rules</summary>
    <p>{policyCopy[node.integrity]}</p>
  </details>;
}

function ProgramTemplateLink({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  if (node.id !== "catalog-program-templates" && node.id !== "settings-program-templates") return null;
  const target = node.id === "catalog-program-templates"
    ? { parentId: "settings" as const, childId: "settings-program-templates" }
    : { parentId: "catalog" as const, childId: "catalog-program-templates" };
  const label = node.id === "catalog-program-templates" ? "Settings" : "Catalog & Pricing";
  return <Link className={styles.relatedLink} href={buildAdminHref({ ...target, recordId: route.recordId })}>Also available in {label}</Link>;
}

function EmptyTable({ parentId, node }: { parentId: AdminParentId; node: AdminWorkflowNode }) {
  const columns = columnsByParent[parentId];
  const available = serviceAvailable(node);
  return <div className={styles.tableWrap}>
    <table>
      <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody><tr><td className={styles.emptyCell} colSpan={columns.length}>{available ? "No items to show." : "No items to show yet."}</td></tr></tbody>
    </table>
  </div>;
}

function WorkflowSurface({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  const parentId = route.parent.id as AdminParentId;
  return <section className={styles.workArea} aria-label={node.label}>
    <div className={styles.toolbar}>
      <div className={styles.utilityLine}>
        <RecordContext node={node} route={route} />
        <ProgramTemplateLink node={node} route={route} />
      </div>
      <ActionArea node={node} />
    </div>
    <EmptyTable parentId={parentId} node={node} />
    <PolicyDetails node={node} />
  </section>;
}

function MonitoringLeaf() {
  return <section className={styles.workArea} aria-label="Monitoring & Incidents">
    <div className={styles.tableWrap}>
      <table>
        <thead><tr><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Updated</th></tr></thead>
        <tbody><tr><td className={styles.emptyCell} colSpan={3}>No monitoring information to show yet.</td></tr></tbody>
      </table>
    </div>
  </section>;
}

function ParentOverview({ route, items }: { route: AdminRouteResolution; items: readonly AdminWorkflowNode[] }) {
  const parentId = route.parent.id as AdminParentId;
  return <section className={styles.workArea} aria-label={`${route.parent.label} options`}>
    <div className={styles.workflowList}>
      {items.map((child) => <Link href={buildAdminHref({ parentId, childId: child.id })} key={child.id}>
        <span>{child.label}</span><span aria-hidden="true">→</span>
      </Link>)}
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
        : <ParentOverview route={route} items={children} />}
  </div>;
}
