# Firebase integration

Honor a Life Song is associated with the existing Firebase project below.

| Firebase field | Value |
| --- | --- |
| Project name | Honor a Life Song |
| Project ID | `songify-cc2c5` |
| Project number | `471693809116` |
| Web app ID | `1:471693809116:web:e13d6b10bd310bd78aeb19` |

## Repository boundary

The repository contains the Firebase project association and a client-side integration boundary, but it does not commit environment-specific credentials. Local development values belong in `.env.local`, which is ignored by Git.

The Firebase client initializer is located at `lib/firebase/client.ts`. It exposes lazy accessors for Firebase App, Authentication, Cloud Firestore, and Cloud Storage. The initializer fails closed with a clear configuration error if a required value has not been supplied.

## Local setup

1. Sync or pull the repository into the local working folder.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`.
4. In Firebase Console, open **Project settings > Your apps** and select the registered Honor a Life Song web app.
5. Copy the exact Web SDK configuration values into `.env.local`.
6. Run `npm run dev`.

Required client values:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is optional and should be populated only if Analytics is enabled for the web app.

## Firebase CLI project association

The checked-in `.firebaserc` maps the repository's default Firebase project to `songify-cc2c5`.

From the local repository:

```bash
npx firebase-tools login
npx firebase-tools use songify-cc2c5
npx firebase-tools projects:list
```

A `firebase.json` file should be added only when specific Firebase deployment products are initialized. Do not select Hosting, Functions, Firestore rules, Storage rules, or other deployable resources merely to create a placeholder configuration. Their configuration should follow the platform's approved production architecture.

## Security boundary

Variables prefixed with `NEXT_PUBLIC_` are browser configuration and are included in the client bundle. Never place privileged server credentials, service-account private keys, payment secrets, signing secrets, or other server-only values in them.

For local privileged server development, use deployment-managed credentials or Application Default Credentials rather than committing service-account JSON into the repository. Production server credentials should remain in the hosting platform's secret/configuration system.

## Current status

This change establishes the Firebase project connection foundation. It does **not** by itself enable production authentication, create Firestore collections, publish security rules, create Storage buckets, or configure Firebase Hosting. Those capabilities should be activated deliberately as their corresponding Honor a Life Song workflows are connected to persistence.

## References

- Firebase Web setup: https://firebase.google.com/docs/web/setup
- Firebase CLI: https://firebase.google.com/docs/cli
