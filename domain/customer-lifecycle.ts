import type { EntityId, ISODateTime } from "./types";
import type { OrganizationExperienceStatus } from "./organization-account";

export type BillingLifecycleState =
  | "not_started"
  | "invoice_requested"
  | "awaiting_payment"
  | "paid"
  | "past_due"
  | "refunded";

export type CustomerJourneyKind =
  | "pre_purchase"
  | "invoice_follow_up"
  | "customer_onboarding"
  | "participant_readiness"
  | "post_experience_care"
  | "service_recovery"
  | "loyalty_and_renewal"
  | "advocacy";

export type NetPromoterBand = "recovery" | "passive" | "promoter";

export interface ExperienceFeedback {
  id: EntityId;
  organizationId: EntityId;
  experienceId: EntityId;
  submittedByUserId: EntityId;
  npsScore: number;
  satisfactionScore?: number;
  mostMeaningful?: string;
  improvement?: string;
  band: NetPromoterBand;
  createdAt: ISODateTime;
}

export interface OrganizationReferral {
  id: EntityId;
  organizationId: EntityId;
  sourceExperienceId: EntityId;
  advocateUserId: EntityId;
  referredOrganizationName: string;
  referredContactName?: string;
  referredContactEmail?: string;
  relationship?: string;
  message?: string;
  status: "submitted" | "contacted" | "qualified" | "booked" | "closed";
  createdAt: ISODateTime;
}

export interface LifecyclePlanInput {
  billingState: BillingLifecycleState;
  experienceStatus?: OrganizationExperienceStatus;
  npsScore?: number;
  hasFutureExperience?: boolean;
}

export interface LifecyclePlan {
  activeJourney: CustomerJourneyKind;
  nextAction: string;
  suppressedJourneys: CustomerJourneyKind[];
}

export function getNetPromoterBand(score: number): NetPromoterBand {
  if (!Number.isInteger(score) || score < 0 || score > 10) {
    throw new Error("NPS score must be a whole number from 0 through 10.");
  }
  if (score <= 6) return "recovery";
  if (score <= 8) return "passive";
  return "promoter";
}

/**
 * Customer communications are driven by authoritative commercial and experience
 * state. This prevents invoice reminders after payment and advocacy requests
 * before service recovery has been completed.
 */
export function deriveLifecyclePlan(input: LifecyclePlanInput): LifecyclePlan {
  if (["invoice_requested", "awaiting_payment", "past_due"].includes(input.billingState)) {
    return {
      activeJourney: "invoice_follow_up",
      nextAction: input.billingState === "past_due" ? "Resolve the outstanding invoice" : "Complete payment",
      suppressedJourneys: ["customer_onboarding", "participant_readiness", "post_experience_care", "advocacy"]
    };
  }

  if (input.billingState !== "paid") {
    return {
      activeJourney: "pre_purchase",
      nextAction: "Choose an experience and payment path",
      suppressedJourneys: ["customer_onboarding", "participant_readiness", "post_experience_care", "advocacy"]
    };
  }

  if (!input.experienceStatus || ["inquiry", "proposed", "contracted", "preparing"].includes(input.experienceStatus)) {
    return {
      activeJourney: "customer_onboarding",
      nextAction: "Prepare the organization experience",
      suppressedJourneys: ["post_experience_care", "advocacy"]
    };
  }

  if (["active", "assets_processing"].includes(input.experienceStatus)) {
    return {
      activeJourney: "participant_readiness",
      nextAction: "Complete participant access and delivery readiness",
      suppressedJourneys: ["advocacy"]
    };
  }

  if (input.npsScore === undefined) {
    return {
      activeJourney: "post_experience_care",
      nextAction: "Share feedback about the completed experience",
      suppressedJourneys: ["advocacy"]
    };
  }

  const band = getNetPromoterBand(input.npsScore);
  if (band === "recovery") {
    return {
      activeJourney: "service_recovery",
      nextAction: "Connect with the SongKeep team",
      suppressedJourneys: ["advocacy"]
    };
  }

  if (band === "promoter") {
    return {
      activeJourney: "advocacy",
      nextAction: "Introduce another organization",
      suppressedJourneys: []
    };
  }

  return {
    activeJourney: "loyalty_and_renewal",
    nextAction: input.hasFutureExperience ? "Prepare for the next experience" : "Plan the next experience",
    suppressedJourneys: ["advocacy"]
  };
}
