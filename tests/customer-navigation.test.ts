import { describe, expect, it } from "vitest";
import {
  buildCustomerHref,
  customerChildren,
  customerLeafDestinations,
  customerServiceConnections,
  getCustomerStaticRouteSlugs,
  resolveCustomerRoute,
  type CustomerParentId
} from "../lib/customer-navigation";
import { workspaceNavigation } from "../lib/navigation";

const expectedTopLevel = [
  "Dashboard",
  "My Song Journey",
  "Story & Memories",
  "Interviews",
  "Lyrics & Review",
  "Family & Collaborators",
  "Messages",
  "Files & Keepsakes",
  "Payments & Orders",
  "Consent & Permissions"
];

const expectedChildren: Record<CustomerParentId, string[]> = {
  "customer-home": ["Current Song / Program", "Progress Timeline", "Next Action", "Messages", "Recent Activity"],
  journey: ["Request", "Interview", "Story Development", "Lyrics", "Production", "Delivery"],
  story: ["Guided Story Questions", "Life Timeline", "People & Relationships", "Places", "Important Events", "Values / Personality", "Favorite Music / Style", "Uploads"],
  interviews: ["Schedule Interview", "Upcoming Interview", "Reschedule", "Interview Preparation"],
  reviews: ["Current Draft", "Previous Versions", "Submit Feedback", "Request Revision", "Approve Lyrics"],
  family: ["Invite Family Member", "Manage Contributors", "Contributions", "Access Permissions"],
  messages: [],
  files: ["Final Song", "Lyric Sheet", "Song Card", "Shareable Link", "Physical Keepsake Status"],
  orders: ["Order Summary", "Deposit / Balance", "Receipts", "Refund Status", "Add-ons"],
  permissions: ["Participation Consent", "Recording Consent", "Family Sharing", "Performance Permission", "Photo / Video Permission", "Public Story / Marketing Permission"]
};

describe("Customer / Family hierarchy", () => {
  it("preserves the exact 10 registered top-level destinations and order", () => {
    expect(workspaceNavigation.customer.map((item) => item.label)).toEqual(expectedTopLevel);
    expect(workspaceNavigation.customer).toHaveLength(10);
    expect(workspaceNavigation.customer.map((item) => item.label)).not.toContain("Production");
    expect(workspaceNavigation.customer.map((item) => item.label)).not.toContain("Profile & Settings");
    expect(workspaceNavigation.customer.map((item) => item.label)).not.toContain("Help & Support");
  });

  it("represents every required source-defined child without invented submenu items", () => {
    for (const [parentId, labels] of Object.entries(expectedChildren) as [CustomerParentId, string[]][]) {
      expect(customerChildren[parentId].map((item) => item.label)).toEqual(labels);
    }
  });

  it("keeps Messages as a leaf", () => {
    expect(customerChildren.messages).toEqual([]);
    expect(customerLeafDestinations.messages?.label).toBe("Messages");
  });

  it("implements Story & Memories → Uploads as a genuine four-item grandchild hierarchy", () => {
    const uploads = customerChildren.story.find((item) => item.id === "story-uploads");
    expect(uploads?.grandchildren?.map((item) => item.label)).toEqual([
      "Photos",
      "Documents",
      "Audio",
      "Other Memories"
    ]);
  });

  it("resolves contextual deep links without losing the selected order", () => {
    const href = buildCustomerHref({
      parentId: "story",
      childId: "story-uploads",
      grandchildId: "uploads-photos",
      orderId: "order-42"
    });
    expect(href).toBe("/customer/order/order-42/story/uploads/photos");
    expect(resolveCustomerRoute(["order", "order-42", "story", "uploads", "photos"])).toMatchObject({
      parent: { id: "story" },
      child: { id: "story-uploads" },
      grandchild: { id: "uploads-photos" },
      orderId: "order-42",
      contextual: true
    });
  });

  it("preserves selected order context while moving among Customer modules", () => {
    expect(buildCustomerHref({ parentId: "reviews", childId: "reviews-current-draft", orderId: "order-42" }))
      .toBe("/customer/order/order-42/reviews/current-draft");
    expect(buildCustomerHref({ parentId: "orders", childId: "orders-summary", orderId: "order-42" }))
      .toBe("/customer/order/order-42/orders/order-summary");
    expect(buildCustomerHref({ parentId: "permissions", childId: "permissions-recording", orderId: "order-42" }))
      .toBe("/customer/order/order-42/permissions/recording-consent");
  });

  it("fails invalid nested routes instead of selecting an unrelated page", () => {
    expect(resolveCustomerRoute(["story", "not-a-workflow"])).toBeUndefined();
    expect(resolveCustomerRoute(["story", "uploads", "not-an-upload"])).toBeUndefined();
    expect(resolveCustomerRoute(["production"])).toBeUndefined();
  });

  it("includes nested and contextual routes in static preview generation", () => {
    const routes = getCustomerStaticRouteSlugs("reference-order-001").map((segments) => segments.join("/"));
    expect(routes).toContain("story/uploads/photos");
    expect(routes).toContain("order/reference-order-001/story/uploads/photos");
    expect(routes).toContain("order/reference-order-001/reviews/approve-lyrics");
  });

  it("keeps authoritative service actions gated in reference mode", () => {
    expect(customerServiceConnections.payments).toBe(false);
    expect(customerServiceConnections.scheduling).toBe(false);
    expect(customerServiceConnections.communications).toBe(false);
    expect(customerServiceConnections.invitations).toBe(false);
    expect(customerServiceConnections.media).toBe(false);
    expect(customerServiceConnections.approvals).toBe(false);
    expect(customerServiceConnections.consent).toBe(false);
    expect(customerServiceConnections["secure-delivery"]).toBe(false);
  });

  it("marks only source-defined deferred keepsake and richer collaboration points as P1", () => {
    expect(customerChildren.files.find((item) => item.id === "files-song-card")?.release).toBe("P1");
    expect(customerChildren.files.find((item) => item.id === "files-physical-keepsake")?.release).toBe("P1");
    expect(customerChildren.family.find((item) => item.id === "family-manage-contributors")?.release).toBe("P1");
    expect(customerChildren.family.find((item) => item.id === "family-contributions")?.release).toBe("P1");
  });
});
