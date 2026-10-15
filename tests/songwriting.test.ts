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
    expect(readFileSync("components/public-navigation.tsx", "utf8")).toContain('href="/try"');
    expect(readFileSync("components/public-navigation.tsx", "utf8")).not.toContain('href="/creator/song"');
    const guest = readFileSync("components/guest-songwriting.tsx", "utf8");
    expect(guest).toContain("Suggest verses");
    expect(guest).toContain("Hear a preview");
    expect(guest).toContain('href="/create-account?next=%2Ftry"');
    expect(guest).not.toContain("CreatorAccessGate");
    const valueMoment = guest.indexOf("{keepable ?");
    const beforeValue = guest.slice(0, valueMoment);
    const afterValue = guest.slice(valueMoment, guest.indexOf(": null}", valueMoment));
    expect(beforeValue).not.toContain("<SongPlanCards />");
    expect(beforeValue).not.toContain("/begin");
    expect(beforeValue).not.toMatch(/\$\d/);
    expect(afterValue).toContain("Keep this song");
    expect(afterValue.indexOf("<SongPlanCards />")).toBeGreaterThan(afterValue.indexOf("Keep this song"));
    const plans = readFileSync("components/song-plan-cards.tsx", "utf8");
    expect(plans).toContain("experienceOfferings");
    expect(plans).toContain("formatOfferingPrice");
    expect(plans).toContain("/begin?offering=");
    expect(plans).toContain("offering.creativeOutput");
    expect(plans).toContain("offering.storyCapture");
    expect(plans).toContain("offering.presentation");
    expect(plans).toContain("offering.postEvent");
    expect(plans).not.toMatch(/Accel Analysis/i);
    expect(readFileSync("app/try/page.tsx", "utf8")).not.toContain("CreatorAccessGate");
    const client = [
      "components/songwriting-studio.tsx",
      "lib/firebase/songwriting.ts",
      "domain/songwriting.ts"
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(client).toContain("songkeepSuggestVerses");
    expect(client).not.toMatch(/SONGKEEP_LYRIC_MODEL_KEY|sk-|api\.openai\.com|BEGIN PRIVATE KEY/);
  });
});
