# Consent Model

Consent is a versioned domain object, not a universal checkbox.

The chassis reserves explicit scopes for:

1. participation;
2. interview recording;
3. internal creative use;
4. designated family sharing;
5. private performance;
6. event photography/video;
7. public marketing;
8. sponsor acknowledgment;
9. testimonial use;
10. extended retention.

States are: not requested, pending, active, active with restrictions, withdrawn, expired, and superseded.

Every sensitive downstream action must satisfy both role/record authorization and the necessary active consent scope:

```text
AUTHORIZATION
      +
CONSENT
      ↓
ACTION ALLOWED
```

The chassis fails closed when the consent record is absent, does not contain the requested scope, is pending, carries unresolved restrictions, has been withdrawn, has expired, or has been superseded. Restricted consent requires authoritative restriction evaluation before an action can proceed; a client component must not guess that a restriction is compatible.

Withdrawal, expiration, supersession, restriction evaluation, and material consent changes must be enforced server-side and produce the appropriate audit evidence once persistence is connected.
