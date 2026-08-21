# Service Boundaries

The chassis does not bind UI components directly to third-party vendors. Later implementation should provide adapters/repositories for:

- identity and sessions;
- relational persistence;
- secure object storage;
- payments and invoices;
- email and SMS;
- scheduling/calendar services;
- analytics;
- monitoring and incident reporting;
- secure delivery links.

Payment state, authorization, consent enforcement and delivery entitlement must remain server-authoritative.

## Secure Delivery contract status

The Secure Delivery workflow now has an explicit `SecureDeliveryService` interface for:

- delivery-token resolution;
- short-lived asset authorization;
- delivery confirmation; and
- material access evidence through the shared `AuditEvent` boundary.

No production adapter is connected yet. The repository therefore keeps token resolution, entitlement validation, recipient verification, media authorization, audit persistence, confirmation persistence, resend, and QR-keepsake P1 capability explicitly unavailable outside synthetic reference scenarios.

A production adapter must never expose object-storage keys or permanent public media URLs. It must re-evaluate token state, entitlement, consent, and the requested approved asset at access time before issuing short-lived access.
