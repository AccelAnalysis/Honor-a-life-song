import type { EntityId, ISODateTime } from "./types";

export const songStatuses = ["notes", "drafting", "in_review", "refining", "finished"] as const;
export type SongStatus = (typeof songStatuses)[number];

export const lyricDraftStatuses = ["draft", "in_review", "refined", "finished"] as const;
export type LyricDraftStatus = (typeof lyricDraftStatuses)[number];

export type SongLyricVersion = {
  id: EntityId;
  creativeWorkId: EntityId;
  assignedUserId: EntityId;
  authorUserId: EntityId;
  version: number;
  body: string;
  status: LyricDraftStatus;
  source: "creator" | "suggestion";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type VerseSuggestion = {
  id: EntityId;
  creativeWorkId: EntityId;
  assignedUserId: EntityId;
  createdByUserId: EntityId;
  source: "model" | "notes-sketch";
  notice: string;
  verses: readonly { label: string; text: string }[];
  createdAt: ISODateTime;
};

export type CreativeSong = {
  id: EntityId;
  title: string;
  assignmentId: string;
  organizationId: string;
  experienceId: string;
  participantName: string;
  assignedUserId: EntityId;
  createdByUserId: EntityId;
  status: SongStatus;
  interviewNotes: string;
  finishedVersionId: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

const statusLabels: Record<SongStatus, string> = {
  notes: "Interview notes",
  drafting: "Drafting",
  in_review: "In review",
  refining: "Refining",
  finished: "Finished"
};

export function songStatusLabel(status: SongStatus) {
  return statusLabels[status];
}

export function canEditSong(status: SongStatus) {
  return status !== "finished";
}

export function notesAreReadyForSuggestions(notes: string) {
  return notes.trim().length >= 40;
}

export function versesToLyricBody(verses: readonly { label: string; text: string }[]) {
  return verses
    .map((verse) => `${verse.label.trim()}\n${verse.text.trim()}`)
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}

/** Device-side arrangement of the creator's own notes. This is not a model call. */
export function sketchVersesFromNotes(notes: string) {
  const cleaned = notes.replace(/\s+/g, " ").trim();
  if (cleaned.length < 40) {
    throw new Error("Add a little more from the interview before asking for verse ideas.");
  }
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 8);
  const lines = (sentences.length ? sentences : [cleaned]).slice(0, 8);
  const chunks: string[] = [];
  for (let index = 0; index < lines.length && chunks.length < 4; index += 2) {
    chunks.push(lines.slice(index, index + 2).join("\n"));
  }
  const labels = ["Verse 1", "Chorus", "Verse 2", "Bridge"];
  return {
    source: "notes-sketch" as const,
    notice: "Arranged from the interview notes. Shape these lines yourself.",
    verses: chunks.map((text, index) => ({ label: labels[index] ?? `Verse ${index + 1}`, text }))
  };
}
