# Account-first customer experience

The customer chooses an experience, creates an account or signs in, then enters event details, reviews the request, and requests an invoice or continues to payment. A persisted organization and active administrator membership are required before event input is exposed. Creating an account does not create an event, order, invoice, or paid state.

Registration is one shared component for `/begin` and `/create-account`. First and last names are separate. Organization and contact details are stored once; later billing fields are prefilled and can be changed for billing-specific needs. Returning users select an existing organization explicitly. Creating another group is a separate choice, not a side effect of booking again. Each team member has their own verified sign-in and an assigned organization role.

Unfinished plans are private documents under `users/{uid}/bookingDrafts/{organizationId}`. They contain no passwords. They can be resumed from the account home. The request idempotency key is persisted before submitting the request. The backend remains the sole source of invoice, payment, and experience state; static previews no longer simulate completion.

The account presents saved plans, invoice requests, upcoming/in-progress experiences, past experiences, songs/materials, and team invitations. Invitation links are generated and copied by the administrator; creating one is not represented as an email being sent.

The shared catalog and server invoice scope specify up to **6 songs** for $2,500 and up to **10 songs** for $6,000. The $200 offer remains one shared song.

## Presentation and motion

The package page has no internal relationship explainer. Success messages describe the customer's actual result. Provider diagnostics are translated at the UI boundary. Developer reference pages and implementation documentation are not customer navigation and retain their technical purpose.

Hero and listening photography includes corporate teams, dancing groups, and group collaboration alongside the existing imagery. Fades are 1.6 seconds with 8.5 seconds between changes; text never rotates. Photos stop on hover, keyboard focus, tab hiding, offscreen placement, explicit Pause, and reduced-motion preference. Failed images are never used to replace a loaded one. Images are stock scenes, not customer testimonials.

New photographs are linked from Pexels:
- Monstera Production, Workmates Doing a High Five: https://www.pexels.com/photo/workmates-doing-a-high-five-9479826/
- MART PRODUCTION, A Group of People Having Fun: https://www.pexels.com/photo/a-group-of-people-having-fun-8885506/
- Ivan S, Group of People Putting Their Hands Together: https://www.pexels.com/photo/group-of-people-putting-their-hands-together-9630217/

Design reference: Apple's Human Interface Guidelines for onboarding, accessibility, and motion. No audio autoplays.

## Runtime and verification

Set the existing `NEXT_PUBLIC_FIREBASE_*` Web SDK configuration in the deployment environment. Firebase Hosting's public init configuration may also be used for the known SongKeep app only. This does not replace enabling Email/Password authentication and authorizing the actual hosting domain in Firebase. Deploy the updated Firestore rules and existing native Functions before live account/invoice acceptance testing.

The optional local emulator switch requires both `NEXT_PUBLIC_FIREBASE_EMULATORS=true` and a `demo-` project on a localhost browser. It cannot select a production project. It does not weaken Firestore rules.

`e2e/account-first.cjs` runs actual browser registration/sign-in, persisted drafts, multiple requests under one organization, native invoice requests, verified team invitations, role restrictions, historical events, responsive layout, and reduced-motion/photo controls against the official Auth/Firestore/Functions emulators. It uses synthetic records, never real customer accounts or payments. The CI workflow records screenshots. Existing invoice transaction/security tests remain separate.

Preview configuration must be truthful: a missing live Firebase connection shows an unavailable message, not a sample account or fabricated completed request. Live provider deployment is not certified by the emulator tests.
