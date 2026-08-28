# Firebase organization account setup

The organization account uses the Firebase project already registered for Honor a Life Song:

- Project ID: `songify-cc2c5`
- Project number / messaging sender ID: `471693809116`
- Web App ID: `1:471693809116:web:e13d6b10bd310bd78aeb19`

No private Firebase credentials belong in this repository.

## 1. Local setup

From a brand-new local folder:

```bash
git clone https://github.com/AccelAnalysis/Honor-a-life-song.git .
git switch main
git pull --ff-only origin main
npm install
cp .env.example .env.local
```

Fill the remaining Firebase Web SDK values in `.env.local` from Firebase Console → Project settings → Your apps:

```dotenv
NEXT_PUBLIC_FIREBASE_PROJECT_ID=songify-cc2c5
NEXT_PUBLIC_FIREBASE_APP_ID=1:471693809116:web:e13d6b10bd310bd78aeb19
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=471693809116
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase web API key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<Firebase auth domain>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<Firebase storage bucket>
```

The Firebase Web SDK configuration identifies the web app; it is not a substitute for Firestore/Storage security rules. Do not place service-account JSON, private keys, Stripe secrets, or other server credentials in `NEXT_PUBLIC_*` variables.

## 2. Firebase Console services

Enable the following for `songify-cc2c5`:

1. Authentication → Sign-in method → Email/Password.
2. Firestore Database.
3. Firebase Storage when organization event media will be stored there.

Email verification and password-reset messages use Firebase Authentication's configured email templates.

## 3. Deploy Firestore and Storage rules

Authenticate the Firebase CLI locally, select the existing project, then deploy the rules committed with the application:

```bash
npx firebase-tools login
npx firebase-tools use songify-cc2c5
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

The rules enforce these boundaries:

- every person signs in through their own Firebase Auth identity;
- organization records are readable only by active members or platform administrators;
- organization-admin membership controls team invitations and organization-level electronic signatures;
- invitation acceptance is restricted to the authenticated email address on the pending invitation;
- organization members can express interest in suggested dates but cannot make authoritative event records themselves;
- experiences, organization agreement requests, suggested dates, and released event materials are created/managed from Operations by platform administrators;
- organization agreements do not grant or replace participant consent;
- organization media in Firebase Storage is readable only by the organization or platform administrators and writable only by platform administrators in this slice.

## 4. Bootstrap the first platform administrator

Create/sign in the initial staff user through Firebase Authentication. Copy that user's Firebase Auth UID.

In Firestore Console, create:

```text
admins/{firebaseAuthUid}
```

with:

```json
{
  "active": true,
  "role": "admin"
}
```

The first admin must be bootstrapped through Firebase Console or another trusted administrative environment. The client application deliberately cannot grant itself platform-admin access.

## 5. Organization data shape

```text
users/{uid}
  organizations/{organizationId}

organizations/{organizationId}
  members/{uid}
  invitations/{invitationId}
  agreements/{agreementId}
  experiences/{experienceId}
  suggestedDates/{suggestionId}
  assets/{assetId}

admins/{uid}
```

The user-to-organization pointer is for discovery only. Authorization is controlled by the membership record under the organization and by Firestore rules.

## 6. Agreements and consent

Organization-level agreements can store a document/version reference and an electronic signature record. The exact contract, terms, privacy language, cancellation language, media terms, and legal sufficiency must be approved before production use.

Participant permissions remain separate consent records. A facility or organization signing a service agreement does not grant permission to record a participant, publish a story, share a song, use event photography, or use a participant in marketing.

## 7. Invitations and email delivery

The organization account creates a real invitation record with a secure invitation ID. Until the transactional messaging adapter is connected, the organization administrator is shown the generated invitation link so it can be delivered manually. The UI does not claim an email was sent when no email provider is connected.

Once the shared communications service is connected, that same invitation record should trigger the transactional email rather than introducing a second invitation system.

## 8. Post-event materials

Operations can associate released materials with an organization and an experience, including:

- song;
- lyrics;
- event video;
- approved photos;
- report;
- keepsake; and
- other approved files.

The metadata record should point to an authorized delivery/storage location. Public URLs should not be used for restricted participant media.
