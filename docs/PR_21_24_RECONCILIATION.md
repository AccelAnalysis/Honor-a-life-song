# PR #21 / #24 reconciliation

## Decision

PR #24 was not a complete supersession of PR #21. The reviewed heads were
`26c0296a95b53d274d838de6c0cefa7c5204b503` (#21) and
`c898d85704c944e34a84cebe3e57a4f457a4e3ef` (#24). Their common ancestor was
`3953bab4ed8b47fe4f736ee75215e93b3011d35b`; neither branch contained the other.
The release uses #24 as its customer-lifecycle base and deliberately reconciles
#21's distinct functionality rather than merging two competing commerce models.

| Area | Reconciled result |
| --- | --- |
| Organization acquisition, three offers, booking | Keep #24's organization-owned $200 / $2,500 / $6,000 offerings and persistent relationship. All financial mutations now go through the trusted backend. |
| Organization contacts | Retain #21's title, direct phone, preferred contact method, and asset/assignment types. Never infer permission to overwrite an unrelated organization from membership alone. |
| Creator delivery | Preserve #21's assignments and resumable private uploads; add working creator/admin screens, backend file verification, review, and deliberate consent-aware release. Remove permanent download URLs. |
| Public imagery and access errors | Preserve #21's broader-audience imagery styling and clear authentication configuration/error handling. |
| Growth and private storefront | Use #24's feedback, renewal, referral, and configurable derived-product records. The older growth/store URLs point users to these canonical surfaces instead of maintaining duplicate transactions. |
| Review findings | Server transactions serialize payment conversion, replacement, and consent approval. Purchases and fulfillment recheck current permissions and required asset kinds. Feedback is scoped to the current member, and renewal source attribution is retained. |
| Invoices | Replace an external invoice URL/request-only boundary with native authoritative records, numbering, issued snapshots, backend PDFs, private downloads, financial evidence, reminders, and customer/admin surfaces. |

## Native service boundaries

The shared platform remains one application. Firebase callable functions own
financial and permission transitions. Firestore rules deny client financial
writes, including direct writes from an administrator's browser. Storage rules
allow assigned creators to upload private files but not expose or release them.
Backend verification records the actual stored file's generation, size, and
checksum and removes permanent Firebase download tokens before release.

Organization payment confirmation creates exactly one package-aware experience.
A preferred date is still a request, not an invented capacity reservation.
Participant/family purchases retain the source organization, experience,
participant, access, and product. They never expand media or marketing rights.

## Validation

The native suite uses real Firestore emulator transactions and security rules.
Stripe, mail delivery, and object-storage transports are test doubles: passing
these tests is not evidence of live provider configuration or deployment.
The generated invoice PDF uses the actual server renderer and fictional,
explicitly marked test billing information. The runtime setup and activation
checklist are in `NATIVE_INVOICING.md`.

Temporary review-repair and source-transport workflows are not part of the
release. Regular Chassis CI, static preview CI, and Native services CI verify
the final branch. PR #21 can be closed as reconciled only after this release's
unique retained work is committed and validated on #24.
