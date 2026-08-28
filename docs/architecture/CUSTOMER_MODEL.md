# Governing Customer Model

This document is the authority for customer ownership, acquisition, experience setup, and post-event access. Where an older chassis document describes an individual buyer, a permanent facility mega-workspace, or a family entering through the full Customer workspace, this model takes precedence.

## Locked decisions

1. The organization is the primary customer and account owner.
2. Every initial commercial purchase belongs to an organization.
3. The $200 product is the **Single-Song Group Event**: shared story capture, one shared song, and an event presentation.
4. The $2,500 product is the **Honor a Life Song Experience**: named participants, interviews, multiple songs, and a follow-up concert.
5. Each completed purchase creates an `OrganizationExperience`.
6. Participants belong to an experience and need no account merely to participate.
7. Organization agreements and participant consent are different records and authorities.
8. Organization-visible assets and participant-level assets are different audiences.
9. An authorized organization contact can facilitate participant or family sharing but cannot create permission the participant did not grant.
10. Participant and family access begins with a lightweight invitation/claim and private memories experience, not the full Customer workspace.
11. One organization account retains all past and future experiences.
12. Detailed facility workflows appear inside the relevant experience instead of permanent global customer navigation.
13. Public acquisition speaks to organization decision-makers while retaining participant-centered imagery and emotional storytelling.
14. Individual-consumer purchase language and calls to action are not part of the primary acquisition flow.

## Ownership

```text
OrganizationAccount
  └── OrganizationExperience
        ├── ExperienceParticipant
        │     └── ExperienceConsentRecord (versioned)
        ├── OrganizationAsset
        ├── ExperienceAssetEntitlement
        └── ExperienceAccessInvitation
              └── UserExperienceAccess (claim receipt, not permission authority)
```

An organization account is long-lived. An experience is the purchased unit. A participant is scoped to that experience rather than treated as a purchaser or required account holder.

## Experience templates

| Product | Buyer | Story capture | Output | Presentation | Experience sections |
| --- | --- | --- | --- | --- | --- |
| Single-Song Group Event — $200 | Organization | Shared group story | One shared song | Event presentation | Overview, Event setup, Shared song, Event materials |
| Honor a Life Song Experience — $2,500 | Organization | Several participant interviews | Multiple participant songs | Follow-up concert | Overview, Participants, Interviews, Songs, Concert, Event materials |

The canonical catalog is `domain/experience.ts`. Legacy offering identifiers are accepted only as migration aliases and normalize to these organization-owned templates.

## Customer journeys

### Organization acquisition

```text
Public site → Choose experience → Organization/sign in → Preferred date
→ Scope and agreements → Payment → Package-aware setup
→ Organization experience
```

Missing scheduling, agreement, payment, and transactional persistence adapters fail closed. The browser never labels those actions successful merely because a user completed a local field.

### Organization account

Global navigation stays small: **Home · Experiences · Songs & Memories · Account · Help**. Package-specific work appears inside an experience. The group-event template stays light; the full template exposes participant, interview, song, concert, and material workflows.

### Participant and family

Before and during an event, participation does not require an account. Permission may be captured electronically, with assistance, or on paper using the same granular scopes.

After an event, an organization manager may create a participant or designated-family invitation only when an active asset entitlement already exists. The recipient signs in with the invited verified email, claims the invitation, and lands in `/memories`. Secure media delivery remains responsible for rechecking token state, entitlement, consent, and asset authorization at access time.

## Permission and asset boundaries

- Organization service agreements do not grant participation, recording, family sharing, event media, public marketing, or testimonial permission.
- Participant and designated-family entitlements require an active consent record containing the applicable scope. Email claims must also match a participant-delivery or designated-family address recorded with that permission version.
- Restricted, pending, withdrawn, expired, or superseded consent fails closed.
- A material consent revision revokes prior entitlements and pending access invitations. Operations must deliberately re-release applicable assets against the new consent version.
- `organizationVisible` controls whether an organization member can read asset metadata.
- Organization files use `organizations/{orgId}/organization/**`.
- Participant files use `organizations/{orgId}/participants/{participantId}/**` and are not directly readable by organization members in the current client rules.
- A stored file path alone does not make an asset ready. A resolved delivery location is required, and production private delivery must use server-authorized short-lived access.

## Current integration state

Firebase Authentication, organization accounts, membership invitations, organization experience administration, participant persistence, consent recording, asset entitlements, verified-email claims, and the private memories index have client/data boundaries in this repository.

Scheduling, payment, transactional email, customer-side purchase-to-experience creation, and production secure-media authorization remain disconnected. Their UI paths must continue to fail closed until authoritative adapters exist.
