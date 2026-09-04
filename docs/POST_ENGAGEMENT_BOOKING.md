# Organization Experience Booking

## Purpose

`/begin` hands an organization from public acquisition into an organization-owned experience without presenting a direct-to-consumer song purchase.

The customer-facing sequence is intentionally concise:

```text
Choose Experience
→ Facility & Preferred Date
→ Agreement & Payment Choice
→ Saved Plan / Next Steps
```

Account selection and setup happen inside the Facility & Preferred Date step. Package-aware preparation happens inside the resulting Organization Experience instead of extending checkout. Participants and their permissions are prepared inside the experience when the selected template needs them. They are not purchasers and do not need accounts merely to participate.

## Catalog authority

`domain/experience.ts` defines the two products:

- Single-Song Group Event — **$200**
- Honor a Life Song Experience — **$2,500**

Both have `buyer: "organization"`. The first uses a light group-event template; the second uses the full participant/interview/song/concert template. Legacy SKU identifiers normalize to these entries only for data migration.

The public Services page compares best fit, story capture, creative output, presentation, and post-event deliverables so a facility can make a confident decision before entering checkout.

## Account and request continuity

The organization account is created once and reused. A signed-in organization administrator can save the selected experience, preferred date, venue, and requested payment method as an authoritative `OrganizationExperience` inquiry.

The saved record remains an inquiry with:

```text
status: inquiry
billingStatus: not_started
dateStatus: requested
```

A preferred date is not a held or confirmed date. Honor a Life Song must confirm scheduling, issue the final agreement, and reconcile payment before the experience advances.

## Payment paths

The booking experience supports two customer paths:

1. An optional Stripe-hosted Payment Link configured for the selected offering.
2. An invoice request that includes the saved experience request identifier.

Stripe checkout URLs are configured with:

```text
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_SONG_GROUP_EVENT
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_HONOR_A_LIFE_SONG_EXPERIENCE
```

These are public hosted-checkout URLs, not secret keys. The saved request ID is sent as the Stripe `client_reference_id`. A browser return never marks the experience paid; billing status must be reconciled from Stripe or the issued invoice.

## Legal and permission records

The booking screen provides a review summary but does not claim to replace or sign the final service agreement. Organization agreement acceptance remains commercial authority only. Participant permission remains a versioned experience-level consent record with separate scopes such as participation, interview recording, creative use, designated-family sharing, private performance, event media, public marketing, and testimonial use.

Electronic, assisted, and printable capture must use that same consent model. No public, family, or organization visibility is inferred from payment or an organization signature.

## Truthful service boundaries

Firebase identity and organization experience-request persistence are connected. Live date availability, final agreement issuance, payment reconciliation, notification delivery, and automatic post-payment status transitions remain provider-dependent.

The booking UI must not claim that a date is held, an agreement is accepted, a payment succeeds, an invitation was emailed, or an experience is booked when its authoritative provider has not confirmed that state.

See `docs/architecture/CUSTOMER_MODEL.md` for the full ownership and post-event access contract and `docs/FACILITY_FIRST_EXPERIENCE_UX.md` for the facility-first presentation and creator release workflow.
