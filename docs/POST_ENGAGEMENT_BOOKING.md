# Post-Engagement Booking and Participant Onboarding

## Purpose

This slice turns an already-engaged customer into a guided platform handoff without exposing the Admin, Customer, Facility, payment, consent, or workflow architecture.

The intended customer sequence is:

```text
Invitation
→ identify / sign in
→ confirm the selected experience
→ choose a date
→ review the governing documents
→ pay
→ add participants
→ complete participant permissions
→ begin the ongoing song / program experience
```

The customer-facing route is `/begin`.

## Current catalog authority

The current customer prices are defined once in `domain/booking.ts`:

- Individual Legacy Song — **$200**
- Complete Honor-a-Life-Song Experience — **$2,500**

This slice intentionally does not invent package inclusions, deposits, installment schedules, cancellation rules, or refund rules that have not been approved.

## Consumer presentation rules

The booking experience must remain visually separate from an operations workspace.

- no authenticated sidebar
- no Admin navigation
- no record IDs
- no state-machine labels
- no service-provider language in primary headings or calls to action
- minimal borders and containers
- one dominant action at a time
- plain-language progress labels
- mobile-first form controls
- branded photography and generous whitespace
- provider-unavailable notices written in customer language and kept secondary

## Legal records are not participant consent

Customer commercial agreements and participant permissions remain separate records.

`LegalDocumentVersion` represents a versioned governing document. `AgreementAcceptance` represents evidence that a particular signer accepted a particular version in a stated capacity.

`ConsentRecord` remains the authority for participant permissions. The booking layer does not reuse commercial agreement acceptance as consent.

Final legal language is a governed content input. The booking UI must not manufacture Terms of Service, Privacy, cancellation, electronic-record, release, or licensing language.

## Participant permission form

Participants do not need an account merely to take part.

The electronic form and printable form must express the same granular permission scopes. A completed paper form can later be uploaded and associated with the same participant consent record through `ParticipantPermissionForm.source = "paper"` and `uploadedMediaAssetId`.

The form separates, among other scopes:

- participation
- interview recording
- internal creative use
- designated family sharing
- private performance
- event photo/video
- public marketing
- testimonial use

No public-use permission is implied by participation.

## Provider boundaries

The repository currently does not contain live identity, scheduling, agreement-signing, payment, participant-persistence, consent-persistence, or notification providers for this workflow. `bookingServiceCapabilities` therefore fails closed.

The current UI is allowed to demonstrate navigation and form composition, but it must not claim that a date is reserved, an agreement is accepted, a payment succeeds, a participant form is saved, or a reminder is sent when the authoritative provider is absent.

Production integrations should plug into the existing chassis boundaries rather than directly into React components.

## Merge sequence

This work is intentionally isolated from the two presentation changes already in flight.

1. merge the internal-language cleanup
2. update and merge the Admin reorganization PR
3. rebase this branch onto that resulting `main`
4. resolve any wording overlap in favor of the cleaned customer-facing language
5. rerun lint, TypeScript, Vitest, build, and preview validation
6. merge the post-engagement booking slice

The booking branch should not be merged ahead of those two layers.
