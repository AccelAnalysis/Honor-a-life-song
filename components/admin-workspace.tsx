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

function BoundaryList({ node }: { node: AdminWorkflowNode }) {
  return <div className={styles.boundaries} aria-label="Shared platform boundaries">
    {node.boundaries.map((boundary) => <span key={boundary}>{boundary}</span>)}
  </div>;
}

const integrityCopy: Record<AdminIntegrityKind, { title: string; body: string }> = {
  capacity: {
    title: "Capacity is operational, not speculative",
    body: "Use supported workload, active work, configured limits, commitments, and targets only. Improved forecasting remains a later enhancement until a real forecasting model exists."
  },
  payment: {
    title: "Server-authoritative finance",
    body: "Client state, redirects, query parameters, or visual success cannot mark a payment successful, issue a refund, or declare reconciliation complete."
  },
  funding: {
    title: "Funding does not create participant access",
    body: "Sponsor, facility, nonprofit, and grant-supported funding relationships remain separate from participant authorization and consent. This surface is not grant-application management."
  },
  scheduling: {
    title: "One shared scheduling authority",
    body: "Customer, Facility, Creator, and Admin scheduling must resolve through the same scheduling boundary so calendars cannot disagree."
  },
  communications: {
    title: "Shared communication boundary",
    body: "Admin workflows create normalized communication intents. Provider adapters handle email/SMS delivery, and unconnected providers cannot appear to send successfully."
  },
  consent: {
    title: "Authorization + consent",
    body: "Admin privilege never becomes a universal consent bypass. Restrictions and withdrawals must fail closed for future covered use while preserving required audit evidence."
  },
  reporting: {
    title: "Authoritative reporting only",
    body: "Reports derive from canonical records and real timestamps. Reference-mode values are not presented as production metrics, and Project Ageless experience measures are not converted into unsupported clinical claims."
  },
  export: {
    title: "Governed export boundary",
    body: "Exports require role authorization, valid scope, applicable participant consent, retention/deletion compliance, and auditability. There is no consent-bypassing Export All path."
  },
  monitoring: {
    title: "Traceable operational conditions",
    body: "Alerts and incidents must originate from actual service health, failures, blockers, or governed operational state. No arbitrary AI alerts or fake live monitoring are generated."
  },
  configuration: {
    title: "High-impact configuration stays server-side",
    body: "Feature flags and integration settings cannot bypass authorization, consent, workflow prerequisites, payment integrity, or security. Secrets are never exposed to the browser."
  },
  identity: {
    title: "Canonical identity and least privilege",
    body: "People, organizations, memberships, and roles remain shared platform records. Family, sponsor, facility, creator, and Admin contexts do not create duplicate identity systems or automatic broad access."
  }
};

function IntegrityNotice({ kind }: { kind?: AdminIntegrityKind }) {
  if (!kind) return null;
  const copy = integrityCopy[kind];
  return <div className={styles.integrity}><strong>{copy.title}</strong><span>{copy.body}</span></div>;
}

function ServiceGate({ node }: { node: AdminWorkflowNode }) {
  if (!node.action) {
    const connected = node.boundaries.some((boundary) => adminServiceConnections[boundary]);
    return <div className={styles.gate}>
      <strong>{connected ? "Authoritative service available" : "Authoritative data not connected"}</strong>
      <span>{connected ? "This read surface may consume the connected shared service." : "The workflow structure is implemented, but reference mode will not invent production records or authoritative metrics."}</span>
    </div>;
  }

  const connected = adminServiceConnections[node.action.service];
  return <div className={styles.gate}>
    <strong>{connected ? "Production action connected" : "Production action gated"}</strong>
    <span>{connected ? `${node.action.service} is available through the shared platform service boundary.` : `${node.action.service} is not connected; this Admin surface will not simulate authoritative success.`}</span>
    <button disabled={!connected} type="button">{node.action.label}</button>
  </div>;
}

function RecordContext({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  if (!node.recordKind) return null;
  if (route.recordId) {
    return <div className={styles.contextPill}>
      <span>Selected canonical <span className={styles.recordKind}>{node.recordKind.replaceAll("_", " ")}</span></span>
      <strong>{route.recordId}</strong>
    </div>;
  }

  const parentId = route.parent.id as AdminParentId;
  const referenceId = referenceAdminRecordIds[node.recordKind];
  return <div className={styles.recordHint}>
    <strong>Selected-record deep link supported</strong>
    <span>This workflow can preserve one canonical {node.recordKind.replaceAll("_", " ")} identity in the URL. The interface does not guess which record an administrator intended to open.</span>
    <Link className={styles.primaryLink} href={buildAdminHref({ parentId, childId: node.id, recordId: referenceId })}>Open synthetic reference record</Link>
  </div>;
}

function ProgramTemplateOverlap({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  if (node.id !== "catalog-program-templates" && node.id !== "settings-program-templates") return null;
  const target = node.id === "catalog-program-templates"
    ? { parentId: "settings" as const, childId: "settings-program-templates" }
    : { parentId: "catalog" as const, childId: "catalog-program-templates" };
  return <div className={styles.sharedRecord}>
    <strong>One canonical ProgramTemplate record</strong>
    <span>The source intentionally exposes Program Templates from both Catalog & Pricing and Platform Configuration. These are two operational entry points, not two persisted template systems.</span>
    <Link className={styles.primaryLink} href={buildAdminHref({ ...target, recordId: route.recordId })}>Open the other Program Templates entry point</Link>
  </div>;
}

function WorkflowSurface({ node, route }: { node: AdminWorkflowNode; route: AdminRouteResolution }) {
  return <section className={styles.workflowSurface} aria-labelledby="admin-workflow-heading">
    <p className={styles.kicker}>Concrete operational workflow boundary</p>
    <div className={styles.moduleIntro}>
      <div>
        <h2 id="admin-workflow-heading">{node.label}</h2>
        <p>{node.description}</p>
      </div>
      {route.recordId && node.recordKind ? <RecordContext node={node} route={route} /> : null}
    </div>
    {!route.recordId ? <RecordContext node={node} route={route} /> : null}
    <BoundaryList node={node} />
    <IntegrityNotice kind={node.integrity} />
    <ProgramTemplateOverlap node={node} route={route} />
    <ServiceGate node={node} />
  </section>;
}

function MonitoringLeaf() {
  return <section className={styles.leafSurface} aria-labelledby="monitoring-heading">
    <p className={styles.kicker}>Source-defined leaf integration point</p>
    <h2 id="monitoring-heading">Monitoring & Incidents</h2>
    <p>The source defines no child navigation beneath this destination. It remains the cross-platform operational-health integration point for shared service health, errors, failed jobs, integration failures, incidents, and recovery information.</p>
    <div className={styles.leafNotice}>
      <strong>Production monitoring is not connected</strong>
      <span>No synthetic uptime, incident, failure, recovery, or service-health event is presented as live. A production monitoring adapter should plug into this boundary later without creating a second monitoring platform.</span>
    </div>
  </section>;
}

export function AdminWorkspace({ route }: AdminWorkspaceProps) {
  const parentId = route.parent.id as AdminParentId;
  const children = getAdminChildren(parentId);

  return <div className={styles.adminModule}>
    <div className={styles.structureBanner}>
      <strong>ADMIN CONTROL PLANE</strong>
      <span>This hierarchy operates on shared canonical records and shared service boundaries. It does not create AdminOrder, AdminProgram, AdminConsent, AdminPayment, or other parallel business entities.</span>
    </div>

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
        : <>
          <div className={styles.moduleIntro}>
            <div>
              <p className={styles.kicker}>Source-defined child hierarchy</p>
              <h2>{route.parent.label}</h2>
              <p>{route.parent.description}</p>
            </div>
            <div className={styles.contextPill}><span>Control-plane state</span><strong>Structure active · production services gated</strong></div>
          </div>
          <section className={styles.workflowGrid} aria-label={`${route.parent.label} child workflows`}>
            {children.map((child) => <article key={child.id}>
              <h3>{child.label}</h3>
              <p>{child.description}</p>
              <BoundaryList node={child} />
              <Link href={buildAdminHref({ parentId, childId: child.id })}>Open workflow</Link>
            </article>)}
          </section>
        </>}

    <p className={styles.smallNote}>System Settings remains source-defined outside this bounded 12-page chassis slice and is not added as a thirteenth Admin destination.</p>
  </div>;
}
