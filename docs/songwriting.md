# Finish a song

Visitors start at **Try a song** (`/try`) with no account. They can play preview songs, paste interview notes, arrange verses, and refine a lyric on that page. Account creation and the plan cards appear only after a draft exists. Prices are not on the page before that.

Signed-in platform admins and assigned creators still use Creator Studio at `/creator`. That path stays behind `CreatorAccessGate`.

## Guest steps

1. Open **Try a song**. Nothing asks for a sign-in.
2. Play one or more previews.
3. Paste interview notes and ask for verse ideas. On this public page the lines are arranged from the notes in the browser. No model key is involved.
4. Edit the draft and refine it.
5. When a draft is long enough to keep, create an account if you want SongKeep to hold it.
6. The same moment shows the three SongKeep packages side by side: Single-Song Group Event ($200), Honor a Life Song Experience ($2,500), and SongKeep Legacy Album ($6,000). Each card lists the package benefits already stored on that offering and links to booking for that plan. Those names and prices come from `experienceOfferings`.

## What a creator does

1. Sign in. Creator Studio opens only for a platform admin or an account with a creator assignment.
2. Open Creator Studio and start a song with a title and the interview notes. A player on that page plays the same previews visitors hear.
3. Save the notes, then ask for verse ideas. Use a suggestion in the draft or leave it.
4. Save the draft. Each save adds the next version and leaves earlier versions in place.
5. Review the latest version, compare two versions, or refine the latest version into a new one.
6. Mark the song finished. The finished lyric stays on that creator's song, and later edits are closed.

## Data

`creativeWorks/{songId}` holds the title, notes, owner, and status. Lyric versions live under `lyricVersions`. Verse suggestions live under `suggestions`.

Firestore allows those reads and lyric writes for a platform admin or the assigned creator (`assignedUserId`). Clients cannot create or edit suggestion documents. There is no public read or write. Organization membership does not grant access.

A signed-in creator owns the song they start. An admin may attach one of their assignments, and the song is still stored under the signed-in account that created it.

## Previews

The home page and the try page play more than one short preview. Three original sketches ship in `public/previews/` so listening works with no account and no Firebase.

A signed-in admin, or a creator with an assignment, can add more from Creator Studio. Upload an audio file or paste an https link. Uploads go to Cloud Storage at `song-previews/{id}/` and a `songPreviews` document. Visitors can read a preview only after it is published. They cannot write previews. Storage still denies every other path.

## Suggestions and the static export

The site is a static export on GitHub Pages, so it cannot hold a server route or a model key. The browser calls the Cloud Function `songkeepSuggestVerses`. The function reads the saved notes, checks the caller, and writes the suggestion with the Admin SDK.

`SONGKEEP_LYRIC_MODEL_KEY` is a Cloud Functions secret. It is not a `NEXT_PUBLIC_` variable and it is not read by client code. The function calls an OpenAI-compatible chat endpoint only when that secret is set to a real key. `SONGKEEP_LYRIC_MODEL_URL` and `SONGKEEP_LYRIC_MODEL` can override the endpoint and model name on the server. If the secret is missing, set to `disabled`, or the model call fails, the function stores an arrangement of lines taken from the notes and labels it as such.

Before this function is deployed, create the secret or the functions deploy that includes `songkeepSuggestVerses` will stop:

```bash
npx firebase-tools functions:secrets:set SONGKEEP_LYRIC_MODEL_KEY
```

Use `disabled` until a real key should be used. This pull request does not deploy rules or functions.

If the callable cannot be reached, the studio can arrange the notes already on screen into the draft and says that it did so. That arrangement is not a model call and does not add a key to the browser bundle.

Local checks that do not need emulators:

```bash
npm test
npm run typecheck
cd functions && npm test
```

Rules and the callable against a live project need the Firestore emulator or a deployed ruleset, plus the secret above for a real model call.
