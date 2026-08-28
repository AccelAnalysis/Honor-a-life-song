# Firebase organization account setup

The organization account uses Firebase project `songify-cc2c5`. No private Firebase credentials belong in this repository.

## Local configuration

```bash
npm install
cp .env.example .env.local
```

Supply the Firebase Web SDK values documented in `.env.example`. Public Web SDK configuration identifies the application; Firestore and Storage rules remain the authorization boundary. Never place service-account JSON, private keys, payment secrets, or other server credentials in `NEXT_PUBLIC_*` variables.

Enable Email/Password Authentication, Firestore, and Storage in Firebase Console. Configure the Authentication verification and password-reset templates before production use.

## Deploy rules and indexes

```bash
npx firebase-tools login
npx firebase-tools use songify-cc2c5
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Bootstrap the first trusted staff account by creating `admins/{firebaseAuthUid}` with `{ "active": true, "role": "admin" }` in a trusted administrative environment. The client cannot grant itself platform-admin access.

## Data shape

```text
users/{uid}
  organizations/{organizationId}             # discovery pointer
  experienceAccess/{invitationId}             # claimed-access receipt

organizations/{organizationId}
  members/{uid}
  invitations/{invitationId}                  # organization team only
  agreements/{agreementId}
  suggestedDates/{suggestionId}
  assets/{assetId}
  experiences/{experienceId}
    participants/{participantId}
      consents/{consentId}
    entitlements/{entitlementId}
    accessInvitations/{invitationId}           # participant/family delivery

admins/{uid}
```

The user-to-organization pointer is discovery data, not authorization. Rules require its corresponding active membership. Organization invitations and participant/family access invitations are separate record types.

## Enforced boundaries

- Organization records require active membership or platform-admin access.
- Team and experience-access invitation acceptance requires the exact invited, verified Firebase Auth email.
- Acceptance writes and invitation state changes are tied together in the same atomic batch.
- Organization agreements remain separate from participant consent.
- Participants are children of an experience and may exist without a user account.
- Participant consent is versioned and platform-admin recorded in this slice.
- Participant/family entitlements require an active consent version with the required scope and carry the recipient addresses authorized by that version.
- Any material permission revision revokes earlier entitlements and pending invitations so assets must be deliberately re-released.
- Organization members can read only asset records marked `organizationVisible`.
- A `storagePath` without a resolved delivery URL remains `processing`.
- Transactional email is not connected; generated links are shown for deliberate manual delivery and the UI does not claim an email was sent.

## Storage layout

```text
organizations/{organizationId}/organization/**
organizations/{organizationId}/participants/{participantId}/**
```

Organization members can read the first path. Only platform administrators can directly read participant paths in the current client rules. Production participant/family delivery must run through a server-capable secure-delivery adapter that rechecks invitation/token state, active entitlement, current consent, and asset authorization before issuing short-lived access.

## External services still required

The repository does not yet provide authoritative scheduling, payment, transactional email, or production secure-media delivery. Keep those paths disabled until their trusted adapters, audit evidence, revocation behavior, and private cache policy are deployed.
