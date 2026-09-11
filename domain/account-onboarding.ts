import { normalizeExperienceOfferingId, type ExperienceOfferingId } from "./experience";
import type { OrganizationKind } from "./types";

export const organizationKinds: { value: OrganizationKind; label: string }[] = [
  { value: "business", label: "Company or team" },
  { value: "community_partner", label: "Community group" },
  { value: "faith_community", label: "Faith community" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "school", label: "School or education" },
  { value: "veterans_organization", label: "Veterans organization" },
  { value: "facility", label: "Senior living or care community" },
  { value: "healthcare", label: "Healthcare organization" },
  { value: "other", label: "Family or other group" }
];
export function contactName(firstName: string, lastName: string): string {
  if (!firstName.trim() || !lastName.trim()) throw new Error("Enter your first and last name.");
  return `${firstName.trim()} ${lastName.trim()}`;
}
export function canPlanExperience(role?: string): boolean { return role === "organization_admin"; }
export type BookingDraft = {
  organizationId: string;
  offeringId: ExperienceOfferingId;
  preferredDate?: string;
  preferredTime?: string;
  venue?: string;
  participantEstimate?: string;
  organizationGoal?: string;
  sourceExperienceId?: string;
  replacesRequestId?: string;
  requestKey?: string;
  requestSignature?: string;
};
/** Only explicit booking context belongs in links; never credentials or contact details. */
export function bookingReturnPath(input: { offeringId?: string; organizationId?: string; sourceExperienceId?: string; replacesRequestId?: string; query?: URLSearchParams }): string {
  const params = new URLSearchParams();
  const offering = normalizeExperienceOfferingId(input.offeringId);
  if (offering) params.set("offering", offering);
  if (input.organizationId) params.set("organizationId", input.organizationId);
  if (input.sourceExperienceId) params.set("sourceExperience", input.sourceExperienceId);
  if (input.replacesRequestId) params.set("replacesRequest", input.replacesRequestId);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"]) {
    const value = input.query?.get(key); if (value) params.set(key, value.slice(0, 200));
  }
  return params.size ? `/begin?${params}` : "/begin";
}
