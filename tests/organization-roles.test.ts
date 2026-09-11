import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { OrganizationMemberRole } from "../domain/organization-account";
import { canPlanExperience } from "../domain/account-onboarding";
import { canManageExperiencePeople, organizationRoleLabel, organizationRoleOptions, parseOrganizationRole } from "../domain/organization-roles";

const roles: OrganizationMemberRole[] = ["organization_admin", "program_coordinator", "billing_contact", "event_contact", "viewer"];
describe("canonical organization roles", () => {
  it("offers only canonical roles and rejects the nonexistent coordinator alias", () => {
    expect(organizationRoleOptions.map(option => option.value).sort()).toEqual([...roles].sort());
    roles.forEach(role => expect(parseOrganizationRole(role)).toBe(role));
    for (const value of ["coordinator", "admin", "__proto__", "constructor", ""]) expect(() => parseOrganizationRole(value)).toThrow();
    expect(organizationRoleLabel("program_coordinator")).toBe("Event coordinator");
    expect(organizationRoleLabel("unrecognized")).toBe("Team member");
  });
  it("allows program coordinators and event contacts to manage people, not purchases", () => {
    for (const role of roles) {
      expect(canManageExperiencePeople(role)).toBe(["organization_admin", "program_coordinator", "event_contact"].includes(role));
      expect(canPlanExperience(role)).toBe(role === "organization_admin");
    }
    expect(canManageExperiencePeople(undefined)).toBe(false);
  });
  it("keeps browser choices and experience controls tied to the shared role contract", () => {
    const team = readFileSync("components/organization-team.tsx", "utf8");
    const experience = readFileSync("components/organization-relationship.tsx", "utf8");
    const profile = readFileSync("domain/customer-lifecycle.ts", "utf8");
    const rules = readFileSync("firestore.rules", "utf8");
    expect(team).toContain("organizationRoleOptions.map");
    expect(team).toContain('role: parseOrganizationRole(');
    expect(experience).toContain("canManageExperiencePeople(organization?.membershipRole)");
    expect(profile).toContain("membershipRole?: OrganizationMemberRole");
    const match = rules.match(/function organizationExperienceManager\(orgId\)\s*\{([\s\S]*?)\}/);
    expect(match).not.toBeNull();
    roles.forEach(role => expect(match![1].includes(`'${role}'`)).toBe(canManageExperiencePeople(role)));
  });
});
