# Secure Delivery Architecture

`/song/[deliveryToken]` remains the Secure Delivery integration point. This slice deepens that route without turning delivery into a public media page or an authenticated workspace module.

## Source-defined hierarchy

```text
Secure Delivery / Keepsake
└── Song / [deliveryToken]
    ├── Access Resolution
    │   ├── Token Validation
    │   ├── Access Verification (when required)
    │   ├── Entitlement Validation
    │   ├── Consent Validation
    │   └── Asset Authorization
    ├── Private Song Page
    │   ├── Listen
    │   ├── Download
    │   ├── Lyrics
    │   ├── Photos / Approved Story
    │   └── Share Controls
    ├── QR Keepsake Entry
    ├── Access Verification
    ├── Expired / Revoked
    └── Delivery Confirmation
```

Access Resolution gates are domain/security gates, not recipient navigation destinations.

## Resolution contract

The route resolves one server-owned delivery context and then evaluates:

```text
secure link / QR
  → token state
  → recipient verification when required
  → entitlement
  → delivery-level consent
  → approved/included asset authorization
  → private presentation
```

Verification does not grant delivery by itself. After verification, token state, entitlement, consent, and asset authorization must still be evaluated from authoritative data.

The browser is not trusted to decide token validity, revocation, entitlement, consent, approved version, or download authorization.

## Canonical reuse

The delivery contract references canonical creative/media/consent identifiers rather than creating copies of songs, lyrics, photos, or stories. `DeliveryAssetGrant.sourceEntityId` points at the canonical source entity selected for the package. The delivery layer never introduces a `DeliveredSongCopy`, `PublicSongAsset`, or Project Ageless-specific delivery song.

Approved-version integrity is explicit. A recipient-facing lyric grant carries the approved version identifier; delivery does not select the newest draft by timestamp. A production file existing is not sufficient to make it deliverable.

## Consent and entitlement

Entitlement and consent are evaluated separately. The reference scenario uses `designated_family_sharing` as its delivery consent scope because it models a private authorized-recipient handoff. Other real delivery relationships may require different configured scopes when the legal/business model is finalized.

Asset actions may carry their own consent scopes. Controlled family sharing is evaluated independently and never implies `public_marketing` permission.

Withdrawn/superseded/non-active consent fails closed for covered future use.

## Media and download boundary

The route does not expose `MediaAsset.storageKey`, bucket paths, or permanent object-storage URLs. The `SecureDeliveryService.authorizeAsset` contract returns a `ShortLivedAssetAccess` only after the authoritative adapter rechecks the delivery and requested asset/action.

The current repository has no production object-storage or secure-token adapter. Therefore reference playback/download controls are intentionally disabled. This is structural workflow, not simulated production delivery.

When a production adapter is connected it must:

1. resolve the token server-side without logging the raw credential;
2. recheck entitlement and consent at access time;
3. bind the requested asset to the resolved delivery/creative work;
4. verify approved final status;
5. issue short-lived media access;
6. write material access/download evidence through the shared `AuditEvent` boundary; and
7. avoid returning storage keys to the browser.

## Delivery confirmation

Delivery confirmation is modeled independently from route rendering. Loading the page does not mutate the individual-song workflow to `Delivered` or `Closed`. Confirmation persistence is disabled until an authoritative delivery repository/audit adapter exists.

## QR status

QR is modeled only as an entry mechanism into the same `/song/[deliveryToken]` chain. The Product Scope classifies richer QR-enabled private keepsake pages as P1. `qrKeepsakeCapability` therefore remains `planned_p1` and the production service flag remains false.

A QR code must point to the secure application route, never directly to object storage.

## Reference mode

Static PR previews contain clearly synthetic reference tokens and identifiers only. They do not contain participant names, photographs, recordings, testimonials, or real delivery histories.

Reference tokens include states for available, verification-required, expired, revoked, consent-blocked, asset-unavailable, access-denied, and QR-entry visual review. Unknown production-looking tokens fail closed as `service_unavailable` while the production adapter is absent.

## Security review

Implemented controls:

- route does not display raw token values;
- malformed credentials fail before delivery resolution;
- unknown production tokens do not receive a simulated success;
- expiration and revocation resolve before protected assets;
- entitlement and consent are separate gates;
- withdrawn consent blocks covered access;
- asset requests are bound to both the resolved delivery and creative work;
- non-included/unapproved assets are excluded;
- approved lyric version is explicit;
- share controls do not create public access;
- protected media URLs/storage keys are absent;
- delivery pages request `noindex`, `nofollow`, and `nocache` metadata;
- page rendering does not confirm delivery or close workflow state; and
- QR cannot bypass the normal validation sequence.

Dependencies that block a production-security claim:

- production token repository/issuer/revocation store;
- authoritative entitlement repository;
- recipient verification/identity adapter where required;
- production consent persistence and restriction semantics;
- approved-final delivery package persistence;
- secure object storage and short-lived media authorization;
- `AuditEvent` persistence for material access/downloads;
- delivery-confirmation persistence;
- authorized resend/reissue flow;
- rate limiting/enumeration controls at the deployed edge/runtime;
- protected-response cache policy (`private`/`no-store`) once real recipient data is rendered;
- incident/monitoring integration; and
- final legal/IP rules for copying, sharing, public performance, archival rights, and public tribute use.

Static GitHub Pages previews are a visual-review projection only. They must never be used for real secure delivery. Production real-token responses must run in a server-capable environment and apply an explicit private/no-store cache policy when the real adapter is introduced.
