# Native invoices and payment reconciliation

## What SongKeep owns

SongKeep owns the authoritative invoice record, annual sequential invoice
number, immutable issued commercial snapshot, server-rendered branded PDF,
private file storage, authenticated document retrieval, invoice/payment
history, state-driven reminders, and organization/experience linkage. Stripe
Invoicing or another invoice vendor is not required for these functions.

`/organization/invoices` provides billing details, invoice history, issued
invoice details, authorized PDF download/print, payment instructions, an
optional secure checkout action, and a controlled send-copy action.
`/admin/invoices` provides seller/tax configuration, issuance, reconciliation,
void/uncollectible controls, refund recording, and communication history.
`/admin/requests` links into this same finance record rather than accepting an
independent invoice URL or browser-written paid state.

## Authoritative flow

1. An authorized organization buyer saves the selected catalog offering and
   planning details. One transaction creates the request, order, and draft
   invoice; a stable idempotency key protects retries.
2. Issuance requires complete seller/remittance information, reviewed tax
   treatment, and organization billing details. Issuance assigns a unique
   `SK-YYYY-NNNNNN` number and freezes buyer/seller, scope, price, discount,
   tax, issue/due dates, payment terms, and account link. Concurrent retries
   cannot assign multiple numbers to one invoice.
3. The backend PDFKit renderer reads the frozen snapshot, not browser HTML.
   It stores an immutable private document with SHA-256, version, and generation
   date. Retrying a failed render does not change the issued commercial record.
4. Sending queues a message. The optional worker marks it sent only after a
   provider acceptance receipt; viewed state never means paid.
5. Partial payments update the balance without creating an experience. Full
   settlement creates the deterministic organization experience, updates the
   order/request, stops invoice reminders, and queues receipt/onboarding
   communications in one transaction.

The issued PDF remains the issued commercial document. Subsequent receipts,
payments, refunds, and the current balance live in the account/audit history;
they do not silently rewrite an earlier PDF.

## Payment controls

Manual check, approved external transfer, and cash reconciliation require an
active platform administrator, an explicit confirmation, positive integer
cents, and a unique real payment reference. Payment evidence is deduplicated
across invoices. The platform cannot independently prove that a manually
recorded check/transfer/cash payment actually occurred; staff must reconcile it
against the corresponding financial evidence.

Optional card checkout is created server-side from the current invoice balance.
The platform reserves one checkout, resumes it when appropriate, validates the
provider's current session and amount/currency, and handles signed webhooks.
Neither opening checkout nor returning from it marks anything paid. An active
checkout blocks a competing manual payment, void, or package replacement until
the provider confirms payment or expiration. The invoice screen includes a
cancel-online-checkout operation that expires the provider session first.

Individual post-experience purchases use a separate server-priced Checkout
flow, retaining organization/experience attribution. Current consent,
entitlements, recipient identity, product audience, and required asset kinds
are checked again at checkout and fulfillment. A payment that actually completes
after permissions change is recorded as paid with a fulfillment hold and staff
exception, not discarded and not used to bypass permissions. Individual
invoice-requested products remain staff-assisted; native organization invoice
PDFs are not presented as an individual invoicing system.

Refund recording requires authorized confirmation and a real refund reference.
It records a refund that has already occurred; it does not itself send money
through Stripe or a bank. Automatic refund initiation, credits/write-offs,
accounting synchronization, general-ledger posting, and tax calculation services
are outside this release.

## Immutability and migration

An unpaid invoice can be voided and replaced, preserving both request histories.
Paid/part-paid upgrades require staff reconciliation rather than automatic
repricing. Issued commercial details are never edited in place. Full and partial
refunds preserve gross receipts and the original issued document.

Legacy requests with external invoice URLs are not silently rebilled. An
administrator must confirm the external receivable has been cancelled/reconciled
and provide a reason before native replacement. Existing paid experiences must
not be backfilled as new unpaid invoices. Older creator files require verified
private paths, metadata, and review before release; the admin delivery screen
provides a **Check upload** action for safe retries.

## Reminders and delivery

Hourly evaluation creates idempotent reminders for issued/not-viewed,
viewed-unpaid, approaching due date, due today, and overdue balances. Overdue
items create staff follow-up tasks. Paid, void, uncollectible, refunded, or
explicitly paused records are suppressed. The delivery worker rereads current
invoice state before sending, leases work, retries failures, and uses provider
idempotency. An email already accepted by a provider cannot be recalled.

The initial email adapter uses Resend. Queued, sent, failed, and suppressed are
separate states. No email is represented as delivered merely because it was
queued. SMS and broader acquisition/loyalty campaign delivery are not activated
by this invoice worker.

## Production activation

Merging application code does not deploy Cloud Functions, rules, indexes, or
configure service credentials. Use the existing Firebase project
`songify-cc2c5`, with its actual private Storage bucket and approved runtime
service account; do not create a second customer database.

1. Install the locked dependencies with `npm ci` and `npm --prefix functions ci`.
   Deploy `firestore:rules,firestore:indexes,storage,functions:songkeep` using
   the approved Firebase deployment identity. Confirm the function runtime has
   the necessary Firestore/private Storage access, Eventarc delivery permissions,
   and service-account signing authority for short-lived media URLs. Do not
   grant public bucket access.
2. At `/admin/invoices`, enter the **actual** legal seller name, business address,
   email/phone, approved remittance instructions, due terms, cancellation/service
   terms, and an HTTPS organization account URL. Have the accountant review
   transaction-specific tax treatment before enabling issuance. The configured
   basis-point tax rate and review acknowledgment are not a jurisdictional tax
   engine. Never use the fictional test fixture as seller configuration.
3. Complete organization billing details, issue a test invoice, download/print
   its authenticated PDF, and verify account isolation and storage protection.
   Auto-issuance is opt-in. Drafts remain pending when required information is
   missing; an administrator can issue after correction.
4. For optional online card collection, configure the secret values
   `SONGKEEP_STRIPE_SECRET_KEY` and `SONGKEEP_STRIPE_WEBHOOK_SECRET`, deploy the
   checkout/webhook functions, and register the returned webhook endpoint for
   Checkout completion, asynchronous payment success/failure, and expiration.
   Test in Stripe test mode first. Enable
   `NEXT_PUBLIC_NATIVE_CHECKOUT_ENABLED=true` only after that acceptance check
   and rebuild the frontend. No raw card details enter SongKeep.
5. For email, configure `SONGKEEP_EMAIL_API_KEY`, verify the sender domain and
   configured seller email in Resend, and set `SONGKEEP_EMAIL_ENABLED=true` in
   the functions environment only after testing delivery. Deploy only the
   optional payment/mail functions when their secrets are configured; the
   manual-payment invoice path does not require Stripe or an email vendor.
6. Verify actual partial/full payment, duplicate webhook, refund-recording,
   overdue/suppression, customer download, participant permission withdrawal,
   and creator release behavior in the configured environment before live use.

The GitHub Pages preview is a static visual projection. It is not evidence of
Firebase backend deployment, live payments, outgoing emails, or fulfillment.
The repository's normal frontend deployment process remains separate.

## Tests and evidence

Run root lint, TypeScript, Vitest, and a production Next build. Native unit tests
run with `npm --prefix functions test`. Integration tests require a dedicated
Firestore emulator:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8096 npm --prefix functions run test:integration
```

Never point these tests at production. They use `demo-songkeep-invoices` and
synthetic organization/user records. The Native services workflow pins and
checksum-verifies the official emulator, executes concurrency and tenant/rules
checks, and retains a fictional sample PDF. Stripe, mail, and Storage transport
responses are controlled test doubles; live-provider and Storage-rules emulator
acceptance remain deployment checks, not claims made by these tests.
