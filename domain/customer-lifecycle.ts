import type { ConsentScope } from "./consent";
import type { ExperienceOfferingId } from "./experience";
import type { EntityId, ISODateTime, OrganizationKind } from "./types";

export type OrganizationContactRole =
  | "primary_contact"
  | "authorized_buyer"
  | "billing_contact"
  | "program_contact"
  | "executive_signatory";

export interface OrganizationRelationshipProfile {
  id: EntityId;
  name: string;
  kind: OrganizationKind;
  organizationEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
  contact: {
    userId: EntityId;
    displayName: string;
    email: string;
    title?: string;
    phone?: string;
    relationshipRole: OrganizationContactRole;
    primary: boolean;
  };
}

export type ExperienceRequestStatus =
  | "invoice_requested"
  | "invoice_open"
  | "payment_pending"
  | "converted"
  | "cancelled";

export type ExperienceRequestFinancialStatus =
  | "invoice_requested"
  | "invoice_open"
  | "payment_pending"
  | "paid"
  | "refunded"
  | "cancelled";

export type ExperienceRequestPaymentMethod = "card" | "invoice";

export type NurtureTrack =
  | "invoice_payment"
  | "payment_reconciliation"
  | "customer_onboarding"
  | "post_experience"
  | "renewal"
  | "service_recovery"
  | "consideration"
  | "advocacy";

export interface AcquisitionContext {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  referralCode?: string;
}

export interface OrganizationExperienceRequest {
  id: EntityId;
  organizationId: EntityId;
  organizationName: string;
  createdByUserId: EntityId;
  offeringId: ExperienceOfferingId;
  offeringName: string;
  amountCents: number;
  currency: "USD";
  status: ExperienceRequestStatus;
  financialStatus: ExperienceRequestFinancialStatus;
  requestedPaymentMethod: ExperienceRequestPaymentMethod;
  preferredStartsAt: ISODateTime;
  venue?: string;
  participantEstimate?: number;
  organizationGoal?: string;
  agreementAcknowledged: boolean;
  agreementVersion: string;
  sourceExperienceId?: EntityId;
  replacesRequestId?: EntityId;
  experienceId?: EntityId;
  invoiceUrl?: string;
  invoiceDueAt?: ISODateTime;
  nurtureTrack: NurtureTrack;
  nextAction: string;
  acquisition?: AcquisitionContext;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type NpsBranch = "service_recovery" | "relationship_nurture" | "promoter";

export function branchForNps(score: number): NpsBranch {
  if (!Number.isInteger(score) || score < 0 || score > 10) {
    throw new Error("NPS must be a whole number from 0 through 10.");
  }
  if (score <= 6) return "service_recovery";
  if (score <= 8) return "relationship_nurture";
  return "promoter";
}

export const npsBranchCopy: Record<NpsBranch, { title: string; body: string }> = {
  service_recovery: {
    title: "Thank you for telling us.",
    body: "A SongKeep team member should follow up before any referral or review request is made."
  },
  relationship_nurture: {
    title: "Thank you for sharing your experience.",
    body: "SongKeep can stay connected and use your feedback to improve the next experience."
  },
  promoter: {
    title: "Thank you for being a SongKeep advocate.",
    body: "You can now introduce another organization or share an approved testimonial."
  }
};

export type FeedbackAudience = "organization" | "participant" | "designated_family";

export interface ExperienceFeedback {
  id: EntityId;
  organizationId: EntityId;
  experienceId: EntityId;
  audience: FeedbackAudience;
  submittedByUserId: EntityId;
  score: number;
  satisfaction?: number;
  comments?: string;
  branch: NpsBranch;
  followUpStatus: "not_required" | "required" | "in_progress" | "resolved";
  createdAt: ISODateTime;
}

export interface OrganizationReferral {
  id: EntityId;
  organizationId: EntityId;
  experienceId: EntityId;
  feedbackId: EntityId;
  submittedByUserId: EntityId;
  advocateName: string;
  advocateEmail: string;
  referredOrganizationName: string;
  referredContactName?: string;
  referredContactEmail?: string;
  message?: string;
  status: "submitted" | "contacted" | "qualified" | "booked" | "closed";
  createdAt: ISODateTime;
}

export type ParticipantPermissionInvitationStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "revoked";

export interface ParticipantPermissionInvitation {
  id: EntityId;
  organizationId: EntityId;
  organizationName: string;
  experienceId: EntityId;
  experienceTitle: string;
  participantId: EntityId;
  participantName: string;
  recipientEmail: string;
  recipientName?: string;
  agreementVersion: string;
  status: ParticipantPermissionInvitationStatus;
  invitedByUserId: EntityId;
  createdAt: ISODateTime;
  submittedAt?: ISODateTime;
  submittedByUserId?: EntityId;
  signatureName?: string;
  authorityBasis?: "self" | "authorized_representative";
  scopes?: ConsentScope[];
  restrictions?: string[];
  participantDeliveryEmail?: string;
  designatedFamilyEmails?: string[];
  consentRecordId?: EntityId;
  reviewedAt?: ISODateTime;
}

export type PostExperienceProductKind =
  | "digital_song"
  | "printed_lyrics"
  | "song_card"
  | "event_video"
  | "photo_music_package"
  | "additional_copy"
  | "personalized_follow_on"
  | "other";

export interface PostExperienceProduct {
  id: EntityId;
  name: string;
  description: string;
  kind: PostExperienceProductKind;
  status: "active" | "inactive";
  priceCents?: number;
  currency: "USD";
  checkoutUrl?: string;
  audiences: Array<"participant" | "designated_family">;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type IndividualPurchaseRequestStatus =
  | "invoice_requested"
  | "payment_pending"
  | "paid"
  | "in_fulfillment"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export interface IndividualPurchaseRequest {
  id: EntityId;
  userId: EntityId;
  accessId: EntityId;
  organizationId: EntityId;
  organizationName: string;
  experienceId: EntityId;
  experienceTitle: string;
  participantId: EntityId;
  participantName: string;
  recipient: "participant" | "designated_family";
  productId: EntityId;
  productName: string;
  priceCents?: number;
  currency: "USD";
  requestedPaymentMethod: "card" | "invoice";
  status: IndividualPurchaseRequestStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export function formatLifecycleMoney(priceCents?: number): string {
  if (priceCents === undefined) return "Price confirmed with SongKeep";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(priceCents / 100);
}
