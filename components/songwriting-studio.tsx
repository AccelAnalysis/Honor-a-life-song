"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCreatorAccess } from "@/components/creator-access-gate";
import { PreviewLibrary } from "@/components/preview-library";
import {
  canEditSong,
  notesAreReadyForSuggestions,
  sketchVersesFromNotes,
  songStatusLabel,
  versesToLyricBody,
  type CreativeSong,
  type SongLyricVersion,
  type VerseSuggestion
} from "@/domain/songwriting";
import type { CreatorAssignment } from "@/domain/organization-account";
import { listCreatorAssignments } from "@/lib/firebase/creator-deliverables";
import {
  createCreativeSong,
  getCreativeSong,
  listCreativeSongs,
  listSongLyricVersions,
  listVerseSuggestions,
  requestVerseSuggestions,
  saveInterviewNotes,
  saveLyricVersion,
  updateLyricStatus,
  verseSuggestionNeedsLocalSketch
} from "@/lib/firebase/songwriting";
import { buildCreatorHref, type CreatorRouteResolution } from "@/lib/creator-navigation";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./songwriting-studio.module.css";

type SongwritingStudioProps = { route: CreatorRouteResolution };

function stepOf(route: CreatorRouteResolution) {
  if (route.child?.id === "story-interview-notes") return "notes";
  switch (route.grandchild?.id) {
    case "lyrics-draft": return "draft";
    case "lyrics-review": return "review";
    case "lyrics-comparison": return "compare";
    case "lyrics-refine": return "refine";
    case "lyrics-version-history": return "history";
    default: return "overview";
  }
}

function draftStorageKey(workId: string) {
  return `songkeep-draft:${workId}`;
}

function stageDraft(workId: string, body: string) {
  sessionStorage.setItem(draftStorageKey(workId), body);
}

function readStagedDraft(workId: string) {
  return sessionStorage.getItem(draftStorageKey(workId)) ?? "";
}

function hrefFor(workId: string | undefined, step: "notes" | "draft" | "review" | "compare" | "refine" | "history" | "overview") {
  if (!workId) return "/creator/song";
  if (step === "notes") return buildCreatorHref({ parentId: "story", childId: "story-interview-notes", creativeWorkId: workId });
  if (step === "overview") return buildCreatorHref({ parentId: "song", childId: "song-lyrics", creativeWorkId: workId });
  const grandchildId = {
    draft: "lyrics-draft",
    review: "lyrics-review",
    compare: "lyrics-comparison",
    refine: "lyrics-refine",
    history: "lyrics-version-history"
  }[step];
  return buildCreatorHref({ parentId: "song", childId: "song-lyrics", grandchildId, creativeWorkId: workId });
}

export function SongwritingEntry() {
  return <section className={styles.entry}>
    <p className={styles.kicker}>Songwriting</p>
    <h2>Finish a song</h2>
    <p>Start from the interview notes, shape a verse, and keep the finished song with you.</p>
    <div className={styles.entryLinks}>
      <Link className={styles.primary} href="/creator/song">Open songwriting</Link>
      <Link className={styles.secondary} href="/creator/deliverables">Open assignments</Link>
    </div>
  </section>;
}

function SongLibrary({ onOpen }: { onOpen: (workId: string) => void }) {
  const { user } = useAuth();
  const access = useCreatorAccess();
  const [songs, setSongs] = useState<CreativeSong[]>([]);
  const [assignments, setAssignments] = useState<CreatorAssignment[]>([]);
  const [assignmentId, setAssignmentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || !access) return;
    const [nextSongs, nextAssignments] = await Promise.all([
      listCreativeSongs(user.uid, access === "admin"),
      listCreatorAssignments(user.uid).catch(() => [])
    ]);
    setSongs(nextSongs);
    setAssignments(nextAssignments);
    setAssignmentId((current) => current || (access === "creator" ? nextAssignments[0]?.id ?? "" : ""));
  }, [access, user]);

  useEffect(() => { load().catch((reason) => setError(customerMessage(reason, "Songs could not be opened."))); }, [load]);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !access || busy) return;
    const data = new FormData(event.currentTarget);
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (access === "creator" && !assignment) {
      setError("Choose the assignment this song belongs to.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = await createCreativeSong({
        title: String(data.get("title") ?? ""),
        interviewNotes: String(data.get("notes") ?? ""),
        participantName: String(data.get("participant") ?? ""),
        assignedUserId: user.uid,
        createdByUserId: user.uid,
        assignmentId: assignment?.id,
        organizationId: assignment?.organizationId,
        experienceId: assignment?.experienceId
      });
      onOpen(id);
    } catch (reason) {
      setError(customerMessage(reason, "The song could not be started."));
      setBusy(false);
    }
  }

  return <section className={styles.panel} aria-labelledby="song-library-heading">
    <p className={styles.kicker}>Songwriting</p>
    <h2 id="song-library-heading">Your songs</h2>
    <PreviewLibrary compact />
    <p>Begin with the interview notes. You can shape every line before the song is finished.</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <form className={styles.form} onSubmit={start}>
      <label>Song title<input name="title" required maxLength={160} placeholder="A title you can change later" /></label>
      <label>Participant name<input name="participant" maxLength={160} placeholder="Optional" /></label>
      {assignments.length ? <label>Assignment<select value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)}>
        {access === "admin" ? <option value="">No assignment yet</option> : null}
        {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.experienceTitle} · {assignment.participantName ?? "Group"}</option>)}
      </select></label> : null}
      <label>Interview notes<textarea name="notes" rows={8} placeholder="Names, places, phrases, and moments from the conversation." /></label>
      <div className={styles.actions}><button className={styles.primary} type="submit" disabled={busy}>{busy ? "Starting…" : "Start this song"}</button></div>
    </form>
    <div className={styles.library}>
      {songs.map((song) => <Link key={song.id} href={hrefFor(song.id, "overview")}>
        <strong>{song.title}</strong>
        <span>{song.participantName || "Song"} · {songStatusLabel(song.status)}</span>
      </Link>)}
      {!songs.length ? <p>No songs yet. The first one starts from the notes above.</p> : null}
    </div>
  </section>;
}

export function SongwritingStudio({ route }: SongwritingStudioProps) {
  const { user } = useAuth();
  const router = useRouter();
  if (!route.creativeWorkId || !user) return <SongLibrary onOpen={(workId) => router.push(hrefFor(workId, "notes"))} />;
  return <SongEditor route={route} userId={user.uid} workId={route.creativeWorkId} />;
}

function SongEditor({ route, userId, workId }: { route: CreatorRouteResolution; userId: string; workId: string }) {
  const access = useCreatorAccess();
  const admin = access === "admin";
  const [work, setWork] = useState<CreativeSong | null>(null);
  const [versions, setVersions] = useState<SongLyricVersion[]>([]);
  const [suggestions, setSuggestions] = useState<VerseSuggestion[]>([]);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);
  const rememberDraft = useCallback((body: string) => {
    setDraft(body);
    stageDraft(workId, body);
  }, [workId]);
  useEffect(() => {
    const staged = readStagedDraft(workId);
    if (staged) setDraft(staged);
  }, [workId]);

  const reload = useCallback(async () => {
    const [nextWork, nextVersions, nextSuggestions] = await Promise.all([
      getCreativeSong(workId),
      listSongLyricVersions(workId, userId, admin),
      listVerseSuggestions(workId, userId, admin)
    ]);
    if (!nextWork) { setMissing(true); return; }
    setWork(nextWork);
    setVersions(nextVersions);
    setSuggestions(nextSuggestions);
    setLoaded(true);
  }, [admin, userId, workId]);

  useEffect(() => { reload().catch((reason) => setError(customerMessage(reason, "This song could not be opened."))); }, [reload]);

  async function run(workItem: () => Promise<void>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await workItem(); await reload(); setNotice(message); }
    catch (reason) { setError(customerMessage(reason, "That change could not be saved.")); }
    finally { setBusy(false); }
  }

  if (missing) {
    return <section className={styles.panel}><h2>This song is not available</h2><p>It may belong to another creator.</p><Link className={styles.primary} href="/creator/song">Back to your songs</Link></section>;
  }
  if (!loaded || !work) return <p role="status">Opening this song…</p>;

  const step = stepOf(route);
  const latest = versions[versions.length - 1];
  const finished = versions.find((version) => version.id === work.finishedVersionId) ?? latest;
  const editable = canEditSong(work.status);
  const steps = [
    ["notes", "Interview notes"],
    ["draft", "Draft"],
    ["review", "Review"],
    ["compare", "Compare"],
    ["refine", "Refine"],
    ["history", "Version history"]
  ] as const;

  return <div className={styles.studio}>
    <section className={styles.panel} aria-labelledby="creator-preview-heading">
      <h2 id="creator-preview-heading">Hear a preview</h2>
      <p>Play a song while you write. Lyrics are only part of the work.</p>
      <PreviewLibrary compact />
    </section>
    <div className={styles.songHead}>
      <div>
        <p className={styles.kicker}>Finish a song</p>
        <h2>{work.title}</h2>
        {work.participantName ? <p>{work.participantName}</p> : null}
      </div>
      <div className={styles.pill}><span>Status</span><strong>{songStatusLabel(work.status)}</strong></div>
    </div>
    {work.status === "finished" && finished ? <section className={styles.finished} aria-labelledby="finished-song-heading">
      <h2 id="finished-song-heading">This song is finished</h2>
      <p>The finished lyric stays with you. Earlier versions are still here to read.</p>
      <pre className={styles.lyric}>{finished.body}</pre>
    </section> : null}
    <nav className={styles.steps} aria-label="Songwriting steps">
      {steps.map(([id, label]) => <Link aria-current={step === id ? "page" : undefined} href={hrefFor(work.id, id)} key={id}>{label}</Link>)}
    </nav>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    {step === "overview" ? <Overview work={work} latest={latest} /> : null}
    {step === "notes" ? <NotesStep busy={busy} editable={editable} suggestions={suggestions} work={work} onArrange={(body) => { rememberDraft(body); setNotice("These lines are in the draft for you to shape."); }} onRun={run} /> : null}
    {step === "draft" || step === "refine" ? <EditorStep key={step} busy={busy} draft={draft} editable={editable} latest={latest} mode={step} setDraft={rememberDraft} suggestions={suggestions} userId={userId} versions={versions} work={work} onRun={run} /> : null}
    {step === "review" ? <ReviewStep busy={busy} editable={editable} latest={latest} work={work} onRun={run} /> : null}
    {step === "compare" ? <CompareStep versions={versions} /> : null}
    {step === "history" ? <HistoryStep versions={versions} workId={work.id} /> : null}
  </div>;
}

function Overview({ work, latest }: { work: CreativeSong; latest?: SongLyricVersion }) {
  return <section className={styles.panel}>
    <h2>Where this song stands</h2>
    <p>{latest ? "Pick up the latest version, or return to the interview notes." : "The next step is the interview notes. Suggested verses come from those notes, and you shape the draft."}</p>
    {latest ? <pre className={styles.lyric}>{latest.body}</pre> : null}
    <div className={styles.actions}>
      <Link className={styles.primary} href={hrefFor(work.id, latest ? "review" : "notes")}>{latest ? "Review the latest version" : "Open interview notes"}</Link>
      <Link className={styles.secondary} href={hrefFor(work.id, "draft")}>Open the draft</Link>
    </div>
  </section>;
}

function NotesStep({ work, suggestions, editable, busy, onRun, onArrange }: {
  work: CreativeSong;
  suggestions: VerseSuggestion[];
  editable: boolean;
  busy: boolean;
  onRun: (workItem: () => Promise<void>, message: string) => Promise<void>;
  onArrange: (body: string) => void;
}) {
  const [title, setTitle] = useState(work.title);
  const [notes, setNotes] = useState(work.interviewNotes);
  useEffect(() => { setTitle(work.title); setNotes(work.interviewNotes); }, [work.title, work.interviewNotes]);

  return <section className={styles.panel}>
    <h2>Interview notes</h2>
    <p>Keep the details the song should honor. Verse ideas stay suggestions until you save them in your draft.</p>
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void onRun(() => saveInterviewNotes(work, { title, interviewNotes: notes }), "Notes saved."); }}>
      <label>Song title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} disabled={!editable || busy} /></label>
      <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={!editable || busy} /></label>
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={!editable || busy}>Save notes</button>
        <button className={styles.secondary} type="button" disabled={!editable || busy || !notesAreReadyForSuggestions(notes)} onClick={() => void onRun(async () => {
          await saveInterviewNotes(work, { title, interviewNotes: notes });
          try { await requestVerseSuggestions(work.id); }
          catch (reason) {
            if (!verseSuggestionNeedsLocalSketch(reason)) throw reason;
            onArrange(versesToLyricBody(sketchVersesFromNotes(notes).verses));
            throw new Error("Verse suggestions are unavailable right now. An arrangement of your notes is ready in the draft.");
          }
        }, "Verse ideas are ready. Use one in the draft, or leave it.")}>Suggest verses</button>
      </div>
      {!notesAreReadyForSuggestions(notes) ? <p className={styles.help}>Add a little more from the interview before asking for verse ideas. You can still write the draft yourself.</p> : null}
    </form>
    {suggestions.map((suggestion) => <article className={styles.verse} key={suggestion.id}>
      <strong>{suggestion.source === "model" ? "Suggested from the notes" : "Arranged from the notes"}</strong>
      <span>{suggestion.notice}</span>
      <pre className={styles.lyric}>{versesToLyricBody(suggestion.verses)}</pre>
      {editable ? <Link className={styles.primary} href={hrefFor(work.id, "draft")} onClick={() => onArrange(versesToLyricBody(suggestion.verses))}>Use this in the draft</Link> : null}
    </article>)}
  </section>;
}

function EditorStep({ work, versions, suggestions, latest, mode, draft, setDraft, editable, busy, userId, onRun }: {
  work: CreativeSong;
  versions: SongLyricVersion[];
  suggestions: VerseSuggestion[];
  latest?: SongLyricVersion;
  mode: "draft" | "refine";
  draft: string;
  setDraft: (value: string) => void;
  editable: boolean;
  busy: boolean;
  userId: string;
  onRun: (workItem: () => Promise<void>, message: string) => Promise<void>;
}) {
  const seed = latest?.body ?? "";
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (draft) return;
    const staged = readStagedDraft(work.id);
    if (mode !== "refine" && staged) setDraft(staged);
    else if (seed) setDraft(seed);
  }, [draft, mode, seed, setDraft, work.id]);
  const source = suggestions.some((suggestion) => versesToLyricBody(suggestion.verses) === draft.trim()) ? "suggestion" : "creator";

  return <section className={styles.panel}>
    <h2>{mode === "refine" ? "Refine this version" : "Draft"}</h2>
    <p>{mode === "refine" ? "Shape the latest version into the next one. The earlier version stays in the history." : "Write the lyric in your own words. Saving keeps this version and leaves earlier ones in place."}</p>
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void onRun(() => saveLyricVersion({
      work,
      versions,
      body: draft,
      status: mode === "refine" ? "refined" : "draft",
      source,
      authorUserId: userId,
      nextSongStatus: mode === "refine" ? "refining" : "drafting"
    }).then(() => undefined), mode === "refine" ? "Refined version saved." : "Draft saved."); }}>
      <label>{mode === "refine" ? "Refined lyric" : "Working lyric"}<textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!editable || busy} /></label>
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={!editable || busy || !draft.trim()}>{mode === "refine" ? "Save refined version" : "Save draft"}</button>
        <Link className={styles.secondary} href={hrefFor(work.id, "review")}>Go to review</Link>
      </div>
    </form>
  </section>;
}

function ReviewStep({ work, latest, editable, busy, onRun }: {
  work: CreativeSong;
  latest?: SongLyricVersion;
  editable: boolean;
  busy: boolean;
  onRun: (workItem: () => Promise<void>, message: string) => Promise<void>;
}) {
  if (!latest) {
    return <section className={styles.panel}><h2>Review</h2><p>Save a draft before review.</p><Link className={styles.primary} href={hrefFor(work.id, "draft")}>Open the draft</Link></section>;
  }
  return <section className={styles.panel}>
    <h2>Review version {latest.version}</h2>
    <p>Read it as the songwriter. Compare it, refine it, or mark the song finished when it is yours.</p>
    <pre className={styles.lyric}>{latest.body}</pre>
    <div className={styles.actions}>
      {editable && latest.status === "draft" ? <button className={styles.secondary} type="button" disabled={busy} onClick={() => void onRun(() => updateLyricStatus({ work, version: latest, status: "in_review", songStatus: "in_review" }), "Marked for review.")}>Mark for review</button> : null}
      <Link className={styles.secondary} href={hrefFor(work.id, "compare")}>Compare versions</Link>
      <Link className={styles.secondary} href={hrefFor(work.id, "refine")}>Refine this version</Link>
      {editable ? <button className={styles.primary} type="button" disabled={busy} onClick={() => void onRun(() => updateLyricStatus({ work, version: latest, status: "finished", songStatus: "finished" }), "This song is finished.")}>Mark this song finished</button> : null}
    </div>
  </section>;
}

function CompareStep({ versions }: { versions: SongLyricVersion[] }) {
  const [leftId, setLeftId] = useState(versions[Math.max(0, versions.length - 2)]?.id ?? "");
  const [rightId, setRightId] = useState(versions[versions.length - 1]?.id ?? "");
  const left = versions.find((version) => version.id === leftId);
  const right = versions.find((version) => version.id === rightId);
  if (versions.length < 2) {
    return <section className={styles.panel}><h2>Compare</h2><p>Save at least two versions to read them side by side.</p></section>;
  }
  return <section className={styles.panel}>
    <h2>Compare</h2>
    <p>Read two versions side by side. Nothing here rewrites the lyric.</p>
    <div className={styles.columns}>
      <label className={styles.form}>Earlier version
        <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
          {versions.map((item) => <option key={item.id} value={item.id}>Version {item.version}</option>)}
        </select>
        <pre className={styles.lyric}>{left?.body}</pre>
      </label>
      <label className={styles.form}>Later version
        <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
          {versions.map((item) => <option key={item.id} value={item.id}>Version {item.version}</option>)}
        </select>
        <pre className={styles.lyric}>{right?.body}</pre>
      </label>
    </div>
  </section>;
}

function HistoryStep({ versions, workId }: { versions: SongLyricVersion[]; workId: string }) {
  if (!versions.length) return <section className={styles.panel}><h2>Version history</h2><p>Saved drafts will appear here, oldest first.</p><Link className={styles.primary} href={hrefFor(workId, "draft")}>Open the draft</Link></section>;
  return <section className={styles.panel}>
    <h2>Version history</h2>
    <div className={styles.library}>
      {versions.map((version) => <article key={version.id}>
        <strong>Version {version.version}</strong>
        <span>{version.status.replaceAll("_", " ")} · {version.source === "suggestion" ? "Started from a suggestion" : "Written by you"}</span>
        <pre className={styles.lyric}>{version.body}</pre>
      </article>)}
    </div>
  </section>;
}
