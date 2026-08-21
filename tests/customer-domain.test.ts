import { describe, expect, it } from "vitest";
import { consentAllows, type ConsentRecord } from "../domain/consent";
import {
  approvalTargetsLyricVersion,
  customerActionAllowed,
  customerMediaAccessAllows,
  customerScopedAccessAllows,
  deriveCustomerNextAction,
  deriveJourneyProgress,
  filterCustomerVisibleLyricVersions
} from "../domain/customer";
import type { Approval, LyricVersion } from "../domain/types";

const versions: LyricVersion[] = [
  { id: "v1", creativeWorkId: "song-1", version: 1, createdAt: "2026-08-01T00:00:00Z" },
  { id: "v2", creativeWorkId: "song-1", version: 2, createdAt: "2026-08-02T00:00:00Z" },
  { id: "v3", creativeWorkId: "song-1", version: 3, createdAt: "2026-08-03T00:00:00Z" }
];

const activeConsent: ConsentRecord = {
  id: "consent-1",
  subjectPersonId: "subject-1",
  grantedByPersonId: "subject-1",
  authorityBasis: "self",
  state: "active",
  scopes: ["designated_family_sharing"],
  restrictions: [],
  version: 1
};

describe("Customer workflow integrity", () => {
  it("derives progress from the canonical song journey", () => {
    const progress = deriveJourneyProgress("Customer Review");
    expect(progress.find((phase) => phase.state === "Lyric Development")?.status).toBe("complete");
    expect(progress.find((phase) => phase.state === "Customer Review")?.status).toBe("current");
    expect(progress.find((phase) => phase.state === "Approved for Production")?.status).toBe("upcoming");
  });

  it("derives only legitimate customer next actions", () => {
    expect(deriveCustomerNextAction("Awaiting Payment")?.label).toBe("Complete required payment");
    expect(deriveCustomerNextAction("Interview Scheduling")?.label).toBe("Schedule interview");
    expect(deriveCustomerNextAction("Customer Review")?.label).toBe("Review lyrics");
    expect(deriveCustomerNextAction("Production")).toBeUndefined();
    expect(deriveCustomerNextAction("Closed")).toBeUndefined();
  });

  it("exposes only lyric versions actually shared for customer review", () => {
    expect(filterCustomerVisibleLyricVersions(versions, ["v1", "v3"]).map((version) => version.id)).toEqual(["v1", "v3"]);
  });

  it("requires lyric approval to identify the exact approved version", () => {
    const approval: Approval = {
      id: "approval-1",
      creativeWorkId: "song-1",
      lyricVersionId: "v2",
      approvedByPersonId: "customer-1",
      approvedAt: "2026-08-04T00:00:00Z",
      scope: "lyrics"
    };
    expect(approvalTargetsLyricVersion(approval, "v2")).toBe(true);
    expect(approvalTargetsLyricVersion(approval, "v3")).toBe(false);
    expect(approvalTargetsLyricVersion({ ...approval, lyricVersionId: undefined }, "v2")).toBe(false);
  });

  it("keeps authorization and consent as independent gates", () => {
    const consent = consentAllows(activeConsent, "designated_family_sharing");
    expect(customerActionAllowed({ allowed: true }, consent).allowed).toBe(true);
    expect(customerActionAllowed({ allowed: false, reason: "Not authorized." }, consent).allowed).toBe(false);
    expect(customerActionAllowed({ allowed: true }, consentAllows(activeConsent, "public_marketing")).allowed).toBe(false);
  });

  it("keeps a family collaborator isolated from unrelated orders and privileged areas", () => {
    const grant = {
      orderIds: ["order-1"],
      mediaAssetIds: ["media-1"]
    };
    expect(customerScopedAccessAllows(grant, "order-1", "order")).toBe(true);
    expect(customerScopedAccessAllows(grant, "order-2", "order")).toBe(false);
    expect(customerScopedAccessAllows(grant, "order-1", "payments")).toBe(false);
    expect(customerScopedAccessAllows(grant, "order-1", "consent")).toBe(false);
    expect(customerScopedAccessAllows(grant, "order-1", "approval")).toBe(false);
    expect(customerScopedAccessAllows(grant, "order-1", "internal_creator_notes")).toBe(false);
  });

  it("requires explicit media scope as well as order access", () => {
    const grant = { orderIds: ["order-1"], mediaAssetIds: ["media-1"] };
    expect(customerMediaAccessAllows(grant, "order-1", "media-1")).toBe(true);
    expect(customerMediaAccessAllows(grant, "order-1", "media-2")).toBe(false);
    expect(customerMediaAccessAllows(grant, "order-2", "media-1")).toBe(false);
  });
});
