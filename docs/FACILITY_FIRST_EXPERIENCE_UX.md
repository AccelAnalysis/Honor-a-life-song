# Facility-first experience UX

This release changes the customer-facing composition without replacing the shared Honor a Life Song operating architecture.

## Customer journey

The facility journey is organized around the outcome the customer is trying to achieve:

```text
Choose an experience
→ identify the facility and preferred date
→ review agreement and payment choices
→ save the plan and complete the next payment step
→ prepare the experience
→ host the event
→ receive songs and memories
```

The public comparison now explains the $200 Single-Song Group Event and $2,500 Honor a Life Song Experience in terms of best fit, story capture, music, presentation, and post-event deliverables.

Booking uses four meaningful customer steps rather than exposing account, date, agreement, payment, setup, and completion as separate internal stages. A signed-in organization administrator can save an authoritative `OrganizationExperience` inquiry. A preferred date remains explicitly unconfirmed. Optional Stripe Payment Links can be configured through public checkout URL environment variables, and facilities can request an invoice when card checkout is unavailable or not preferred.

## Organization account

The five-item Organization account is the primary facility-facing experience:

- Home
- Experiences
- Songs & Memories
- Account
- Help

The deeper Facility / Project Ageless hierarchy remains available as advanced program coordination tools. The customer account instead emphasizes the next action, a four-stage experience journey, preparation tasks, billing and agreements, and post-event listening.

## Creator delivery

Creators receive assignments rather than being expected to navigate the full production taxonomy before acting. Each assignment identifies the organization, experience, participant when applicable, role, and due date.

Creator uploads are written as private organization assets with `organizationVisible: false` and a workflow state of `uploading` or `submitted`. A creator cannot release their own work.

The release path is:

```text
Creator assignment
→ private upload
→ Honor a Life Song review
→ approved
→ audience and permission check
→ release
→ organization library and/or private participant-family entitlement
```

Approval and release are separate actions. Participant or family release re-evaluates the active consent record and required scopes. Organization visibility is enabled only by an administrator during release.

## Post-event experience

Released songs appear in a music-first collection with native audio playback, song download, lyric access, and related event materials. Private participant and family sharing continues to use consent-backed entitlements and invitations.

## Configuration

Optional Stripe-hosted checkout URLs:

```text
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_SONG_GROUP_EVENT
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_HONOR_A_LIFE_SONG_EXPERIENCE
```

These URLs are public checkout links, not secret keys. The application saves the organization inquiry before redirecting to checkout. The platform does not mark a payment complete based on the browser redirect; payment must be reconciled from Stripe before billing status becomes paid.
