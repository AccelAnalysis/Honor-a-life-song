# Identity / Login Workflow Hierarchy

## Scope

This slice implements the child and grandchild workflow hierarchy beneath **Identity / Access → Login**. It does not select or simulate a production identity provider.

The governing source architecture defines Identity / Access as the shell that establishes who a person is and how they are permitted to enter the platform. Production identity is expected to plug in behind `IdentityService`, `SessionService` and `AuthorizationService`, then resolve:

```text
Identity Provider
  → Authenticated Person
  → Membership(s)
  → Role(s)
  → Organization Context
  → Permitted Workspace(s)
```

## Governed Login hierarchy

```text
Identity / Access
└── Login
    ├── Sign In
    │   ├── Identity Provider Handoff
    │   └── Multi-Factor Challenge (conditional)
    │
    ├── Resolve Access
    │   ├── Authenticated Person
    │   ├── Memberships
    │   ├── Roles
    │   └── Organization Context
    │
    └── Enter Workspace
        └── Permitted Workspaces
```

### Sign In

Login starts the authentication handoff. The presentation layer does not own a credential database and does not locally declare authentication success.

#### Identity Provider Handoff

The selected provider will authenticate the person. `IdentityService` must normalize the provider result for the platform, while `SessionService` owns the authoritative session.

The provider remains intentionally unselected because the source scope still lists hosting and identity stack selection as an open decision.

#### Multi-Factor Challenge

MFA is conditional rather than a mandatory step for every identity. The source scope specifically requires multi-factor authentication for administrators and staff. Provider-specific enrollment, factor selection and challenge verification remain provider responsibilities.

### Resolve Access

Authentication alone does not determine which platform experience may be entered. `AuthorizationService` resolves the provider identity into the chassis domain model.

#### Authenticated Person

The external/provider identity resolves to the canonical `Person` record. Features must not create an alternate user model.

#### Memberships

`Membership` associates a person with a platform or organization context and role. A person can have more than one membership.

#### Roles

The current canonical role vocabulary is:

- customer;
- family collaborator;
- authorized representative;
- facility staff;
- creator; and
- admin.

Role checks belong to the authorization boundary, not individual presentation components.

#### Organization Context

Where a membership is organization-scoped, Login resolves the active organization context before workspace access is granted. This is especially important for facility staff, who must be limited to their own program context.

### Enter Workspace

The final Login stage resolves the set of permitted authenticated workspaces.

#### Permitted Workspaces

The operating chassis currently provides these shared workspace contexts:

- Customer / Family;
- Facility / Project Ageless;
- Creator / Production; and
- Admin / Operations.

The Login workflow must redirect only to a workspace present in the resolved identity context. Unresolved or unpermitted access fails closed.

## Sibling identity exits reached from Login

The source page tree defines several Identity / Access destinations alongside Login. They are not reclassified as Login children; Login merely provides concrete handoffs when the condition applies.

```text
Login
├── new account ----------------------→ Create Account
├── unverified account ---------------→ Verify Email
├── lost credential ------------------→ Password Recovery
├── invitation-based entry -----------→ Accept Invitation
├── MFA enrollment/policy surface ----→ Multi-Factor Authentication
└── denied/restricted access ----------→ Access / Consent Error States
```

This slice exposes those destinations as explicit chassis boundaries so Login does not dead-end. Their full business workflows remain separate implementation slices.

## Login state contract

The domain contract supports this fail-closed state progression:

```text
signed_out
  → primary_authentication
      ├── mfa_challenge → person_resolved
      ├── person_resolved
      └── access_denied
  → memberships_resolved
  → roles_resolved
  → organization_context_resolved
  → workspace_access_resolved
      ├── authenticated
      └── access_denied
```

MFA is intentionally optional in the transition graph because policy determines whether it is required for a particular identity.

## Authorization and consent remain separate

Login and workspace authorization answer **whether this user may enter or act in a platform context**. They do not imply that a participant has consented to a particular recording, family-sharing, performance, photography/video, marketing, sponsor-acknowledgment, testimonial or retention use.

Consent remains a separate domain decision and may produce its own fail-closed error state downstream.

## Production integration requirements

A production identity implementation can replace the provider-required boundaries without changing this hierarchy. It must:

1. authenticate through the selected provider;
2. establish the session server-side;
3. resolve the canonical `Person`;
4. load active `Membership` records;
5. resolve roles from those memberships;
6. resolve the authorized organization context;
7. calculate permitted workspaces;
8. redirect only after authorization succeeds; and
9. emit explicit denied/error states when resolution fails.

The UI must not treat browser state, a provider redirect, or possession of a route as proof of authorization.
