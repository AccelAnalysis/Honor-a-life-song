import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  deriveLifecyclePlan,
  getNetPromoterBand
} from "../domain/customer-lifecycle";
import {
  getPostExperienceProduct,
  postExperienceProducts
} from "../domain/post-experience";

const growthSurface = readFileSync(resolve(process.cwd(), "components/organization-growth-surface.tsx"), "utf8");
const lifecycleRepository = readFileSync(resolve(process.cwd(), "lib/firebase/customer-lifecycle.ts"), "utf8");
const postExperienceStore = readFileSync(resolve(process.cwd(), "components/post-experience-storefront.tsx"), "utf8");
const firestoreRules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");

describe("event-driven customer lifecycle", () => {
  it("keeps invoice follow-up active until authoritative payment", () => {
    const invoicePlan = deriveLifecyclePlan({ billingState: "invoice_requested" });
    expect(invoicePlan.activeJourney).toBe("invoice_follow_up");
    expect(invoicePlan.suppressedJourneys).toContain("customer_onboarding");
    expect(invoicePlan.suppressedJourneys).toContain("advocacy");

    const paidPlan = deriveLifecyclePlan({
      billingState: "paid",
      experienceStatus: "preparing"
    });
    expect(paidPlan.activeJourney).toBe("customer_onboarding");
    expect(paidPlan.activeJourney).not.toBe("invoice_follow_up");
  });

  it("routes completed experiences through care before advocacy", () => {
    expect(deriveLifecyclePlan({
      billingState: "paid",
      experienceStatus: "post_event"
    })).toMatchObject({
      activeJourney: "post_experience_care",
      nextAction: "Share feedback about the completed experience"
    });

    expect(deriveLifecyclePlan({
      billingState: "paid",
      experienceStatus: "post_event",
      npsScore: 4
    })).toMatchObject({
      activeJourney: "service_recovery",
      suppressedJourneys: ["advocacy"]
    });

    expect(deriveLifecyclePlan({
      billingState: "paid",
      experienceStatus: "post_event",
      npsScore: 10
    })).toMatchObject({
      activeJourney: "advocacy",
      nextAction: "Introduce another organization"
    });
  });

  it("uses standard NPS bands", () => {
    expect(getNetPromoterBand(0)).toBe("recovery");
    expect(getNetPromoterBand(6)).toBe("recovery");
    expect(getNetPromoterBand(7)).toBe("passive");
    expect(getNetPromoterBand(8)).toBe("passive");
    expect(getNetPromoterBand(9)).toBe("promoter");
    expect(getNetPromoterBand(10)).toBe("promoter");
    expect(() => getNetPromoterBand(11)).toThrow();
  });

  it("shows participant activation, feedback, renewal, and promoter-only referrals together", () => {
    expect(growthSurface).toContain("Participants captured");
    expect(growthSurface).toContain("Individual accounts");
    expect(growthSurface).toContain("Plan another experience");
    expect(growthSurface).toContain("How likely are you to recommend SongKeep to another organization?");
    expect(growthSurface).toContain('band === "promoter"');
    expect(lifecycleRepository).toContain("sourceExperienceId");
    expect(firestoreRules).toContain("get(feedbackPath).data.band == 'promoter'");
  });
});

describe("experience-derived individual commerce", () => {
  it("keeps the post-event catalog distinct from organization experiences", () => {
    expect(postExperienceProducts).toHaveLength(3);
    expect(getPostExperienceProduct("digital-song-keepsake")?.requiresReleasedAssetKinds).toContain("song");
    expect(getPostExperienceProduct("unknown")).toBeUndefined();
  });

  it("requires claimed event access and preserves source attribution", () => {
    expect(postExperienceStore).toContain("listUserExperienceAccess");
    expect(postExperienceStore).toContain("createPostExperiencePurchaseIntent");
    expect(postExperienceStore).toContain("Purchasing a product does not expand");
    expect(firestoreRules).toContain("validPostExperiencePurchaseIntentCreate");
    expect(firestoreRules).toContain("request.resource.data.organizationId == get(accessPath).data.organizationId");
    expect(firestoreRules).toContain("request.resource.data.experienceId == get(accessPath).data.experienceId");
    expect(firestoreRules).toContain("request.resource.data.participantId == get(accessPath).data.participantId");
  });
});
