# Finish a song

Creators and platform staff use Creator Studio to take one song from interview notes to a finished lyric. The public header links to `/creator/song`. Assigned creators also see **Finish a song** from their assignments page.

## What a creator does

1. Sign in. Creator Studio opens only for a platform admin or an account with a creator assignment.
2. Open **Finish a song** and start a song with a title and the interview notes.
3. Save the notes, then ask for verse ideas. Use a suggestion in the draft or leave it.
4. Save the draft. Each save adds the next version and leaves earlier versions in place.
5. Review the latest version, compare two versions, or refine the latest version into a new one.
6. Mark the song finished. The finished lyric stays on that creator's song, and later edits are closed.

## Data

`creativeWorks/{songId}` holds the title, notes, owner, and status. Lyric versions live under `lyricVersions`. Verse suggestions live under `suggestions`.

Firestore allows those reads and lyric writes for a platform admin or the assigned creator (`assignedUserId`). Clients cannot create or edit suggestion documents. There is no public read or write. Organization membership does not grant access.

A signed-in creator owns the song they start. An admin may attach one of their assignments, and the song is still stored under the signed-in account that created it.

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
