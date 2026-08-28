# Customer / Family Workflow Hierarchy

> **Status:** legacy deeper-workflow reference. The primary customer is now the organization. Participant and family access begins at `/claim`, `/memories`, or Secure Delivery, not this ten-module workspace. See `CUSTOMER_MODEL.md` for the governing model.

## Scope

This slice documents the earlier ten-destination Customer / Family chassis without adding another application. It may inform future deeper participant workflows, but it is not an acquisition surface or the default post-event claim destination.

## Governing route model

Customer workflows may carry an explicit selected-order context in the URL:

```text
/customer/order/[orderId]/story/uploads/photos
/customer/order/[orderId]/reviews/current-draft
/customer/order/[orderId]/orders/deposit-balance
```

The selected order is therefore recoverable on refresh and browser Back/Forward. Child routes do not independently guess the intended order.

Top-level Customer navigation remains the ten chassis destinations. `Dashboard` child routes use `/dashboard/[child]`; all other children use the registered parent slug. `Story & Memories → Uploads` is a genuine route-backed grandchild hierarchy.

## Shared domain/service boundaries

The Customer hierarchy reuses the shared platform vocabulary and boundaries for requests, orders, people, stories, creative work, lyric versions, approvals, media, consent, workflow state, scheduling, payments, communications, invitations, catalog, fulfillment, secure delivery, and audit history.

No `CustomerSong`, `CustomerStory`, `CustomerLyrics`, `CustomerPayment`, `CustomerPhoto`, `FamilySongCopy`, or `CustomerConsent` entity is introduced.

The canonical `Approval` contract is extended with optional `lyricVersionId`. The field is required by the lyric-approval workflow so an approval identifies the exact `LyricVersion`; it remains optional on the shared type because final-recording approvals do not target lyric versions.

## Workflow integrity

- Dashboard progress is derived from the canonical `songJourney` state list.
- Customer next actions are derived only for workflow states that legitimately require a customer action.
- Customer review filters lyric versions against the authoritative set shared for customer review.
- Lyric approval must target an exact version.
- Payment/refund actions remain behind the shared payments boundary and cannot be asserted from client state.
- Family access is order-scoped; payment, consent, approval, media, and internal Creator information require separate authorization.
- Media access requires both order scope and explicit media authorization.
- Authorization and consent are evaluated independently.

## Production visibility

`My Song Journey → Production` is the bounded Customer integration point for customer-appropriate production/recording/final-approval status. It does not expose Creator composition, arrangement, raw recordings, stems, mixing/mastering controls, assignments, or internal quality-review notes.

The standalone Customer `Production` destination from the full Platform Shell remains a documented source/chassis discrepancy, together with `Profile & Settings` and `Help & Support`.

## Progressive availability

The hierarchy is structurally implemented while authoritative providers remain disconnected in reference mode. Service flags therefore fail closed for request persistence, orders, story persistence, scheduling, payments, messaging, invitations, uploads, approvals, consent mutation, fulfillment, Secure Delivery, and audit persistence.

The UI must never represent a disabled reference action as completed or authoritative.

P1 integration points are explicitly retained for richer family collaboration, configurable digital song cards, and simple physical-keepsake tracking without advertising them as production-live.

## Secure Delivery

Final Song, Lyric Sheet, and Shareable Link route to the shared Secure Delivery boundary. The Customer workspace never exposes raw storage keys or permanent public object-storage URLs. Controlled family sharing additionally requires applicable authorization/entitlement and consent.

## Consent

The six Customer consent destinations remain distinct. Purchase, payment, family relationship, scheduling, recording, private performance, event media, public marketing, and private delivery are not treated as interchangeable permissions.

Consent mutation must preserve the shared consent lifecycle and audit evidence. Client-only state cannot grant, restrict, or withdraw consent.

## Responsive navigation

The shared workspace continues to own desktop and mobile navigation. Mobile exposes the first three destinations plus a `More` control containing every remaining top-level Customer destination; nested child/grandchild navigation is route-backed and horizontally scrollable where needed.

## Deferred source-defined Customer destinations

These full-source items are intentionally not added as eleventh/twelfth/thirteenth top-level destinations in this bounded slice:

- Production
  - Production Status
  - Recording Status
  - Final Approval
- Profile & Settings
- Help & Support

A later architecture decision should determine whether the chassis expands or those responsibilities remain absorbed by existing integration points.
