export type LoginWorkflowAvailability = "chassis" | "provider_required";

export type LoginWorkflowNode = {
  id: string;
  label: string;
  slug: string;
  description: string;
  parentSlug: string | null;
  availability: LoginWorkflowAvailability;
  sourceBasis: string;
};

export const loginWorkflowNodes: LoginWorkflowNode[] = [
  {
    id: "login-sign-in",
    label: "Sign In",
    slug: "sign-in",
    description: "Begin the server-authoritative authentication handoff without storing or validating credentials in the presentation shell.",
    parentSlug: null,
    availability: "provider_required",
    sourceBasis: "Login is the Identity / Access entry point; production authentication plugs in behind IdentityService, SessionService and AuthorizationService."
  },
  {
    id: "login-provider",
    label: "Identity Provider Handoff",
    slug: "sign-in/provider",
    description: "Authenticate with the selected production identity provider and return a normalized authenticated identity result to the platform services.",
    parentSlug: "sign-in",
    availability: "provider_required",
    sourceBasis: "The chassis reserves an identity-provider integration boundary and explicitly defers provider selection and production authentication."
  },
  {
    id: "login-mfa",
    label: "Multi-Factor Challenge",
    slug: "sign-in/mfa",
    description: "When policy requires it, complete MFA before identity context is accepted. Administrators and staff require multi-factor authentication in the product scope.",
    parentSlug: "sign-in",
    availability: "provider_required",
    sourceBasis: "Multi-Factor Authentication is a governed Identity / Access lifecycle destination; the product scope requires MFA for administrators and staff."
  },
  {
    id: "login-resolve-access",
    label: "Resolve Access",
    slug: "resolve-access",
    description: "Translate the authenticated provider identity into the platform's canonical person, membership, role and organization context.",
    parentSlug: null,
    availability: "chassis",
    sourceBasis: "Authenticated Person → Membership(s) → Role(s) → Organization Context is the chassis identity-resolution sequence."
  },
  {
    id: "login-person",
    label: "Authenticated Person",
    slug: "resolve-access/person",
    description: "Resolve the provider identity to the canonical Person record rather than creating a second identity model inside the login UI.",
    parentSlug: "resolve-access",
    availability: "chassis",
    sourceBasis: "Person is the canonical identity domain entity established by the operating chassis."
  },
  {
    id: "login-memberships",
    label: "Memberships",
    slug: "resolve-access/memberships",
    description: "Resolve the person's platform and organization memberships that establish the contexts in which the person may act.",
    parentSlug: "resolve-access",
    availability: "chassis",
    sourceBasis: "Membership is a canonical chassis entity between Person and role/organization access."
  },
  {
    id: "login-roles",
    label: "Roles",
    slug: "resolve-access/roles",
    description: "Resolve the roles granted through membership using the canonical customer, family collaborator, authorized representative, facility staff, creator and admin role vocabulary.",
    parentSlug: "resolve-access",
    availability: "chassis",
    sourceBasis: "The chassis defines role values and requires authorization to enforce them rather than duplicating role logic in features."
  },
  {
    id: "login-organization",
    label: "Organization Context",
    slug: "resolve-access/organization",
    description: "Resolve the active organization when the person's membership is scoped to a facility or another supported organization context.",
    parentSlug: "resolve-access",
    availability: "chassis",
    sourceBasis: "Organization Context follows roles in the governed identity sequence."
  },
  {
    id: "login-enter-workspace",
    label: "Enter Workspace",
    slug: "enter-workspace",
    description: "Complete authorization by resolving which governed authenticated workspace destinations are permitted for the identity context.",
    parentSlug: null,
    availability: "chassis",
    sourceBasis: "Permitted Workspace(s) is the final chassis identity-resolution step before entering the shared authenticated workspace."
  },
  {
    id: "login-permitted-workspaces",
    label: "Permitted Workspaces",
    slug: "enter-workspace/permitted-workspaces",
    description: "Authorize only the Customer, Facility, Creator or Admin workspace destinations included in the resolved identity context.",
    parentSlug: "enter-workspace",
    availability: "chassis",
    sourceBasis: "The operating chassis provides one authenticated workspace composition with role-aware Customer, Facility, Creator and Admin contexts."
  }
];

export const identityLifecycleExits = [
  { label: "Create Account", href: "/create-account", reason: "New person or account setup is a sibling Identity / Access workflow." },
  { label: "Verify Email", href: "/verify-email", reason: "Unverified accounts leave Login for the governed email-verification workflow." },
  { label: "Password Recovery", href: "/password-recovery", reason: "Credential recovery is a sibling Identity / Access workflow rather than client-side login behavior." },
  { label: "Accept Invitation", href: "/accept-invitation", reason: "Invited family, facility, creator and representative access enters through the invitation workflow." },
  { label: "Multi-Factor Authentication", href: "/multi-factor-authentication", reason: "MFA policy and enrollment remain a governed sibling lifecycle surface even when a challenge is reached from Login." },
  { label: "Access / Consent Error States", href: "/access-consent-error", reason: "Denied access and consent-specific failures use explicit fail-closed error states." }
] as const;

export type IdentityLifecycleSlug =
  | "create-account"
  | "verify-email"
  | "password-recovery"
  | "accept-invitation"
  | "multi-factor-authentication"
  | "access-consent-error";

export const identityLifecycleDestinations: Record<IdentityLifecycleSlug, { label: string; description: string }> = {
  "create-account": { label: "Create Account", description: "Reserved identity workflow for creating an account before production identity and persistence are connected." },
  "verify-email": { label: "Verify Email", description: "Reserved identity workflow for account email verification." },
  "password-recovery": { label: "Password Recovery", description: "Reserved identity workflow for recovering access without weakening authentication controls." },
  "accept-invitation": { label: "Accept Invitation", description: "Reserved identity workflow for family, facility staff, creator and authorized-representative invitations." },
  "multi-factor-authentication": { label: "Multi-Factor Authentication", description: "Reserved identity workflow for MFA enrollment and policy-driven challenges." },
  "access-consent-error": { label: "Access / Consent Error States", description: "Reserved fail-closed surface for authorization failures and separate consent-specific restrictions." }
};

export const identityLifecycleSlugs = Object.keys(identityLifecycleDestinations) as IdentityLifecycleSlug[];

export function getLoginNode(slug: string) {
  return loginWorkflowNodes.find((node) => node.slug === slug);
}

export function getLoginChildren(parentSlug: string | null) {
  return loginWorkflowNodes.filter((node) => node.parentSlug === parentSlug);
}

export function getLoginTrail(slug: string) {
  const trail: LoginWorkflowNode[] = [];
  let current = getLoginNode(slug);
  while (current) {
    trail.unshift(current);
    current = current.parentSlug ? getLoginNode(current.parentSlug) : undefined;
  }
  return trail;
}
