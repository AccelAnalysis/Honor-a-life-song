import { workspaceNavigation, type NavigationItem } from "./navigation";

export type AdminParentId =
  | "admin-home"
  | "requests"
  | "programs"
  | "people"
  | "catalog"
  | "finance"
  | "scheduling"
  | "communications"
  | "consent"
  | "reports"
  | "monitoring"
  | "settings";

export type AdminServiceBoundary =
  | "requests"
  | "orders"
  | "programs"
  | "people"
  | "catalog"
  | "payments"
  | "funding"
  | "scheduling"
  | "communications"
  | "consent"
  | "reporting"
  | "audit"
  | "monitoring"
  | "configuration"
  | "secure-delivery";

export type AdminRecordKind =
  | "inquiry"
  | "order"
  | "program"
  | "person"
  | "organization"
  | "package"
  | "program_template"
  | "commercial"
  | "funding"
  | "schedule"
  | "communication"
  | "consent"
  | "audit"
  | "configuration";

export type AdminIntegrityKind =
  | "capacity"
  | "payment"
  | "funding"
  | "scheduling"
  | "communications"
  | "consent"
  | "reporting"
  | "export"
  | "monitoring"
  | "configuration"
  | "identity";

export type AdminWorkflowAction = {
  label: string;
  service: AdminServiceBoundary;
};

export type AdminWorkflowNode = {
  id: string;
  label: string;
  slug: string;
  description: string;
  boundaries: readonly AdminServiceBoundary[];
  action?: AdminWorkflowAction;
  recordKind?: AdminRecordKind;
  integrity?: AdminIntegrityKind;
};

export type AdminRouteResolution = {
  parent: NavigationItem;
  child?: AdminWorkflowNode;
  recordId?: string;
};

export const adminServiceConnections: Record<AdminServiceBoundary, boolean> = {
  requests: false,
  orders: false,
  programs: false,
  people: false,
  catalog: false,
  payments: false,
  funding: false,
  scheduling: false,
  communications: false,
  consent: false,
  reporting: false,
  audit: false,
  monitoring: false,
  configuration: false,
  "secure-delivery": false
};

const node = (
  id: string,
  label: string,
  slug: string,
  description: string,
  boundaries: readonly AdminServiceBoundary[],
  options: Pick<AdminWorkflowNode, "action" | "recordKind" | "integrity"> = {}
): AdminWorkflowNode => ({ id, label, slug, description, boundaries, ...options });

export const adminChildren: Record<AdminParentId, readonly AdminWorkflowNode[]> = {
  "admin-home": [
    node("dashboard-new-requests", "New Requests", "new-requests", "New or actionable inquiries entering the service. Qualification remains owned by Requests / CRM-Lite rather than duplicated on the dashboard.", ["requests"], { recordKind: "inquiry" }),
    node("dashboard-active-orders", "Active Orders", "active-orders", "Active individual orders derived from authoritative order and song-workflow state; cancelled, declined, delivered/closed work is not counted merely because records exist.", ["orders"], { recordKind: "order" }),
    node("dashboard-active-programs", "Active Programs", "active-programs", "Active ProgramRun records across Project Ageless and other configured program templates.", ["programs"], { recordKind: "program" }),
    node("dashboard-songs-completed", "Songs Completed", "songs-completed", "Completed creative work derived from governed creative and approval state rather than treating file upload as completion.", ["orders", "programs"]),
    node("dashboard-revenue", "Revenue", "revenue", "Operational revenue based on authoritative received payment state, excluding unpaid quotes, abandoned checkouts, failed payments, and unreceived sponsor commitments.", ["payments", "orders", "funding"], { integrity: "payment" }),
    node("dashboard-capacity", "Capacity", "capacity", "Operational capacity from supported workload, active work, configured limits, program commitments, and turnaround targets. No unsupported forecasting model is implied.", ["orders", "programs", "catalog", "people"], { integrity: "capacity" }),
    node("dashboard-alerts", "Alerts", "alerts", "Traceable operational conditions such as overdue work, failed payments or communications, consent blocks, scheduling conflicts, delivery failures, and incidents.", ["orders", "payments", "communications", "consent", "scheduling", "monitoring", "secure-delivery"], { integrity: "monitoring" })
  ],
  requests: [
    node("requests-new-inquiries", "New Inquiries", "new-inquiries", "Canonical Inquiry records from supported individual, facility/program, consultation, partner, or sponsor entry channels.", ["requests"], { recordKind: "inquiry" }),
    node("requests-qualification", "Qualification", "qualification", "Staff workflow for determining whether an inquiry advances using authoritative transitions; no invented scoring model or UI-only mutation.", ["requests", "orders", "programs", "audit"], { recordKind: "inquiry", action: { label: "Record qualification decision", service: "requests" } }),
    node("requests-consultations", "Consultations", "consultations", "Consultation activity using the shared scheduling boundary rather than an Admin-only calendar.", ["requests", "scheduling"], { recordKind: "schedule", integrity: "scheduling", action: { label: "Schedule consultation", service: "scheduling" } }),
    node("requests-quotes", "Quotes", "quotes", "Priced proposals using canonical commercial records and catalog configuration rather than hard-coded Admin pricing.", ["requests", "catalog", "orders"], { recordKind: "commercial", action: { label: "Create or update quote", service: "orders" } }),
    node("requests-conversion", "Conversion", "conversion", "Governed transition from a qualified inquiry or accepted quote into the appropriate canonical Order or ProgramRun.", ["requests", "orders", "programs", "audit"], { recordKind: "inquiry", action: { label: "Convert through workflow authority", service: "requests" } })
  ],
  programs: [
    node("programs-individual-orders", "Individual Orders", "individual-orders", "Cross-platform operational view of canonical Order records and the shared meaning-to-song lifecycle.", ["orders", "audit"], { recordKind: "order", action: { label: "Apply authorized order action", service: "orders" } }),
    node("programs-project-ageless", "Project Ageless Programs", "project-ageless-programs", "Canonical ProgramRun records configured from the Project Ageless program template; this does not duplicate the Facility workspace.", ["programs", "people", "funding"], { recordKind: "program", action: { label: "Apply authorized program action", service: "programs" } }),
    node("programs-other-runs", "Other Program Runs", "other-program-runs", "Future configured ProgramTemplate → ProgramRun instances without separate application architectures for each program type.", ["programs"], { recordKind: "program" }),
    node("programs-exceptions", "Exceptions", "exceptions", "Operational queue for genuine governed exceptions such as payment failed, awaiting customer, consent blocked, production blocked, cancelled, or refunded where supported.", ["orders", "programs", "payments", "consent", "audit"], { action: { label: "Resolve through authoritative service", service: "orders" } }),
    node("programs-closed-work", "Closed Work", "closed-work", "Legitimately closed individual orders and completed/closed program runs based on authoritative workflow state rather than inactivity.", ["orders", "programs"])
  ],
  people: [
    node("people-customers", "Customers", "customers", "Authorized administrative visibility into canonical Person and membership context for customers without exposing unnecessary story or consent detail.", ["people", "orders"], { recordKind: "person", integrity: "identity" }),
    node("people-family", "Family Collaborators", "family-collaborators", "Canonical people, memberships, roles, and scoped access relationships; family relationship never implies full access.", ["people", "consent", "audit"], { recordKind: "person", integrity: "identity" }),
    node("people-facilities", "Facilities", "facilities", "Canonical Organization records for facilities linked to their program runs and authorized staff.", ["people", "programs"], { recordKind: "organization" }),
    node("people-facility-staff", "Facility Staff", "facility-staff", "Membership and role relationships between Person and facility Organization without duplicating a person across contexts.", ["people", "audit"], { recordKind: "person", integrity: "identity" }),
    node("people-creators", "Creators", "creators", "Canonical creators, memberships, assignments, and creative-work context; this is not an open creator marketplace.", ["people", "orders", "programs"], { recordKind: "person", integrity: "identity" }),
    node("people-partners", "Partners", "partners", "Approved nonprofit, community, and other partner organizations represented through the canonical Organization model.", ["people", "programs"], { recordKind: "organization" }),
    node("people-sponsors", "Sponsors", "sponsors", "Sponsor organizations and funding relationships. Funding never grants participant-record access by itself.", ["people", "funding", "consent"], { recordKind: "organization", integrity: "funding" })
  ],
  catalog: [
    node("catalog-packages", "Packages", "packages", "Canonical service-package definitions used downstream instead of hard-coded offerings in Customer or Creator screens.", ["catalog"], { recordKind: "package", action: { label: "Update package configuration", service: "catalog" } }),
    node("catalog-program-templates", "Program Templates", "program-templates", "Commercial/service access point to the same canonical ProgramTemplate records also exposed under Platform Configuration.", ["catalog", "programs", "configuration"], { recordKind: "program_template", action: { label: "Update canonical program template", service: "catalog" } }),
    node("catalog-add-ons", "Add-ons", "add-ons", "Configured optional service components. Offerings and prices are never invented in the Admin UI.", ["catalog"], { action: { label: "Update add-on configuration", service: "catalog" } }),
    node("catalog-deposits", "Deposits", "deposits", "Configured deposit rules; actual collection and payment state remain server-authoritative.", ["catalog", "payments"], { integrity: "payment", action: { label: "Update deposit policy", service: "catalog" } }),
    node("catalog-revision-limits", "Revision Limits", "revision-limits", "Configured included revision policy used by Customer and Creator workflows rather than arbitrary local limits.", ["catalog", "orders"], { action: { label: "Update revision policy", service: "catalog" } }),
    node("catalog-turnaround", "Turnaround Targets", "turnaround-targets", "Expected service timing and capacity targets. Targets do not themselves prove completion or create guarantees.", ["catalog", "reporting"], { action: { label: "Update turnaround target", service: "catalog" } })
  ],
  finance: [
    node("finance-payments", "Payments", "payments", "Authoritative payment state confirmed server-side through the shared payment boundary; browser redirects cannot mark an order paid.", ["payments", "orders", "audit"], { recordKind: "commercial", integrity: "payment" }),
    node("finance-invoices", "Invoices", "invoices", "Operational invoice state for legitimate transactions without building a general-ledger or full accounts-receivable system.", ["payments", "orders", "funding"], { recordKind: "commercial", integrity: "payment" }),
    node("finance-refunds", "Refunds", "refunds", "Refund state controlled by the payment provider and server-authoritative order state; material refunds are auditable.", ["payments", "orders", "audit"], { recordKind: "commercial", integrity: "payment", action: { label: "Issue authorized refund", service: "payments" } }),
    node("finance-failed", "Failed Payments", "failed-payments", "Operational queue for actual failed payment attempts; retries and collection success are never fabricated.", ["payments", "orders"], { recordKind: "commercial", integrity: "payment", action: { label: "Retry through payment service", service: "payments" } }),
    node("finance-sponsor-funding", "Sponsor Funding", "sponsor-funding", "Program funding relationships including paying party, recipient, source, allocation, restrictions, covered activities, and reporting obligations when supported.", ["funding", "programs", "people"], { recordKind: "funding", integrity: "funding", action: { label: "Update funding relationship", service: "funding" } }),
    node("finance-reconciliation", "Reconciliation", "reconciliation", "Operational reconciliation between platform commercial records and authoritative provider/invoice state, not corporate bookkeeping.", ["payments", "orders", "funding", "audit"], { integrity: "payment", action: { label: "Reconcile authoritative state", service: "payments" } })
  ],
  scheduling: [
    node("scheduling-interviews", "Interviews", "interviews", "Cross-platform interview scheduling through the one shared scheduling service.", ["scheduling", "orders", "programs"], { recordKind: "schedule", integrity: "scheduling", action: { label: "Manage interview schedule", service: "scheduling" } }),
    node("scheduling-facility-visits", "Facility Visits", "facility-visits", "Facility visits associated with canonical ProgramRun records.", ["scheduling", "programs"], { recordKind: "schedule", integrity: "scheduling", action: { label: "Manage facility visit", service: "scheduling" } }),
    node("scheduling-program-sessions", "Program Sessions", "program-sessions", "Project Ageless and other program touchpoints using canonical program and touchpoint data.", ["scheduling", "programs"], { recordKind: "schedule", integrity: "scheduling", action: { label: "Manage program session", service: "scheduling" } }),
    node("scheduling-events", "Events", "events", "Concerts, presentations, listening events, graduations, and other configured events without assuming every participant attends.", ["scheduling", "programs", "consent"], { recordKind: "schedule", integrity: "scheduling", action: { label: "Manage event", service: "scheduling" } }),
    node("scheduling-creator-availability", "Creator Availability", "creator-availability", "Creator availability and delivery capacity needed for scheduling; this is not HR timekeeping software.", ["scheduling", "people"], { recordKind: "schedule", integrity: "capacity", action: { label: "Update availability", service: "scheduling" } })
  ],
  communications: [
    node("communications-templates", "Message Templates", "message-templates", "Canonical transactional/service templates that respect recipient context, purpose, and applicable preferences/consent.", ["communications", "consent"], { recordKind: "communication", integrity: "communications", action: { label: "Update message template", service: "communications" } }),
    node("communications-email", "Email", "email", "Authorized operational email through the shared communication service; successful sends are never simulated when no provider is connected.", ["communications", "audit"], { recordKind: "communication", integrity: "communications", action: { label: "Send authorized email", service: "communications" } }),
    node("communications-sms", "SMS", "sms", "Optional defined SMS events only for recipients with applicable contact data and consent/preferences; delivery is never fabricated.", ["communications", "consent", "audit"], { recordKind: "communication", integrity: "communications", action: { label: "Send authorized SMS", service: "communications" } }),
    node("communications-failed", "Failed Deliveries", "failed-deliveries", "Genuine messaging delivery failures from the authoritative communication system, with retries only through that service.", ["communications"], { recordKind: "communication", integrity: "communications", action: { label: "Retry failed delivery", service: "communications" } }),
    node("communications-history", "Communication History", "communication-history", "Appropriate platform communication history without indiscriminate exposure of unrelated private messages.", ["communications", "audit"], { recordKind: "communication", integrity: "communications" })
  ],
  consent: [
    node("consent-records", "Consent Records", "consent-records", "Canonical ConsentRecord oversight including subject, grantor, authority basis, state, scopes, restrictions, version, and effective/withdrawal dates.", ["consent", "audit"], { recordKind: "consent", integrity: "consent", action: { label: "Apply authorized consent change", service: "consent" } }),
    node("consent-restrictions", "Restrictions", "restrictions", "Active restrictions that must affect downstream actions rather than remain informational text.", ["consent", "orders", "programs", "communications", "secure-delivery"], { recordKind: "consent", integrity: "consent" }),
    node("consent-withdrawals", "Withdrawals", "withdrawals", "Authoritative consent withdrawal workflow that blocks future covered use while preserving legally required audit evidence.", ["consent", "audit", "secure-delivery", "reporting"], { recordKind: "consent", integrity: "consent", action: { label: "Process authorized withdrawal", service: "consent" } }),
    node("consent-media", "Media Permissions", "media-permissions", "Cross-platform oversight of permissions affecting photos, video, interview recordings, songs, stories, public marketing, sponsor acknowledgment, and testimonials.", ["consent", "secure-delivery", "communications"], { recordKind: "consent", integrity: "consent" }),
    node("consent-retention", "Retention", "retention", "Administrative integration point for approved retention rules and actions. No legal retention period is invented.", ["consent", "configuration", "audit"], { integrity: "consent", action: { label: "Apply approved retention action", service: "consent" } }),
    node("consent-deletion", "Deletion / Restriction Requests", "deletion-restriction-requests", "Operational workflow for legitimate deletion or restriction requests while preserving records required for legal/audit purposes.", ["consent", "audit"], { recordKind: "consent", integrity: "consent", action: { label: "Process governed request", service: "consent" } }),
    node("consent-audit", "Audit Logs", "audit-logs", "Shared AuditEvent history for material actions; this is not a separate Admin-only audit system.", ["audit", "consent", "orders", "programs", "payments", "secure-delivery"], { recordKind: "audit", integrity: "consent" })
  ],
  reports: [
    node("reports-sales-funnel", "Sales Funnel", "sales-funnel", "Reporting from actual inquiry, qualification, quote, and order transitions where authoritative data exists.", ["reporting", "requests", "orders"], { integrity: "reporting" }),
    node("reports-turnaround", "Turnaround", "turnaround", "Operational timing from real workflow timestamps such as request-to-interview, interview-to-first-draft, approval-to-delivery, and overall cycle.", ["reporting", "orders", "programs"], { integrity: "reporting" }),
    node("reports-creator-workload", "Creator Workload", "creator-workload", "Actual assignments, work states, and configured capacity without exposing unnecessary creator information.", ["reporting", "people", "orders", "programs"], { integrity: "reporting" }),
    node("reports-revisions", "Revisions", "revisions", "Legitimate creative revision activity from canonical version/revision records rather than counting ordinary file saves.", ["reporting", "orders"], { integrity: "reporting" }),
    node("reports-program-outcomes", "Program Outcomes", "program-outcomes", "Source-defined participation, engagement, completion, event, satisfaction, and meaning/connection measures without unsupported clinical claims.", ["reporting", "programs", "consent"], { integrity: "reporting" }),
    node("reports-funding", "Funding Reports", "funding-reports", "Authoritative funding/program allocation reports for legitimate sponsor, grant, and facility needs without becoming a full grant-management platform.", ["reporting", "funding", "programs"], { integrity: "funding" }),
    node("reports-export", "Export Center", "export-center", "Governed exports respecting role authorization, organization/program scope, participant consent, restricted-use data, and retention/deletion policy.", ["reporting", "consent", "audit"], { integrity: "export", action: { label: "Generate governed export", service: "reporting" } })
  ],
  monitoring: [],
  settings: [
    node("settings-roles", "Roles & Permissions", "roles-permissions", "Canonical person, membership, and role model with least privilege; no unrelated Admin permissions system.", ["configuration", "people", "audit"], { recordKind: "configuration", integrity: "identity", action: { label: "Change role configuration", service: "configuration" } }),
    node("settings-program-templates", "Program Templates", "program-templates", "Configuration access point to the same canonical ProgramTemplate records also exposed under Catalog & Pricing.", ["configuration", "catalog", "programs", "audit"], { recordKind: "program_template", integrity: "configuration", action: { label: "Update canonical program template", service: "configuration" } }),
    node("settings-status", "Status Definitions", "status-definitions", "Supported status configuration only where the governing workflow architecture permits it; hard-coded governance states are not arbitrarily editable.", ["configuration", "orders", "programs", "audit"], { recordKind: "configuration", integrity: "configuration", action: { label: "Update supported status definition", service: "configuration" } }),
    node("settings-notifications", "Notification Rules", "notification-rules", "Workflow-event rules connected to the shared communication service without provider-specific vendor logic.", ["configuration", "communications", "audit"], { recordKind: "configuration", integrity: "configuration", action: { label: "Update notification rule", service: "configuration" } }),
    node("settings-integrations", "Integration Settings", "integration-settings", "Configuration boundary for approved identity, persistence, storage, payments, messaging, scheduling, analytics, monitoring, and secure-delivery adapters. Secrets remain server-side.", ["configuration", "payments", "communications", "scheduling", "monitoring", "secure-delivery", "audit"], { recordKind: "configuration", integrity: "configuration", action: { label: "Update approved integration settings", service: "configuration" } }),
    node("settings-feature-flags", "Feature Flags", "feature-flags", "Safe server-authoritative feature availability controls that cannot bypass authorization, consent, workflow prerequisites, payment integrity, or security controls.", ["configuration", "audit"], { recordKind: "configuration", integrity: "configuration", action: { label: "Update feature flag", service: "configuration" } })
  ]
};

export const adminParentRouteSegment: Record<AdminParentId, string> = {
  "admin-home": "dashboard",
  requests: "requests",
  programs: "programs",
  people: "people",
  catalog: "catalog",
  finance: "finance",
  scheduling: "scheduling",
  communications: "communications",
  consent: "consent",
  reports: "reports",
  monitoring: "monitoring",
  settings: "settings"
};

export function getAdminChildren(parentId: AdminParentId) {
  return adminChildren[parentId];
}

export function buildAdminHref(input: { parentId: AdminParentId; childId?: string; recordId?: string }) {
  const parent = workspaceNavigation.admin.find((item) => item.id === input.parentId);
  if (!parent) return "/admin";
  if (!input.childId) return input.parentId === "admin-home" ? "/admin" : `/admin/${parent.slug}`;

  const child = adminChildren[input.parentId].find((candidate) => candidate.id === input.childId);
  if (!child) return input.parentId === "admin-home" ? "/admin" : `/admin/${parent.slug}`;

  const parentSegment = adminParentRouteSegment[input.parentId];
  const base = `/admin/${parentSegment}/${child.slug}`;
  return input.recordId ? `${base}/record/${encodeURIComponent(input.recordId)}` : base;
}

export function resolveAdminRoute(parts: readonly string[]): AdminRouteResolution | undefined {
  if (parts.length === 0) {
    return { parent: workspaceNavigation.admin[0] };
  }

  const parent = workspaceNavigation.admin.find((item) => {
    const id = item.id as AdminParentId;
    return adminParentRouteSegment[id] === parts[0];
  });
  if (!parent) return undefined;

  const parentId = parent.id as AdminParentId;
  if (parts.length === 1) return { parent };

  const child = adminChildren[parentId].find((candidate) => candidate.slug === parts[1]);
  if (!child) return undefined;

  if (parts.length === 2) return { parent, child };
  if (parts.length === 4 && parts[2] === "record" && parts[3]) {
    if (!child.recordKind) return undefined;
    return { parent, child, recordId: decodeURIComponent(parts[3]) };
  }

  return undefined;
}

export function getAdminStaticRouteSlugs(referenceRecordIds: Partial<Record<AdminRecordKind, string>> = {}) {
  const slugs: string[][] = [];

  for (const parent of workspaceNavigation.admin) {
    const parentId = parent.id as AdminParentId;
    if (parentId === "admin-home") slugs.push([]);
    else slugs.push([parent.slug]);

    for (const child of adminChildren[parentId]) {
      const base = [adminParentRouteSegment[parentId], child.slug];
      slugs.push(base);
      const recordId = child.recordKind ? referenceRecordIds[child.recordKind] : undefined;
      if (recordId) slugs.push([...base, "record", recordId]);
    }
  }

  return slugs;
}

export function programTemplateEntryPointsShareCanonicalRecord() {
  const catalog = adminChildren.catalog.find((item) => item.id === "catalog-program-templates");
  const settings = adminChildren.settings.find((item) => item.id === "settings-program-templates");
  return Boolean(catalog && settings && catalog.recordKind === "program_template" && settings.recordKind === "program_template");
}
