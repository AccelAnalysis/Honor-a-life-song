import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Timestamp
} from "firebase/firestore";
import { appendLyricVersion } from "@/domain/creative";
import type { LyricVersion } from "@/domain/types";
import {
  canEditSong,
  type CreativeSong,
  type LyricDraftStatus,
  type SongLyricVersion,
  type SongStatus,
  type VerseSuggestion
} from "@/domain/songwriting";
import { customerErrorCode } from "@/lib/customer-messages";
import { getFirebaseFirestore, getFirebaseFunctions } from "./client";

export class VerseSuggestionError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function verseSuggestionNeedsLocalSketch(error: unknown) {
  const code = error instanceof VerseSuggestionError ? error.code : customerErrorCode(error);
  return code === "unavailable" || code === "internal" || code === "not-found" || code === "deadline-exceeded" || code === "";
}

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate().toISOString();
  return new Date(0).toISOString();
}

function songFrom(id: string, data: DocumentData): CreativeSong {
  return {
    id,
    title: data.title ?? "Untitled song",
    assignmentId: data.assignmentId ?? "",
    organizationId: data.organizationId ?? "",
    experienceId: data.experienceId ?? "",
    participantName: data.participantName ?? "",
    assignedUserId: data.assignedUserId ?? "",
    createdByUserId: data.createdByUserId ?? "",
    status: data.status ?? "notes",
    interviewNotes: data.interviewNotes ?? "",
    finishedVersionId: data.finishedVersionId ?? null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function versionFrom(id: string, data: DocumentData): SongLyricVersion {
  return {
    id,
    creativeWorkId: data.creativeWorkId ?? "",
    assignedUserId: data.assignedUserId ?? "",
    authorUserId: data.authorUserId ?? "",
    version: data.version ?? 0,
    body: data.body ?? "",
    status: data.status ?? "draft",
    source: data.source === "suggestion" ? "suggestion" : "creator",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function suggestionFrom(id: string, data: DocumentData): VerseSuggestion {
  const verses = Array.isArray(data.verses) ? data.verses : [];
  return {
    id,
    creativeWorkId: data.creativeWorkId ?? "",
    assignedUserId: data.assignedUserId ?? "",
    createdByUserId: data.createdByUserId ?? "",
    source: data.source === "model" ? "model" : "notes-sketch",
    notice: data.notice ?? "Shape these lines yourself.",
    verses: verses.map((verse: { label?: string; text?: string }) => ({
      label: verse.label ?? "Verse",
      text: verse.text ?? ""
    })),
    createdAt: toIso(data.createdAt)
  };
}

function asLyricVersion(version: SongLyricVersion): LyricVersion {
  return { id: version.id, creativeWorkId: version.creativeWorkId, version: version.version, createdAt: version.createdAt };
}

export async function listCreativeSongs(userId: string, admin: boolean): Promise<CreativeSong[]> {
  const db = getFirebaseFirestore();
  const snapshots = admin
    ? await getDocs(collection(db, "creativeWorks"))
    : await getDocs(query(collection(db, "creativeWorks"), where("assignedUserId", "==", userId)));
  return snapshots.docs
    .map((snapshot) => songFrom(snapshot.id, snapshot.data()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCreativeSong(workId: string): Promise<CreativeSong | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "creativeWorks", workId));
  return snapshot.exists() ? songFrom(snapshot.id, snapshot.data()) : null;
}

export async function listSongLyricVersions(workId: string, userId: string, admin: boolean): Promise<SongLyricVersion[]> {
  const base = collection(getFirebaseFirestore(), "creativeWorks", workId, "lyricVersions");
  const snapshots = await getDocs(admin ? base : query(base, where("assignedUserId", "==", userId)));
  return snapshots.docs
    .map((snapshot) => versionFrom(snapshot.id, snapshot.data()))
    .sort((a, b) => a.version - b.version || a.createdAt.localeCompare(b.createdAt));
}

export async function listVerseSuggestions(workId: string, userId: string, admin: boolean): Promise<VerseSuggestion[]> {
  const base = collection(getFirebaseFirestore(), "creativeWorks", workId, "suggestions");
  const snapshots = await getDocs(admin ? base : query(base, where("assignedUserId", "==", userId)));
  return snapshots.docs
    .map((snapshot) => suggestionFrom(snapshot.id, snapshot.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createCreativeSong(input: {
  title: string;
  interviewNotes: string;
  participantName: string;
  assignedUserId: string;
  createdByUserId: string;
  assignmentId?: string;
  organizationId?: string;
  experienceId?: string;
}): Promise<string> {
  const title = input.title.trim();
  if (!title || title.length > 160) throw new Error("Enter a song title.");
  const notes = input.interviewNotes.trim();
  if (notes.length > 20000) throw new Error("Shorten the interview notes and save again.");
  const songRef = doc(collection(getFirebaseFirestore(), "creativeWorks"));
  await setDoc(songRef, {
    title,
    assignmentId: input.assignmentId ?? "",
    organizationId: input.organizationId ?? "",
    experienceId: input.experienceId ?? "",
    participantName: input.participantName.trim().slice(0, 160),
    assignedUserId: input.assignedUserId,
    createdByUserId: input.createdByUserId,
    status: "notes",
    interviewNotes: notes,
    finishedVersionId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return songRef.id;
}

export async function saveInterviewNotes(work: CreativeSong, input: { title: string; interviewNotes: string }) {
  if (!canEditSong(work.status)) throw new Error("This song is already finished.");
  const title = input.title.trim();
  if (!title || title.length > 160) throw new Error("Enter a song title.");
  const interviewNotes = input.interviewNotes.trim();
  if (interviewNotes.length > 20000) throw new Error("Shorten the interview notes and save again.");
  await updateDoc(doc(getFirebaseFirestore(), "creativeWorks", work.id), { title, interviewNotes, updatedAt: serverTimestamp() });
}

export async function saveLyricVersion(input: {
  work: CreativeSong;
  versions: readonly SongLyricVersion[];
  body: string;
  status: Exclude<LyricDraftStatus, "finished">;
  source: "creator" | "suggestion";
  authorUserId: string;
  nextSongStatus: Exclude<SongStatus, "finished">;
}): Promise<string> {
  if (!canEditSong(input.work.status)) throw new Error("This song is already finished.");
  const body = input.body.trim();
  if (!body || body.length > 12000) throw new Error("Enter the lyric you want to save.");
  const versionRef = doc(collection(getFirebaseFirestore(), "creativeWorks", input.work.id, "lyricVersions"));
  const next = asLyricVersion({
    id: versionRef.id,
    creativeWorkId: input.work.id,
    assignedUserId: input.work.assignedUserId,
    authorUserId: input.authorUserId,
    version: input.versions.reduce((max, version) => Math.max(max, version.version), 0) + 1,
    body,
    status: input.status,
    source: input.source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  try {
    appendLyricVersion(input.versions.map(asLyricVersion), next);
  } catch {
    throw new Error("Save the lyric as the next version.");
  }
  const batch = writeBatch(getFirebaseFirestore());
  batch.set(versionRef, {
    creativeWorkId: input.work.id,
    assignedUserId: input.work.assignedUserId,
    authorUserId: input.authorUserId,
    version: next.version,
    body,
    status: input.status,
    source: input.source,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(getFirebaseFirestore(), "creativeWorks", input.work.id), {
    status: input.nextSongStatus,
    updatedAt: serverTimestamp()
  });
  await batch.commit();
  return versionRef.id;
}

export async function updateLyricStatus(input: {
  work: CreativeSong;
  version: SongLyricVersion;
  status: LyricDraftStatus;
  songStatus: SongStatus;
}) {
  if (!canEditSong(input.work.status)) throw new Error("This song is already finished.");
  const batch = writeBatch(getFirebaseFirestore());
  batch.update(doc(getFirebaseFirestore(), "creativeWorks", input.work.id, "lyricVersions", input.version.id), {
    status: input.status,
    updatedAt: serverTimestamp()
  });
  batch.update(doc(getFirebaseFirestore(), "creativeWorks", input.work.id), {
    status: input.songStatus,
    finishedVersionId: input.songStatus === "finished" ? input.version.id : input.work.finishedVersionId,
    updatedAt: serverTimestamp()
  });
  await batch.commit();
}

export async function requestVerseSuggestions(creativeWorkId: string): Promise<VerseSuggestion> {
  const call = httpsCallable<{ creativeWorkId: string }, VerseSuggestion>(getFirebaseFunctions(), "songkeepSuggestVerses");
  try {
    return (await call({ creativeWorkId })).data;
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/^Firebase:\s*/, "") : "";
    throw new VerseSuggestionError(message || "Verse suggestions are unavailable right now.", customerErrorCode(error));
  }
}
