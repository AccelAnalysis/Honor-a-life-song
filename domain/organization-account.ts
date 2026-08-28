import type { EntityId, ISODateTime, OrganizationKind } from "./types";

export type OrganizationMemberRole =
  | "organization_admin"
  | "program_coordinator"
  | "billing_contact"
  | "event_contact"
  | "viewer";

export type OrganizationAgreementKind =
  | "terms"
  | "privacy"
  | "service_agreement"
  | "event_scope"
  | "payment_cancellation"
  | "media"
  | "other";

export type OrganizationAgreementStatus = "requested" | "signed" | "superseded" | "void";
export type OrganizationExperienceStatus =
  | "inquiry"
  | "proposed"
  | "contracted"
  | "preparing"
  | "active"
  | "assets_processing"
  | "post_event"
  | "closed"
  | "cancelled";

export type OrganizationAssetKind = "song" | "lyrics" | "event_video" | "photo" | "report" | "keepsake" | "other";

export interface OrganizationAccount {
  id: EntityId;
  name: string;
  kind: OrganizationKind;
  createdBy: EntityId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  billingEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export interface OrganizationMember {
  userId: EntityId;
  email: string;
  displayName: string;
  role: OrganizationMemberRole;
  status: "active" | "inactive";
  joinedAt: ISODateTime;
}

export interface OrganizationInvitation {
  id: EntityId;
  organizationId: EntityId;
  email: string;
  role: OrganizationMemberRole;
  status: "pending" | "accepted" | "revoked";
  invitedBy: EntityId;
  createdAt: ISODateTime;
  acceptedAt?: ISODateTime;
}

export interface OrganizationAgreement {
  id: EntityId;
  organizationId: EntityId;
  title: string;
  kind: OrganizationAgreementKind;
  documentVersion: string;
  status: OrganizationAgreementStatus;
  relatedExperienceId?: EntityId;
  documentUrl?: string;
  requestedAt: ISODateTime;
  signedAt?: ISODateTime;
  signedByUserId?: EntityId;
  signedByName?: string;
  signedByTitle?: string;
  electronicRecordsAccepted?: boolean;
}

export interface OrganizationExperience {
  id: EntityId;
  organizationId: EntityId;
  title: string;
  experienceType: string;
  status: OrganizationExperienceStatus;
  startsAt?: ISODateTime;
  endsAt?: ISODateTime;
  venue?: string;
  nextAction?: string;
  participantReadyCount?: number;
  participantExpectedCount?: number;
  billingStatus?: "not_started" | "deposit_due" | "deposit_paid" | "balance_due" | "paid" | "refunded";
  invoiceUrl?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface OrganizationSuggestedDate {
  id: EntityId;
  organizationId: EntityId;
  startsAt: ISODateTime;
  label?: string;
  status: "suggested" | "interested" | "declined" | "expired";
  createdAt: ISODateTime;
}

export interface OrganizationAsset {
  id: EntityId;
  organizationId: EntityId;
  experienceId: EntityId;
  title: string;
  kind: OrganizationAssetKind;
  status: "processing" | "ready" | "restricted";
  storagePath?: string;
  downloadUrl?: string;
  createdAt: ISODateTime;
}
