import type { ConsentScope } from "./consent";
import {
  experienceOfferings,
  getExperienceOffering,
  type ExperienceOfferingId
} from "./experience";
import type { EntityId, ISODateTime } from "./types";

export const serviceOfferings = experienceOfferings;
export type ServiceOfferingId = ExperienceOfferingId;

export const bookingSteps = [
  "experience",
  "organization",
  "schedule",
  "agreement",
  "payment",
  "setup",
  "ready"
] as const;
export type BookingStep = (typeof bookingSteps)[number];

export const bookingServiceCapabilities = {
  invitationResolution: false,
  identity: true,
  scheduling: false,
  agreementPersistence: false,
  payments: false,
  participantPersistence: false,
  consentPersistence: false,
  notifications: false,
  experiencePersistence: false
} as const;
export type BookingServiceCapability = keyof typeof bookingServiceCapabilities;

export function bookingActionIsAvailable(capability: BookingServiceCapability): boolean {
  return bookingServiceCapabilities[capability];
}

export function getServiceOffering(id: ServiceOfferingId) {
  return getExperienceOffering(id);
}

export function formatOfferingPrice(priceCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(priceCents / 100);
}

export interface BookingInvitation {
  id: EntityId;
  customerPersonId?: EntityId;
  organizationId?: EntityId;
  orderId?: EntityId;
  programRunId?: EntityId;
  offeringId: ServiceOfferingId;
  expiresAt?: ISODateTime;
}

export type LegalDocumentKind =
  | "service_terms"
  | "privacy_notice"
  | "cancellation_policy"
  | "electronic_records";

export interface LegalDocumentVersion {
  id: EntityId;
  kind: LegalDocumentKind;
  version: number;
  effectiveAt: ISODateTime;
  immutableStorageKey: string;
}

export interface AgreementAcceptance {
  id: EntityId;
  invitationId: EntityId;
  documentVersionId: EntityId;
  signerPersonId: EntityId;
  signingCapacity: "self" | "organization_representative" | "authorized_representative";
  acceptedAt: ISODateTime;
  evidenceHash: string;
}

export interface ParticipantPermissionForm {
  id: EntityId;
  programRunId?: EntityId;
  orderId?: EntityId;
  subjectPersonId: EntityId;
  completedByPersonId: EntityId;
  authorityBasis: "self" | "authorized_representative";
  scopes: ConsentScope[];
  signatureName: string;
  signedAt: ISODateTime;
  source: "electronic" | "paper";
  uploadedMediaAssetId?: EntityId;
}

export const participantPermissionScopes: ReadonlyArray<{
  scope: ConsentScope;
  label: string;
  description: string;
}> = [
  {
    scope: "participation",
    label: "Take part",
    description: "Permission to participate in the Honor a Life Song experience."
  },
  {
    scope: "interview_recording",
    label: "Record the conversation",
    description: "Permission to record an interview or story conversation."
  },
  {
    scope: "internal_creative_use",
    label: "Use the story to create the song",
    description: "Permission for the creative team to use approved story material while developing the song."
  },
  {
    scope: "designated_family_sharing",
    label: "Share with designated family",
    description: "Permission to share approved materials with the family members the participant designates."
  },
  {
    scope: "private_performance",
    label: "Include the song in a private performance",
    description: "Permission to perform the song at the private experience or event."
  },
  {
    scope: "event_photo_video",
    label: "Appear in event photos or video",
    description: "Permission for approved photography or video during the event."
  },
  {
    scope: "public_marketing",
    label: "Share publicly",
    description: "Optional permission for approved story, song, photo, or video material to be used publicly."
  },
  {
    scope: "testimonial",
    label: "Use an approved testimonial",
    description: "Optional permission to use a separately approved testimonial."
  }
];
