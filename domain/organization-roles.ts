import type { OrganizationMemberRole } from "./organization-account";

export const organizationRoleLabels: Record<OrganizationMemberRole, string> = {
  organization_admin: "Administrator",
  program_coordinator: "Event coordinator",
  billing_contact: "Billing contact",
  event_contact: "Event contact",
  viewer: "View only"
};

export const organizationRoleOptions: { value: OrganizationMemberRole; label: string }[] = [
  "viewer", "program_coordinator", "event_contact", "billing_contact", "organization_admin"
].map(value => ({ value: parseOrganizationRole(value), label: organizationRoleLabel(value) }));

export function parseOrganizationRole(value: string): OrganizationMemberRole {
  if (!Object.prototype.hasOwnProperty.call(organizationRoleLabels, value)) {
    throw new Error("Choose a valid team access level.");
  }
  return value as OrganizationMemberRole;
}

export function organizationRoleLabel(value?: string): string {
  return value && Object.prototype.hasOwnProperty.call(organizationRoleLabels, value)
    ? organizationRoleLabels[value as OrganizationMemberRole]
    : "Team member";
}

/** UI capability mirrors organizationExperienceManager; Firestore remains authoritative. */
export function canManageExperiencePeople(role?: OrganizationMemberRole): boolean {
  return role === "organization_admin" || role === "program_coordinator" || role === "event_contact";
}
