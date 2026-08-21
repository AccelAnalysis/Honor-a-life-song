import { describe, expect, it } from "vitest";
import { canEnterWorkspace, canTransitionLoginAccess, type ResolvedIdentityContext } from "../domain/identity";
import { getLoginChildren, identityLifecycleExits, loginWorkflowNodes } from "../lib/identity-navigation";

describe("Identity / Login hierarchy", () => {
  it("preserves the source-backed child workflow order", () => {
    expect(getLoginChildren(null).map((node) => node.slug)).toEqual([
      "sign-in",
      "resolve-access",
      "enter-workspace"
    ]);
  });

  it("gives every grandchild a real parent route and keeps slugs unique", () => {
    const slugs = new Set(loginWorkflowNodes.map((node) => node.slug));
    expect(slugs.size).toBe(loginWorkflowNodes.length);

    for (const node of loginWorkflowNodes.filter((item) => item.parentSlug)) {
      expect(slugs.has(node.parentSlug as string)).toBe(true);
    }
  });

  it("keeps source-defined identity lifecycle exits concrete", () => {
    expect(identityLifecycleExits.map((item) => item.href)).toEqual([
      "/create-account",
      "/verify-email",
      "/password-recovery",
      "/accept-invitation",
      "/multi-factor-authentication",
      "/access-consent-error"
    ]);
  });
});

describe("Login access state contract", () => {
  it("supports MFA as a conditional branch instead of a mandatory step", () => {
    expect(canTransitionLoginAccess("primary_authentication", "mfa_challenge")).toBe(true);
    expect(canTransitionLoginAccess("primary_authentication", "person_resolved")).toBe(true);
    expect(canTransitionLoginAccess("mfa_challenge", "person_resolved")).toBe(true);
  });

  it("fails closed when workspace authorization has not been resolved", () => {
    expect(canEnterWorkspace(undefined, "customer").allowed).toBe(false);
  });

  it("allows only explicitly permitted workspaces", () => {
    const context: ResolvedIdentityContext = {
      personId: "person-1",
      memberships: [{ id: "membership-1", personId: "person-1", role: "facility_staff", organizationId: "facility-1" }],
      roles: ["facility_staff"],
      activeOrganizationId: "facility-1",
      permittedWorkspaces: ["facility"]
    };

    expect(canEnterWorkspace(context, "facility").allowed).toBe(true);
    expect(canEnterWorkspace(context, "admin").allowed).toBe(false);
  });
});
