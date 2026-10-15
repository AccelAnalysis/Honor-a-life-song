import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aboutQuestions,
  addOnsAreOffered,
  advanceConsumerFlow,
  chorusChoices,
  consumerAddOnCards,
  consumerPlanCards,
  creationModes,
  emptyConsumerDraft,
  groupAccountHref,
  groupExperienceLinks,
  helpWriteLine,
  occasionAlreadyChosen,
  readConsumerSession,
  retreatConsumerFlow,
  setLineText,
  startChoices,
  surpriseLines,
  walkConsumerFlow,
  type ConsumerDraft,
  type PreviewLine
} from "../domain/consumer-song-flow";
import { formatPlanPrice, individualSongAddOns, individualSongPlans } from "../domain/individual-song-plans";

function readyDraft(overrides: Partial<ConsumerDraft> = {}): ConsumerDraft {
  return {
    ...emptyConsumerDraft(),
    recipient: "occasion",
    occasion: "birthday",
    subjectName: "Ruth",
    relationship: "grandmother",
    threeWords: "kind, steady, funny",
    favoriteMemory: "She taught piano in the church basement for forty years.",
    alwaysSay: "Save room for dessert",
    somethingElse: "The porch light stayed on.",
    feeling: "tender",
    genre: "gospel",
    mode: "with-me",
    chorusLine: "Save room for dessert",
    songwriterTouches: ["strengthen-chorus"],
    lines: [
      { id: "verse-1", role: "verse", text: "She taught piano in the church basement.", locked: false },
      { id: "chorus-1", role: "chorus", text: "Save room for dessert", locked: false }
    ],
    loved: true,
    planId: "song-keep-music",
    ...overrides
  };
}

describe("consumer song flow", () => {
  it("walks an individual song from welcome to delivery", () => {
    expect(creationModes.map((mode) => mode.id)).toEqual(["for-me", "with-me"]);
    expect(walkConsumerFlow(readyDraft({ mode: "with-me" }))).toEqual([
      "listen",
      "welcome",
      "story",
      "about",
      "sound",
      "mode",
      "with-me",
      "preview",
      "pricing",
      "addons",
      "delivery"
    ]);
    expect(occasionAlreadyChosen(readyDraft())).toBe(true);
    expect(walkConsumerFlow(readyDraft({ recipient: "myself", mode: "for-me" }))).toEqual([
      "listen",
      "welcome",
      "story",
      "occasion",
      "about",
      "sound",
      "mode",
      "preview",
      "pricing",
      "addons",
      "delivery"
    ]);
  });

  it("requires a write-in when the occasion is other", () => {
    const blank = readyDraft({ recipient: "occasion", occasion: "other", occasionOther: "  " });
    const named = readyDraft({ recipient: "occasion", occasion: "other", occasionOther: "House concert" });
    expect(advanceConsumerFlow("welcome", blank)).toBe("welcome");
    expect(advanceConsumerFlow("welcome", named)).toBe("story");
    expect(advanceConsumerFlow("occasion", readyDraft({ recipient: "myself", occasion: "other", occasionOther: "" }))).toBe("occasion");
    expect(advanceConsumerFlow("occasion", readyDraft({ recipient: "myself", occasion: "other", occasionOther: "Reunion" }))).toBe("about");
  });

  it("keeps a group choice on the existing begin and services paths", () => {
    const draft = readyDraft({ recipient: "group" });
    expect(advanceConsumerFlow("welcome", draft)).toBe("welcome");
    expect(walkConsumerFlow(draft)).toEqual(["listen", "welcome"]);
    expect(groupExperienceLinks.map((link) => link.href)).toEqual([groupAccountHref(), "/services"]);
    expect(groupAccountHref("honor-a-life-song-experience")).toBe("/create-account?next=%2Fbegin%3Foffering%3Dhonor-a-life-song-experience");
  });

  it("returns to the creation branch that was chosen", () => {
    expect(retreatConsumerFlow("preview", readyDraft({ mode: "with-me" }))).toBe("with-me");
    expect(retreatConsumerFlow("about", readyDraft())).toBe("story");
    expect(retreatConsumerFlow("about", readyDraft({ recipient: "myself" }))).toBe("occasion");
    expect(retreatConsumerFlow("preview", readyDraft({ mode: "for-me" }))).toBe("mode");
    expect(retreatConsumerFlow("pricing", readyDraft())).toBe("preview");
    expect(retreatConsumerFlow("delivery", readyDraft())).toBe("addons");
  });

  it("does not offer add-ons until the song is loved and the plan is chosen", () => {
    expect(advanceConsumerFlow("preview", readyDraft({ loved: false }))).toBe("preview");
    expect(advanceConsumerFlow("preview", readyDraft({ loved: true }))).toBe("pricing");
    expect(addOnsAreOffered("preview", true)).toBe(false);
    expect(addOnsAreOffered("pricing", true)).toBe(false);
    expect(addOnsAreOffered("addons", false)).toBe(false);
    expect(addOnsAreOffered("addons", true)).toBe(true);
  });

  it("changes later questions when the occasion changes", () => {
    const birthday = aboutQuestions({ recipient: "occasion", occasion: "birthday" });
    const memorial = aboutQuestions({ recipient: "occasion", occasion: "memorial" });
    const self = aboutQuestions({ recipient: "myself", occasion: "birthday" });
    expect(birthday.memory).not.toBe(memorial.memory);
    expect(birthday.phrase).not.toBe(memorial.phrase);
    expect(self.name).toBe("Your name");
    expect(birthday.name).toBe("Their name");
    expect(birthday.extra).toBe("Anything else you would like to tell us for this song?");
    expect(birthday.appearance).toContain("look or dress");
    expect(birthday.favoriteThing).toContain("favorite thing");
    expect(birthday.standout).toContain("stands out");
  });

  it("offers three chorus lines, then three more", () => {
    const draft = readyDraft();
    const first = chorusChoices(draft, 0);
    const more = chorusChoices(draft, 3);
    expect(first).toHaveLength(3);
    expect(more).toHaveLength(3);
    expect(first.join("|")).not.toBe(more.join("|"));
    expect(first.some((line) => draft.favoriteMemory.includes(line) || line.toLowerCase().includes("dessert") || line.toLowerCase().includes("ruth"))).toBe(true);
  });

  it("keeps a locked line when the draft is regenerated", () => {
    const lines: PreviewLine[] = [
      { id: "verse-1", role: "verse", text: "The porch light stayed on.", locked: true },
      { id: "chorus-1", role: "chorus", text: "Old chorus", locked: false }
    ];
    const surprised = surpriseLines(lines, ["A brand new verse", "A brand new chorus"]);
    expect(surprised[0]).toEqual(lines[0]);
    expect(surprised[1].text).toBe("A brand new chorus");
    expect(surprised[1].locked).toBe(false);

    const helped = helpWriteLine(surprised, "verse-1", "This should not land");
    expect(helped[0].text).toBe("The porch light stayed on.");
    expect(setLineText(helped, "verse-1", "Typed over a kept line")[0].text).toBe("The porch light stayed on.");
    expect(helpWriteLine(surprised, "chorus-1", "Help the open line")[1].text).toBe("Help the open line");
  });

  it("prices the consumer cards from the Song Keep ladder", () => {
    expect(consumerPlanCards().map((plan) => [plan.name, plan.priceCents, plan.priceLabel, plan.featured, plan.badge])).toEqual([
      ["Song Keep", 1_900, "$19", false, null],
      ["Song Keep + Music", 3_900, "$39", true, "Most popular"],
      ["Song Keep Signature", 5_900, "$59", false, null]
    ]);
    expect(consumerPlanCards().map((plan) => plan.benefits)).toEqual(individualSongPlans.map((plan) => plan.benefits));
    expect(individualSongPlans.find((plan) => plan.id === "song-keep")?.benefits.join(" ")).not.toMatch(/Song Card|Lyric image/i);
    expect(individualSongPlans.find((plan) => plan.id === "song-keep-signature")?.benefits.join(" ")).toContain("Songwriter's Touch™");
    expect(individualSongPlans.find((plan) => plan.id === "song-keep-signature")?.benefits.join(" ")).toContain("Tina personally reviews");
    expect(individualSongPlans.flatMap((plan) => plan.benefits).join(" ")).not.toMatch(/3–5-minute voice message/);
    expect(consumerAddOnCards().map((addOn) => [addOn.name, addOn.priceCents])).toEqual(
      individualSongAddOns.map((addOn) => [addOn.name, addOn.priceCents])
    );
    expect(formatPlanPrice(1_900)).toBe("$19");
    expect(formatPlanPrice(3_900)).toBe("$39");
    expect(formatPlanPrice(5_900)).toBe("$59");
  });

  it("restores a saved draft and drops a broken one", () => {
    const saved = readyDraft({ lines: [{ id: "chorus-1", role: "chorus", text: "Stay", locked: true }] });
    const session = readConsumerSession(JSON.stringify({ step: "preview", draft: saved }));
    expect(session.step).toBe("preview");
    expect(session.draft.subjectName).toBe("Ruth");
    expect(session.draft.lines[0].locked).toBe(true);
    expect(readConsumerSession("{")).toEqual({ step: "listen", draft: emptyConsumerDraft() });
    expect(readConsumerSession(JSON.stringify({ step: "community", draft: { planId: "signature" } })).draft.planId).toBeNull();
    expect(readConsumerSession(JSON.stringify({ step: "songwriter", draft: { recipient: "someone-i-love", planId: "cheers" } }))).toMatchObject({
      step: "preview",
      draft: { recipient: "occasion", planId: null }
    });
  });

  it("keeps consumer copy free of a full personal name and shows both ways in", () => {
    const source = [
      "domain/consumer-song-flow.ts",
      "components/consumer-song-flow.tsx",
      "app/create/page.tsx",
      "app/page.tsx"
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(source).not.toMatch(/Micula|Accel Analysis/i);
    expect(source).not.toContain("experienceOfferings");
    expect(source).toContain("Keep this line");
    expect(source).toContain("consumerPlanCards");
    expect(source).toContain("Anything else you would like to tell us for this song?");
    expect(source).not.toContain("Tell us your story");
    expect(source).not.toContain('id: "songwriter"');
    expect(source).toContain('"/create"');
    expect(source).toContain('href="/try"');
    const home = readFileSync("app/page.tsx", "utf8");
    const heroStart = home.indexOf("consumerHeroActions");
    const hero = home.slice(heroStart, home.indexOf("</div>", heroStart));
    expect(hero.indexOf('href="/start"')).toBeGreaterThan(-1);
    expect(hero.indexOf('href="/start"')).toBeLessThan(hero.indexOf('href="/services"'));
    expect(startChoices.map((choice) => [choice.id, choice.href])).toEqual([
      ["individual", "/create"],
      ["groups", "/create-account?next=%2Fbegin"]
    ]);
    const startPage = readFileSync("app/start/page.tsx", "utf8");
    expect(startPage).toContain("startChoices");
    expect(startPage).not.toMatch(/\$\d|Tina|Micula/);
    expect(readFileSync("app/(booking)/begin/page.tsx", "utf8")).toContain("BookingRoute");
    expect(readFileSync("components/consumer-song-flow.tsx", "utf8")).toContain("groupExperienceLinks");
    const services = readFileSync("app/(public)/services/page.tsx", "utf8");
    expect(services).toContain("experienceOfferings");
    expect(services).toContain("individualSongPlans");
    expect(services).toContain('href="/create"');
    expect(services).toContain("groupAccountHref");
    expect(services.indexOf("individualSongPlans")).toBeLessThan(services.indexOf("experienceOfferings.map"));
    expect(readFileSync("components/song-plan-cards.tsx", "utf8")).toContain('useState<PlanAudience>("individual")');
  });
});
