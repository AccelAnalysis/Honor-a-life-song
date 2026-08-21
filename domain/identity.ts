import type { EntityId, Membership, PersonRole } from "./types";
import type { WorkspaceId } from "../lib/navigation";

export type LoginAccessState =
  | "signed_out"
  | "primary_authentication"
  | "mfa_challenge"
  | "person_resolved"
  | "memberships_resolved"
  | "roles_resolved"
  | "organization_context_resolved"
  | "workspace_access_resolved"
  | "authenticated"
  | "access_denied";

export const loginAccessTransitions: Record<LoginAccessState, LoginAccessState[]> = {
  signed_out: ["primary_authentication"],
  primary_authentication: ["mfa_challenge", "person_resolved", "access_denied"],
  mfa_challenge: ["person_resolved", "access_denied"],
  person_resolved: ["memberships_resolved", "access_denied"],
  memberships_resolved: ["roles_resolved", "access_denied"],
  roles_resolved: ["organization_context_resolved", "access_denied"],
  organization_context_resolved: ["workspace_access_resolved", "access_denied"],
  workspace_access_resolved: ["authenticated", "access_denied"],
  authenticated: ["signed_out"],
  access_denied: ["signed_out"]
};

export interface ResolvedIdentityContext {
  personId: EntityId;
  memberships: Membership[];
  roles: PersonRole[];
  activeOrganizationId?: EntityId;
  permittedWorkspaces: WorkspaceId[];
}

export type AccessDecision = { allowed: true } | { allowed: false; reason: string };

export function canTransitionLoginAccess(from: LoginAccessState, to: LoginAccessState) {
  return loginAccessTransitions[from].includes(to);
}

export function canEnterWorkspace(context: ResolvedIdentityContext | undefined, workspace: WorkspaceId): AccessDecision {
  if (!context) return { allowed: false, reason: "Authenticated identity context has not been resolved." };
  if (!context.memberships.length) return { allowed: false, reason: "No active membership is available for this person." };
  if (!context.roles.length) return { allowed: false, reason: "No platform role is available for this person." };
  if (!context.permittedWorkspaces.includes(workspace)) return { allowed: false, reason: `The ${workspace} workspace is not permitted for this identity context.` };
  return { allowed: true };
}
