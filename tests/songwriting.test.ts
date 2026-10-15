import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appendLyricVersion } from "../domain/creative";
import { notesAreReadyForSuggestions, sketchVersesFromNotes, versesToLyricBody } from "../domain/songwriting";
import type { LyricVersion } from "../domain/types";

const interview = "She taught piano in the church basement for forty years. The children called her Miss Ruth. She still hums the hymn when the hallway gets quiet.";

describe("songwriting flow", () => {
  it("arranges verse ideas only from the interview notes", () => {
    expect(notesAreReadyForSuggestions("too short")).toBe(false);
    const sketch = sketchVersesFromNotes(interview);
    expect(sketch.source).toBe("notes-sketch");
    expect(sketch.verses.length).toBeGreaterThan(0);
    expect(sketch.verses.length).toBeLessThanOrEqual(4);
    for (const verse of sketch.verses) {
      expect(verse.label.length).toBeGreaterThan(0);
      for (const line of verse.text.split("\n")) expect(interview).toContain(line);
    }
    expect(versesToLyricBody(sketch.verses)).toContain("Verse 1");
  });

  it("keeps a new draft from replacing earlier lyric versions", () => {
    const prior: LyricVersion[] = [
      { id: "lyrics-v1", creativeWorkId: "work-1", version: 1, createdAt: "2026-08-20T10:00:00Z" }
    ];
    const next: LyricVersion = { id: "lyrics-v2", creativeWorkId: "work-1", version: 2, createdAt: "2026-08-20T11:00:00Z" };
    expect(appendLyricVersion(prior, next).map((version) => version.id)).toEqual(["lyrics-v1", "lyrics-v2"]);
    expect(() => appendLyricVersion(prior, { ...next, version: 1 })).toThrow(/advance version history/);
  });

  it("gates creator routes and keeps suggestion writes on the server", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    const creative = rules.slice(rules.indexOf("match /creativeWorks/{workId}"));
    expect(creative).toContain("platformAdmin()");
    expect(creative).toContain("assignedUserId == request.auth.uid");
    expect(creative).toContain("allow create, update, delete: if false;");
    expect(creative).not.toContain("allow read, write: if true");
    expect(readFileSync("components/workspace-route.tsx", "utf8")).toContain("<CreatorAccessGate>");
    expect(readFileSync("app/(lifecycle)/creator/deliverables/page.tsx", "utf8")).toContain("CreatorAccessGate");
    expect(readFileSync("components/public-navigation.tsx", "utf8")).toContain('href="/creator/song"');
    const client = [
      "components/songwriting-studio.tsx",
      "lib/firebase/songwriting.ts",
      "domain/songwriting.ts"
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(client).toContain("songkeepSuggestVerses");
    expect(client).not.toMatch(/SONGKEEP_LYRIC_MODEL_KEY|sk-|api\.openai\.com|BEGIN PRIVATE KEY/);
  });
});
