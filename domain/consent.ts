import type { EntityId, ISODateTime } from "./types";

export const consentScopes = ["participation", "interview_recording", "internal_creative_use", "designated_family_sharing", "private_performance", "event_photo_video", "public_marketing", "sponsor_acknowledgment", "testimonial", "extended_retention"] as const;
export type ConsentScope = (typeof consentScopes)[number];
export type ConsentState = "not_requested" | "pending" | "active" | "active_with_restrictions" | "withdrawn" | "superseded";

export interface ConsentRecord {
  id: EntityId;
  subjectPersonId: EntityId;
  grantedByPersonId: EntityId;
  authorityBasis: "self" | "authorized_representative";
  state: ConsentState;
  scopes: ConsentScope[];
  restrictions: string[];
  version: number;
  effectiveAt?: ISODateTime;
  withdrawnAt?: ISODateTime;
}

export type AuthorizationDecision = { allowed: boolean; reason?: string };

export function consentAllows(record: ConsentRecord | undefined, scope: ConsentScope): AuthorizationDecision {
  if (!record) return { allowed: false, reason: "Consent has not been established." };
  if (!record.scopes.includes(scope)) return { allowed: false, reason: `Consent does not include ${scope}.` };
  if (record.state !== "active" && record.state !== "active_with_restrictions") return { allowed: false, reason: `Consent state is ${record.state}.` };
  return { allowed: true };
}
