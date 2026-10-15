"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PreviewLibrary } from "@/components/preview-library";
import { SongPlanCards } from "@/components/song-plan-cards";
import { notesAreReadyForSuggestions, sketchVersesFromNotes, versesToLyricBody } from "@/domain/songwriting";
import { guestDraftIsReady } from "@/lib/preview-library";
import styles from "./guest-songwriting.module.css";

const storageKey = "songkeep-guest-song";

type GuestSong = { notes: string; draft: string; refined: string };

function readGuestSong(): GuestSong {
  if (typeof window === "undefined") return { notes: "", draft: "", refined: "" };
  try {
    const parsed = JSON.parse(sessionStorage.getItem(storageKey) ?? "") as Partial<GuestSong>;
    return { notes: parsed.notes ?? "", draft: parsed.draft ?? "", refined: parsed.refined ?? "" };
  } catch {
    return { notes: "", draft: "", refined: "" };
  }
}

export function GuestSongwriting() {
  const [song, setSong] = useState<GuestSong>({ notes: "", draft: "", refined: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSong(readGuestSong());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) sessionStorage.setItem(storageKey, JSON.stringify(song));
  }, [ready, song]);

  function suggest() {
    setError("");
    setNotice("");
    try {
      const sketch = sketchVersesFromNotes(song.notes);
      const body = versesToLyricBody(sketch.verses);
      setSong((current) => ({ ...current, draft: body, refined: body }));
      setNotice(sketch.notice);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Add a little more from the interview first.");
    }
  }

  const lyric = song.refined.trim() || song.draft.trim();
  const keepable = guestDraftIsReady(lyric);

  return <div className={styles.page}>
    <section className={styles.intro}>
      <p className={styles.kicker}>Try a song</p>
      <h1>Hear a song, then shape one from the notes.</h1>
      <p>No account yet. Play a preview, paste interview notes, and keep the lines you like.</p>
    </section>

    <section className={styles.panel} aria-labelledby="guest-listen-heading">
      <h2 id="guest-listen-heading">Hear a preview</h2>
      <p>These are short songs you can play now. Pick one, then press play.</p>
      <PreviewLibrary />
    </section>

    <section className={styles.panel} aria-labelledby="guest-notes-heading">
      <h2 id="guest-notes-heading">Interview notes</h2>
      <label>Notes from the conversation
        <textarea value={song.notes} onChange={(event) => setSong((current) => ({ ...current, notes: event.target.value }))} rows={7} placeholder="Names, places, phrases, and moments." />
      </label>
      <div className={styles.actions}>
        <button type="button" onClick={suggest} disabled={!notesAreReadyForSuggestions(song.notes)}>Suggest verses</button>
      </div>
      {!notesAreReadyForSuggestions(song.notes) ? <p className={styles.help}>Add a little more from the interview before asking for verse ideas.</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    </section>

    <section className={styles.panel} aria-labelledby="guest-draft-heading">
      <h2 id="guest-draft-heading">Draft</h2>
      <p>Shape the lines yourself. Nothing here is a finished song until you say so.</p>
      <label>Working lyric
        <textarea value={song.draft} onChange={(event) => setSong((current) => ({ ...current, draft: event.target.value, refined: event.target.value }))} rows={10} />
      </label>
    </section>

    <section className={styles.panel} aria-labelledby="guest-refine-heading">
      <h2 id="guest-refine-heading">Refine</h2>
      <p>Change a line, keep a phrase, or leave it. The notes stay above if you want to look back.</p>
      <label>Refined lyric
        <textarea value={song.refined} onChange={(event) => setSong((current) => ({ ...current, refined: event.target.value }))} rows={10} />
      </label>
    </section>

    {keepable ? <>
      <section className={styles.keep} aria-labelledby="guest-keep-heading">
        <h2 id="guest-keep-heading">Keep this song</h2>
        <p>You have a draft you can hear against the previews. Create an account when you want SongKeep to hold it.</p>
        <Link className={styles.primary} href="/create-account?next=%2Ftry">Create an account</Link>
      </section>
      <SongPlanCards />
    </> : null}

    <p className={styles.quiet}><Link href="/creator/song">Already a songwriter? Open Creator Studio</Link></p>
  </div>;
}
