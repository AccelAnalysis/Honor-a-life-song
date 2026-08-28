import Link from "next/link";
import { referenceAdminRecordIds } from "@/fixtures/reference-data";
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
  capacity: "Capacity uses recorded workload, active work, commitments, configured limits, and turnaround targets.",
  payment: "Payment, refund, and reconciliation state can only change after server-side confirmation.",
  funding: "Funding relationships do not grant access to participant information.",
  scheduling: "Appointments and events use the shared platform schedule so every workspace sees the same timing.",
  communications: "Email and text delivery use the shared communications service and its delivery status.",
  consent: "Access permission and participant consent are separate requirements. Restrictions and withdrawals continue to apply to administrators.",
  reporting: "Reports use recorded platform activity and do not infer clinical outcomes from program participation.",
  export: "Exports respect access, participant permissions, retention rules, and audit requirements.",
  monitoring: "Alerts and incidents come from recorded service or workflow conditions.",
  configuration: "High-impact settings require server-side authorization and cannot bypass workflow or consent protections.",
  identity: "People, organizations, memberships, and roles share one identity model with least-privilege access."
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
  if (!node.recordKind) return null;

  if (route.recordId) {
    return <div className={styles.recordLine}>
      <span>{node.recordKind.replaceAll("_", " ")}</span>
      <strong>Selected</strong>
    </div>;
  }

  const referenceId = referenceAdminRecordIds[node.recordKind];
  return <Link className={styles.exampleLink} href={buildAdminHref({
    parentId: route.parent.id as AdminParentId,
    childId: node.id,
    recordId: referenceId
  })}>Open example</Link>;
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
  const label = node.id === "catalog-program-templates" ? "Platform Configuration" : "Catalog & Pricing";
  return <Link className={styles.relatedLink} href={buildAdminHref({ ...target, recordId: route.recordId })}>
    Also available in {label}
  </Link>;
}

function EmptyTable({ parentId, node }: { parentId: AdminParentId; node: AdminWorkflowNode }) {
  const columns = columnsByParent[parentId];
  const available = serviceAvailable(node);

  return <div className={styles.tableWrap}>
    <table>
      <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>
        <tr><td className={styles.emptyCell} colSpan={columns.length}>
          {available ? "No items to show." : "No items to show yet."}
        </td></tr>
      </tbody>
    </table>
  </div>;
}

function WorkflowSurface({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  const parentId = route.parent.id as AdminParentId;
  return <section className={styles.workArea} aria-labelledby="admin-workflow-heading">
    <header className={styles.workHeader}>
      <div>
        <h2 id="admin-workflow-heading">{node.label}</h2>
        <p>{node.description}</p>
      </div>
      <ActionArea node={node} />
    </header>

    <div className={styles.utilityLine}>
      <RecordContext node={node} route={route} />
      <ProgramTemplateLink node={node} route={route} />
    </div>

    <EmptyTable parentId={parentId} node={node} />
    <PolicyDetails node={node} />
  </section>;
}

function MonitoringLeaf() {
  return <section className={styles.workArea} aria-labelledby="monitoring-heading">
    <header className={styles.workHeader}>
      <div>
        <h2 id="monitoring-heading">Monitoring & Incidents</h2>
        <p>Service health, failures, and incidents that need attention.</p>
      </div>
    </header>
    <div className={styles.tableWrap}>
      <table>
        <thead><tr><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Updated</th></tr></thead>
        <tbody><tr><td className={styles.emptyCell} colSpan={3}>No monitoring data to show yet.</td></tr></tbody>
      </table>
    </div>
  </section>;
}

function ParentOverview({ route, children }: { route: AdminRouteResolution; children: readonly AdminWorkflowNode[] }) {
  const parentId = route.parent.id as AdminParentId;
  return <section className={styles.workArea} aria-labelledby="admin-overview-heading">
    <header className={styles.workHeader}>
      <div>
        <h2 id="admin-overview-heading">{route.parent.label}</h2>
        <p>{route.parent.description}</p>
      </div>
    </header>

    <div className={styles.workflowList}>
      {children.map((child) => <Link href={buildAdminHref({ parentId, childId: child.id })} key={child.id}>
        <span>{child.label}</span><span aria-hidden="true">→</span>
      </Link>)}
    </div>
  </section>;
}

export function AdminWorkspace({ route }: AdminWorkspaceProps) {
  const parentId = route.parent.id as AdminParentId;
  const children = getAdminChildren(parentId);

  return <div className={styles.adminModule}>
    {children.length > 0 && <nav className={styles.childNav} aria-label={`${route.parent.label} workflows`}>
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
        : <ParentOverview route={route} children={children} />}
  </div>;
}
