# Organization Experience Booking

## Purpose

`/begin` hands an organization from public acquisition into an organization-owned experience without presenting a direct-to-consumer song purchase.

The governed sequence is:

```text
Choose Experience
→ Organization / Organization Contact
→ Date / Availability
→ Scope + Organization Agreements
→ Organization Payment
→ Package-Aware Setup
→ Organization Experience
```

Participants and their permissions are prepared inside the resulting experience when the selected template needs them. They are not purchasers and do not need accounts merely to participate.

## Catalog authority

`domain/experience.ts` defines the two products:

- Single-Song Group Event — **$200**
- Honor a Life Song Experience — **$2,500**

Both have `buyer: "organization"`. The first uses a light group-event template; the second uses the full participant/interview/song/concert template. Legacy SKU identifiers normalize to these entries only for data migration.

## Account continuity

The organization account is created once and reused. Every purchase is associated with that organization, and its `OrganizationExperience` remains in the same upcoming/past history. Account provisioning is resumable when Firebase Auth succeeds but a later profile or organization write temporarily fails.

## Legal and permission records

Organization agreement acceptance is commercial authority only. Participant permission remains a versioned experience-level consent record with separate scopes such as participation, interview recording, creative use, designated-family sharing, private performance, event media, public marketing, and testimonial use.

Electronic, assisted, and printable capture must use that same consent model. No public, family, or organization visibility is inferred from payment or an organization signature.

## Truthful service boundaries

Firebase identity is connected. Live scheduling, agreement persistence in the booking route, payment, notification delivery, and purchase-to-experience persistence are not yet connected. Those steps stay disabled and state exactly what is not saved or completed.

The booking UI must not claim that a date is held, an agreement is accepted, a payment succeeds, an invitation was emailed, or an experience was created when its authoritative provider is absent.

See `docs/architecture/CUSTOMER_MODEL.md` for the full ownership and post-event access contract.
