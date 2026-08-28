# Honor a Life Song Platform

Human-led story-to-song service and program-delivery platform.

## Current state

This repository contains the governed operating chassis plus the organization customer model. Organizations own accounts and purchases; each purchase produces an organization experience; participants belong to that experience; and participant/family delivery is consent- and entitlement-gated.

The repository is now associated with the existing Firebase project `songify-cc2c5`, and a Firebase Web SDK integration boundary is available for Authentication, Cloud Firestore and Cloud Storage. Environment-specific Firebase Web SDK values remain outside source control and must be supplied locally or by the deployment environment before those services are used.

### Chassis surfaces

- Public / Acquisition Shell
- Identity / Access Shell
- Authenticated Workspace Shell
  - Organization account and experience workflows
  - Lightweight participant / family memories access
  - Legacy Customer and Facility workflow references
  - Creator / Production
  - Admin / Operations
- Secure Delivery Shell

### Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Verification:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See [`docs/architecture/CUSTOMER_MODEL.md`](docs/architecture/CUSTOMER_MODEL.md) for the governing customer contract, [`docs/architecture/OPERATING_CHASSIS.md`](docs/architecture/OPERATING_CHASSIS.md) for the shared frame, and [`docs/firebase-organization-account-setup.md`](docs/firebase-organization-account-setup.md) for Firebase setup and security boundaries.
