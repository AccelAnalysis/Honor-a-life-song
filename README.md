# Honor a Life Song Platform

Human-led story-to-song service and program-delivery platform.

## Current state

This repository contains the **operating chassis**: the governed application frame that later business modules plug into. It intentionally does not simulate production identity, payment, messaging, scheduling or participant data.

The repository is now associated with the existing Firebase project `songify-cc2c5`, and a Firebase Web SDK integration boundary is available for Authentication, Cloud Firestore and Cloud Storage. Environment-specific Firebase Web SDK values remain outside source control and must be supplied locally or by the deployment environment before those services are used.

### Chassis surfaces

- Public / Acquisition Shell
- Identity / Access Shell
- Authenticated Workspace Shell
  - Customer / Family
  - Facility / Project Ageless
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

See [`docs/architecture/OPERATING_CHASSIS.md`](docs/architecture/OPERATING_CHASSIS.md) for the governing architecture and [`docs/integrations/FIREBASE.md`](docs/integrations/FIREBASE.md) for Firebase setup and security boundaries.
