# Prepared Booking sales handoff

## Purpose

Prepared Booking is the sales-assisted entrance into SongKeep's existing organization commerce flow.

```text
Sales conversation
→ staff prepares the agreed experience
→ secure /complete?booking=… link
→ customer connects or creates the organization account
→ customer confirms the prepared version
→ organization agreement
→ card payment or organization invoice
→ existing Order / Invoice / OrganizationExperience infrastructure
```

It does not replace the self-service `/begin` flow and it does not introduce a second order, invoice, payment, or experience model.

## Authority

`preparedBookings/{id}` is backend-owned. The customer receives an opaque bearer token; Firestore stores only its SHA-256 hash. Links expire and can be rotated or revoked.

Each commercial revision is copied into an immutable `versions/vN` record. A signed organization agreement records the prepared-booking id, version, and commercial snapshot hash so later changes cannot silently alter what the customer accepted.

Customer-side code never supplies the authoritative catalog price. The backend resolves the offering from `functions/catalog.json`.

## Customer presentation

The public completion surface is deliberately low-chrome and task focused:

1. prepared experience;
2. organization account;
3. confirmation;
4. agreement;
5. billing;
6. completion.

The customer is not asked to shop for the package again. The surface uses one primary action per scene, large controls, visible focus, generous whitespace, reduced-motion behavior, and plain customer language.

## Change requests

A customer may request a date, scope, or billing change before signing. A pending change blocks signature. Staff creates a new prepared-booking version; the same secure link then resolves to the revised version. Previous versions remain in the audit history.

## Payment and invoicing

Prepared Booking reuses native SongKeep billing.

Card:
```text
agreement → request/order/invoice → Stripe checkout → signed payment confirmation → OrganizationExperience
```

Invoice, payment required:
```text
agreement → request/order/invoice → payment → OrganizationExperience
```

Approved receivable:
```text
agreement → issued invoice → OrganizationExperience with billingStatus=invoice_open
→ later payment updates the same experience to paid
```

Only a staff-prepared offer may select approved-receivable activation. The customer cannot promote an ordinary invoice into that state.

## Routes

- Staff: `/admin/prepared-bookings`
- Customer: `/complete?booking=<opaque-token>`

The query-string entry is intentional so the existing GitHub Pages static preview can export the route while production still resolves the token through the callable backend.

## Current delivery boundary

The staff workspace creates, revises, rotates, revokes, and copies the secure booking link. The link can be sent through the existing sales communication process. Automated prepared-booking email delivery is not represented as sent until a provider-backed communication workflow is connected.
