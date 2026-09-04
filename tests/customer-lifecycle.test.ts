import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { branchForNps, formatLifecycleMoney } from "../domain/customer-lifecycle";

const lifecycleRepository = readFileSync(resolve(process.cwd(), "lib/firebase/customer-lifecycle.ts"), "utf8");
const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
const organizationExperience = readFileSync(resolve(process.cwd(), "components/organization-relationship.tsx"), "utf8");
const adminExperience = readFileSync(resolve(process.cwd(), "components/admin-lifecycle-surface.tsx"), "utf8");

describe("post-experience growth branching", () => {
  it("routes detractors, passives, and promoters without asking detractors for referrals", () => {
    expect(branchForNps(0)).toBe("service_recovery");
    expect(branchForNps(6)).toBe("service_recovery");
    expect(branchForNps(7)).toBe("relationship_nurture");
    expect(branchForNps(8)).toBe("relationship_nurture");
    expect(branchForNps(9)).toBe("promoter");
    expect(branchForNps(10)).toBe("promoter");
    expect(() => branchForNps(11)).toThrow();
  });

  it("keeps configurable product pricing honest", () => {
    expect(formatLifecycleMoney(2500)).toBe("$25");
    expect(formatLifecycleMoney()).toBe("Price confirmed with SongKeep");
  });
});

describe("commercial integrity", () => {
  it("persists invoice or payment-pending states before external checkout", () => {
    expect(lifecycleRepository).toContain('status: invoice ? "invoice_requested" : "payment_pending"');
    expect(lifecycleRepository).toContain('financialStatus: invoice ? "invoice_requested" : "payment_pending"');
    expect(lifecycleRepository).toContain("adminAdvanceExperienceRequest");
    expect(lifecycleRepository).toContain('billingStatus: "paid"');
  });

  it("protects catalog prices, financial state, and source attribution in Firestore rules", () => {
    expect(rules).toContain("validOfferingAndAmount");
    expect(rules).toContain("allow update, delete: if platformAdmin();");
    expect(rules).toContain("request.resource.data.experienceId == access.data.experienceId");
    expect(rules).toContain("request.resource.data.priceCents == product.data.get('priceCents', null)");
  });
});

describe("complete relationship experience", () => {
  it("keeps payment, permissions, feedback, renewal, and advocacy connected", () => {
    expect(organizationExperience).toContain("Commercial status");
    expect(organizationExperience).toContain("People & readiness");
    expect(organizationExperience).toContain("How likely are you to recommend SongKeep");
    expect(organizationExperience).toContain("Make a warm introduction.");
    expect(organizationExperience).toContain("Plan what comes next.");
  });

  it("gives operations direct lifecycle controls", () => {
    expect(adminExperience).toContain("Confirm payment & create experience");
    expect(adminExperience).toContain("Publish products created from organization experiences");
    expect(adminExperience).toContain("Review each person’s choices");
    expect(adminExperience).toContain("Individual commerce");
  });
});
