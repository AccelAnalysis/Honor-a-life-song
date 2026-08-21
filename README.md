# Honor a Life Song Platform

Human-led story-to-song service and program-delivery platform.

## Current state

This repository contains the **operating chassis**: the governed application frame that later business modules plug into. It intentionally does not simulate production identity, payment, messaging, storage, scheduling or participant data.

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
npm run dev
```

Verification:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See [`docs/architecture/OPERATING_CHASSIS.md`](docs/architecture/OPERATING_CHASSIS.md) for the governing architecture.
