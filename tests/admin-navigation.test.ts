import { describe, expect, it } from "vitest";
import { referenceAdminRecordIds } from "../fixtures/reference-data";
import {
  adminChildren,
  adminServiceConnections,
  buildAdminHref,
  getAdminStaticRouteSlugs,
  programTemplateEntryPointsShareCanonicalRecord,
  resolveAdminRoute,
  type AdminParentId
} from "../lib/admin-navigation";
import { workspaceNavigation } from "../lib/navigation";

const expectedTopLevel = [
  "Executive Dashboard",
  "Requests & Leads",
  "Orders & Programs",
  "Users & Organizations",
  "Catalog & Pricing",
  "Payments & Finance",
  "Scheduling",
  "Communications",
  "Consent & Compliance",
  "Reports & Analytics",
  "Monitoring & Incidents",
  "Settings"
];

const expectedChildren: Record<AdminParentId, string[]> = {
  "admin-home": ["New Requests", "Active Orders", "Active Programs", "Songs Completed", "Revenue", "Capacity", "Alerts"],
  requests: ["New Inquiries", "Qualification", "Consultations", "Quotes", "Conversion"],
  programs: ["Individual Orders", "Project Ageless Programs", "Other Program Runs", "Exceptions", "Closed Work"],
  people: ["Customers", "Family Collaborators", "Facilities", "Facility Staff", "Creators", "Partners", "Sponsors"],
  catalog: ["Packages", "Program Templates", "Add-ons", "Deposits", "Revision Limits", "Turnaround Targets"],
  finance: ["Payments", "Invoices", "Refunds", "Failed Payments", "Sponsor Funding", "Reconciliation"],
  scheduling: ["Interviews", "Facility Visits", "Program Sessions", "Events", "Creator Availability"],
  communications: ["Message Templates", "Email", "SMS", "Failed Deliveries", "Communication History"],
  consent: ["Consent Records", "Restrictions", "Withdrawals", "Media Permissions", "Retention", "Deletion / Restriction Requests", "Audit Logs"],
  reports: ["Sales Funnel", "Turnaround", "Creator Workload", "Revisions", "Program Outcomes", "Funding Reports", "Export Center"],
  monitoring: [],
  settings: ["Roles & Permissions", "Program Templates", "Status Definitions", "Notification Rules", "Integration Settings", "Feature Flags"]
};

describe("Admin hierarchy integrity", () => {
  it("preserves the 12 admin destinations in order", () => {
    expect(workspaceNavigation.admin.map((item) => item.label)).toEqual(expectedTopLevel);
    expect(workspaceNavigation.admin).toHaveLength(12);
    expect(workspaceNavigation.admin.some((item) => item.label === "System Settings")).toBe(false);
  });

  it("implements every defined child and keeps Monitoring as a leaf", () => {
    for (const parent of workspaceNavigation.admin) {
      const parentId = parent.id as AdminParentId;
      expect(adminChildren[parentId].map((item) => item.label)).toEqual(expectedChildren[parentId]);
    }
    expect(adminChildren.monitoring).toEqual([]);
  });

  it("keeps both Program Templates entry points on one record kind", () => {
    expect(programTemplateEntryPointsShareCanonicalRecord()).toBe(true);
    expect(adminChildren.catalog.find((item) => item.label === "Program Templates")?.recordKind).toBe("program_template");
    expect(adminChildren.settings.find((item) => item.label === "Program Templates")?.recordKind).toBe("program_template");
  });
});

describe("Admin routing", () => {
  it("resolves dashboard and nested child routes with the correct active parent", () => {
    expect(resolveAdminRoute([])?.parent.label).toBe("Executive Dashboard");
    const request = resolveAdminRoute(["requests", "new-inquiries"]);
    expect(request?.parent.label).toBe("Requests & Leads");
    expect(request?.child?.label).toBe("New Inquiries");
  });

  it("preserves selected record identity in deep links", () => {
    const href = buildAdminHref({ parentId: "programs", childId: "programs-individual-orders", recordId: "order-123" });
    expect(href).toBe("/admin/programs/individual-orders/record/order-123");
    const route = resolveAdminRoute(["programs", "individual-orders", "record", "order-123"]);
    expect(route?.recordId).toBe("order-123");
    expect(route?.child?.recordKind).toBe("order");
  });

  it("rejects invalid nested and unsupported record routes", () => {
    expect(resolveAdminRoute(["requests", "not-a-workflow"])).toBeUndefined();
    expect(resolveAdminRoute(["monitoring", "invented-child"])).toBeUndefined();
    expect(resolveAdminRoute(["reports", "sales-funnel", "record", "fake"])).toBeUndefined();
  });

  it("generates static child and selected-record routes", () => {
    const routes = getAdminStaticRouteSlugs(referenceAdminRecordIds).map((parts) => parts.join("/"));
    expect(routes).toContain("dashboard/new-requests");
    expect(routes).toContain("programs/individual-orders/record/ref-order-001");
    expect(routes).toContain("consent/consent-records/record/ref-consent-001");
    expect(routes).toContain("settings/program-templates/record/ref-program-template-001");
  });
});

describe("Admin service availability", () => {
  it("does not mark unavailable Admin services as connected", () => {
    expect(Object.values(adminServiceConnections).every((connected) => connected === false)).toBe(true);
  });
});
