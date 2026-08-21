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

States are: not requested, pending, active, active with restrictions, withdrawn and superseded.

Every sensitive downstream action must satisfy both role/record authorization and the necessary active consent scope. Withdrawal handling must be enforced server-side once persistence is connected.
