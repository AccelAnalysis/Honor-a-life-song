import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appendLyricVersion } from "../domain/creative";
import { formatPlanPrice, individualSongAddOns, individualSongPlans } from "../domain/individual-song-plans";
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
    expect(plans).toContain("groupAccountHref");
    expect(plans).toContain("offering.creativeOutput");
    expect(plans).toContain("offering.storyCapture");
    expect(plans).toContain("offering.presentation");
    expect(plans).toContain("offering.postEvent");
    expect(plans).not.toMatch(/Accel Analysis/i);
    expect(plans).toContain('useState<PlanAudience>("individual")');
    expect(plans).toContain("individualSongPlans");
    expect(plans).toContain("individualSongAddOns");
    expect(plans).toContain("Choose ${plan.name}");
    expect(plans).toContain('aria-label="Plan type"');
    expect(plans).not.toMatch(/Song Vault|Standard Tribute|\$59|\$89|\$149/);
    expect(formatPlanPrice(1_900)).toBe("$19");
    expect(formatPlanPrice(3_900)).toBe("$39");
    expect(formatPlanPrice(5_900)).toBe("$59");
    expect(formatPlanPrice(500)).toBe("$5");
    expect(formatPlanPrice(1_000)).toBe("$10");
    expect(individualSongPlans.map((plan) => [plan.name, plan.priceCents, plan.featured ?? false])).toEqual([
      ["Song Keep", 1_900, false],
      ["Song Keep + Music", 3_900, true],
      ["Song Keep Signature", 5_900, false]
    ]);
    expect(individualSongPlans.flatMap((plan) => plan.benefits)).toEqual(expect.arrayContaining([
      "Personalized lyrics",
      "Everything in Song Keep",
      "A complete personalized song",
      "Songwriter's Touch™",
      "A QR code to the song"
    ]));
    expect(individualSongPlans.flatMap((plan) => plan.benefits).join(" ")).not.toMatch(/Song Card|Lyric image|3–5-minute/);
    expect(individualSongAddOns.map((addOn) => [addOn.name, addOn.priceCents])).toEqual([
      ["Additional revision", 500],
      ["Spoken dedication introduction", 500],
      ["Lyric PDF and QR keepsake", 500],
      ["Image-to-song / lyric video", 1_000],
      ["Rush delivery", 1_000]
    ]);
    const account = readFileSync("components/create-account-route.tsx", "utf8");
    expect(account).toContain("getIndividualSongPlan");
    expect(account).toContain("accessOnly || Boolean(personalPlan)");
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
