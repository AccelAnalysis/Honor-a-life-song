/**
 * Individual consumer path. Group experiences stay on /begin and /services.
 * Prices and names come from the live individual plans. Do not invent another ladder.
 */

import {
  formatPlanPrice,
  getIndividualSongPlan,
  individualSongAddOns,
  individualSongPlans,
  type IndividualSongPlanId
} from "./individual-song-plans";
import { notesAreReadyForSuggestions, sketchVersesFromNotes } from "./songwriting";

export const consumerDraftStorageKey = "songkeep-consumer-draft";

export const consumerFlowSteps = [
  "welcome",
  "occasion",
  "about",
  "sound",
  "mode",
  "with-me",
  "songwriter",
  "preview",
  "pricing",
  "addons",
  "delivery"
] as const;

export type ConsumerFlowStep = (typeof consumerFlowSteps)[number];

export const recipientChoices = [
  { id: "someone-i-love", label: "Someone I love" },
  { id: "myself", label: "Myself" },
  { id: "group", label: "A group" }
] as const;

export type RecipientId = (typeof recipientChoices)[number]["id"];

export const occasionChoices = [
  { id: "birthday", label: "Birthday" },
  { id: "anniversary", label: "Anniversary or love" },
  { id: "graduation", label: "Graduation" },
  { id: "parents-day", label: "Mother's or Father's Day" },
  { id: "memorial", label: "Memorial or celebration of life" },
  { id: "retirement", label: "Retirement or milestone" },
  { id: "new-baby", label: "New baby" },
  { id: "holiday", label: "Holiday" },
  { id: "just-because", label: "Just because" },
  { id: "other", label: "Other" }
] as const;

export type OccasionId = (typeof occasionChoices)[number]["id"];

export const feelingChoices = [
  { id: "joyful", label: "Joyful" },
  { id: "tender", label: "Tender" },
  { id: "inspiring", label: "Inspiring" },
  { id: "funny", label: "Funny" },
  { id: "reflective", label: "Reflective" },
  { id: "celebratory", label: "Celebratory" }
] as const;

export type FeelingId = (typeof feelingChoices)[number]["id"];

export const genreChoices = [
  { id: "country", label: "Country" },
  { id: "pop", label: "Pop" },
  { id: "folk", label: "Folk / acoustic" },
  { id: "gospel", label: "Gospel" },
  { id: "rock", label: "Rock" },
  { id: "rnb", label: "R&B / soul" },
  { id: "childrens", label: "Children's" },
  { id: "traditional", label: "Traditional" }
] as const;

export type GenreId = (typeof genreChoices)[number]["id"];

export const creationModes = [
  {
    id: "for-me",
    title: "Create it for me",
    detail: "We shape a first draft from what you shared."
  },
  {
    id: "with-me",
    title: "Create it with me",
    detail: "Pick the chorus and the memories that belong."
  },
  {
    id: "songwriter",
    title: "Songwriter's Touch",
    detail: "A songwriter reviews the song and strengthens what matters most.",
    emphasized: true
  }
] as const;

export type CreationModeId = (typeof creationModes)[number]["id"];

export const songwriterTouchChoices = [
  { id: "strengthen-chorus", label: "Strengthen the chorus" },
  { id: "favorite-memory", label: "Work the favorite memory in" },
  { id: "improve-hook", label: "Improve the hook and title" },
  { id: "choose-help", label: "Choose what needs help" }
] as const;

export type SongwriterTouchId = (typeof songwriterTouchChoices)[number]["id"];

/** Existing group entry points. This flow does not redefine them. */
export const groupExperienceLinks = [
  { href: "/begin", label: "Plan a group experience" },
  { href: "/services", label: "See group services" }
] as const;

export type PreviewLine = {
  id: string;
  role: "verse" | "chorus";
  text: string;
  locked: boolean;
};

export type ConsumerDraft = {
  recipient: RecipientId | null;
  occasion: OccasionId | null;
  subjectName: string;
  relationship: string;
  threeWords: string;
  favoriteMemory: string;
  alwaysSay: string;
  somethingElse: string;
  voiceStory: string;
  feeling: FeelingId | null;
  genre: GenreId | null;
  fitStory: boolean;
  mode: CreationModeId | null;
  chorusLine: string;
  chorusOffset: number;
  customChorusLines: string[];
  includedMemoryIds: string[];
  songwriterTouches: SongwriterTouchId[];
  lines: PreviewLine[];
  activeLineId: string | null;
  surpriseSalt: number;
  loved: boolean;
  planId: IndividualSongPlanId | null;
  addOnIds: string[];
};

export type ConsumerSession = {
  step: ConsumerFlowStep;
  draft: ConsumerDraft;
};

export type AboutQuestions = {
  heading: string;
  name: string;
  relationship: string;
  words: string;
  memory: string;
  phrase: string;
  extra: string;
};

export type MemoryOption = {
  id: string;
  label: string;
  text: string;
};

export type ConsumerPlanCard = {
  id: IndividualSongPlanId;
  name: string;
  priceCents: number;
  priceLabel: string;
  benefits: readonly string[];
  featured: boolean;
  badge: string | null;
};

const individualRecipients: readonly RecipientId[] = ["someone-i-love", "myself"];

export function emptyConsumerDraft(): ConsumerDraft {
  return {
    recipient: null,
    occasion: null,
    subjectName: "",
    relationship: "",
    threeWords: "",
    favoriteMemory: "",
    alwaysSay: "",
    somethingElse: "",
    voiceStory: "",
    feeling: null,
    genre: null,
    fitStory: false,
    mode: null,
    chorusLine: "",
    chorusOffset: 0,
    customChorusLines: [],
    includedMemoryIds: [],
    songwriterTouches: [],
    lines: [],
    activeLineId: null,
    surpriseSalt: 0,
    loved: false,
    planId: null,
    addOnIds: []
  };
}

export function emptyConsumerSession(): ConsumerSession {
  return { step: "welcome", draft: emptyConsumerDraft() };
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function labelFor<T extends string>(choices: readonly { id: T; label: string }[], id: T | null) {
  return choices.find((choice) => choice.id === id)?.label ?? "";
}

export function occasionLabel(id: OccasionId | null) {
  return labelFor(occasionChoices, id);
}

export function feelingLabel(id: FeelingId | null) {
  return labelFor(feelingChoices, id);
}

export function isIndividualRecipient(recipient: RecipientId | null) {
  return recipient !== null && individualRecipients.includes(recipient);
}

export function aboutQuestions(draft: Pick<ConsumerDraft, "occasion" | "recipient">): AboutQuestions {
  const self = draft.recipient === "myself";
  const them = self ? "you" : "them";
  const memoryByOccasion: Record<OccasionId, string> = {
    birthday: self ? "What birthday memory should the song keep?" : "What birthday memory do you still talk about?",
    anniversary: self ? "What moment should this love song keep?" : "What moment still feels like the two of you?",
    graduation: self ? "What did you carry across this finish line?" : "What did they carry to this day?",
    "parents-day": self ? "What do you hope they remember about you?" : "What have they given that a card cannot hold?",
    memorial: self ? "What should people keep singing about you?" : "What memory should this celebration of life hold?",
    retirement: self ? "What chapter are you ready to honor?" : "What did they build that people still feel?",
    "new-baby": self ? "What should this child know someday?" : "What do you hope they always know?",
    holiday: self ? "Which holiday moment feels like home?" : "Which holiday moment feels like them?",
    "just-because": "What ordinary moment is actually the song?",
    other: self ? "What should this song remember about you?" : "What should this song remember about them?"
  };
  const phraseByOccasion: Record<OccasionId, string> = {
    birthday: self ? "What do people say when they talk about you?" : "What do they say when the candles come out?",
    memorial: self ? "What sentence should people keep?" : "What did they always say?",
    "new-baby": "What words do you want waiting for them?",
    anniversary: "What do you say when you mean I love you?",
    graduation: "What line belongs on this milestone?",
    "parents-day": self ? "What do you tell them, again and again?" : "What do they always tell you?",
    retirement: "What will people repeat about this chapter?",
    holiday: "What gets said every year?",
    "just-because": self ? "What do you catch yourself saying?" : "What do they always say?",
    other: self ? "What do you want the chorus to repeat?" : "What do they always say?"
  };
  const occasion = draft.occasion;
  return {
    heading: self ? "About you" : "About them",
    name: self ? "Your name" : "Their name",
    relationship: self ? "How should the song speak about you?" : "How are they connected to you?",
    words: self ? "Three words for you" : `Three words for ${them}`,
    memory: occasion ? memoryByOccasion[occasion] : self ? "What is a favorite memory?" : "What is a favorite memory of them?",
    phrase: occasion ? phraseByOccasion[occasion] : self ? "Something you always say" : "Something they always say",
    extra: "Anything else the song should hold"
  };
}

export function hasStory(draft: Pick<ConsumerDraft, "subjectName" | "favoriteMemory" | "voiceStory" | "somethingElse" | "alwaysSay">) {
  return [draft.subjectName, draft.favoriteMemory, draft.voiceStory, draft.somethingElse, draft.alwaysSay].some((value) => clean(value).length > 0);
}

export function storyNotes(draft: ConsumerDraft) {
  const name = clean(draft.subjectName) || (draft.recipient === "myself" ? "I" : "They");
  const parts = [
    draft.relationship ? `${name} is ${clean(draft.relationship)}.` : `${name} is the heart of this song.`,
    draft.threeWords ? `Three words come first: ${clean(draft.threeWords)}.` : "",
    draft.favoriteMemory ? `A favorite memory: ${clean(draft.favoriteMemory)}.` : "",
    draft.alwaysSay ? `A line they always say: ${clean(draft.alwaysSay)}.` : "",
    draft.somethingElse ? clean(draft.somethingElse) : "",
    draft.voiceStory ? clean(draft.voiceStory) : "",
    draft.occasion ? `The occasion is ${occasionLabel(draft.occasion).toLowerCase()}.` : "",
    draft.feeling ? `The feeling is ${feelingLabel(draft.feeling).toLowerCase()}.` : ""
  ];
  return parts.filter((part) => part.length > 0).join(" ");
}

export function memoryOptions(draft: ConsumerDraft): MemoryOption[] {
  const fields: MemoryOption[] = [
    { id: "memory", label: "Favorite memory", text: clean(draft.favoriteMemory) },
    { id: "phrase", label: draft.recipient === "myself" ? "Something you always say" : "Something they always say", text: clean(draft.alwaysSay) },
    { id: "words", label: "Three words", text: clean(draft.threeWords) },
    { id: "extra", label: "Something else", text: clean(draft.somethingElse) },
    { id: "voice", label: "Spoken story", text: clean(draft.voiceStory) }
  ];
  return fields.filter((field) => field.text.length > 0);
}

function clip(value: string, max = 110) {
  const text = clean(value).replace(/[.!?]+$/g, "");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function chorusPool(draft: ConsumerDraft) {
  const name = clean(draft.subjectName) || (draft.recipient === "myself" ? "I" : "you");
  const words = clean(draft.threeWords)
    .split(/[,;/]| and /i)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
  const phrase = clip(draft.alwaysSay);
  const memory = clip(draft.favoriteMemory);
  const extra = clip(draft.somethingElse || draft.voiceStory);
  const occasion = draft.occasion ? occasionLabel(draft.occasion).toLowerCase() : "this day";
  const feeling = draft.feeling ? feelingLabel(draft.feeling).toLowerCase() : "close";
  const lines = [
    phrase,
    words.length ? `${name} is ${words.slice(0, 3).join(", ")}` : "",
    memory ? `Hold onto ${memory.charAt(0).toLowerCase()}${memory.slice(1)}` : "",
    `This is a ${feeling} song for ${occasion}`,
    extra,
    words[0] ? `Keep the ${words[0].toLowerCase()} part close` : "",
    draft.recipient === "myself" ? "This is the part I want kept" : `${name}, this is the part we keep`,
    memory ? `Say it back: ${memory}` : ""
  ].map((line) => clean(line)).filter((line, index, all) => line.length > 0 && all.indexOf(line) === index);

  const notes = storyNotes(draft);
  if (notesAreReadyForSuggestions(notes)) {
    for (const verse of sketchVersesFromNotes(notes).verses) {
      for (const line of verse.text.split("\n")) {
        const trimmed = clean(line);
        if (trimmed && !lines.includes(trimmed)) lines.push(trimmed);
      }
    }
  }

  while (lines.length < 6) {
    lines.push(`A line for ${name}, kept ${lines.length + 1}`);
  }
  return lines;
}

export function chorusChoices(draft: ConsumerDraft, offset = draft.chorusOffset) {
  const pool = [...draft.customChorusLines.map((line) => clean(line)).filter(Boolean), ...chorusPool(draft)];
  const unique = pool.filter((line, index) => pool.indexOf(line) === index);
  const start = ((offset % unique.length) + unique.length) % unique.length;
  return [0, 1, 2].map((step) => unique[(start + step) % unique.length]);
}

export function withCustomChorus(draft: ConsumerDraft, line: string): ConsumerDraft {
  const text = clean(line);
  if (!text) return draft;
  const customChorusLines = draft.customChorusLines.includes(text) ? draft.customChorusLines : [...draft.customChorusLines, text];
  return { ...draft, customChorusLines, chorusLine: text };
}

function fallbackVerses(draft: ConsumerDraft) {
  const name = clean(draft.subjectName) || "you";
  const chorus = clean(draft.chorusLine) || chorusChoices(draft, 0)[0];
  const memory = clean(draft.favoriteMemory) || clean(draft.voiceStory) || `This song is for ${name}.`;
  const second = clean(draft.somethingElse) || clean(draft.alwaysSay) || `Keep ${name} close.`;
  return [
    { label: "Verse 1", text: memory },
    { label: "Chorus", text: chorus },
    { label: "Verse 2", text: second }
  ];
}

export function buildPreviewLines(draft: ConsumerDraft): PreviewLine[] {
  const notes = storyNotes(draft);
  const sketched = notesAreReadyForSuggestions(notes) ? sketchVersesFromNotes(notes).verses : fallbackVerses(draft);
  const selected = memoryOptions(draft).filter((option) => draft.includedMemoryIds.includes(option.id));
  const chorus = clean(draft.chorusLine);
  return sketched.map((verse, index) => {
    const role = /chorus/i.test(verse.label) ? "chorus" as const : "verse" as const;
    let text = verse.text.trim();
    if (role === "chorus" && chorus) text = chorus;
    if (role === "verse" && selected[index]) text = selected[index].text;
    return { id: `${role}-${index + 1}`, role, text, locked: false };
  });
}

export function previewHasLyric(draft: ConsumerDraft) {
  return draft.lines.some((line) => line.text.trim().length > 0);
}

export function lyricText(lines: readonly PreviewLine[]) {
  return lines
    .filter((line) => line.text.trim().length > 0)
    .map((line) => `${line.role === "chorus" ? "Chorus" : "Verse"}\n${line.text.trim()}`)
    .join("\n\n");
}

export function setLineText(lines: readonly PreviewLine[], id: string, text: string): PreviewLine[] {
  return lines.map((line) => (line.id === id && !line.locked ? { ...line, text } : line));
}

export function toggleLineLock(lines: readonly PreviewLine[], id: string): PreviewLine[] {
  return lines.map((line) => (line.id === id ? { ...line, locked: !line.locked } : line));
}

/** Regenerated copy replaces the open line in the same place. A kept line stays word for word. */
export function surpriseLines(lines: readonly PreviewLine[], replacements: readonly string[]): PreviewLine[] {
  return lines.map((line, index) => {
    if (line.locked) return { ...line };
    const text = replacements[index]?.trim();
    return text ? { ...line, text } : { ...line };
  });
}

export function helpWriteLine(lines: readonly PreviewLine[], id: string, suggestion: string): PreviewLine[] {
  const text = suggestion.trim();
  if (!text) return lines.map((line) => ({ ...line }));
  return lines.map((line) => (line.id === id && !line.locked ? { ...line, text } : { ...line }));
}

export function surpriseReplacements(draft: ConsumerDraft, salt: number) {
  const pool = chorusPool(draft);
  const count = Math.max(draft.lines.length, 1);
  return Array.from({ length: count }, (_, index) => pool[(salt + index) % pool.length] ?? "");
}

export function suggestLine(draft: ConsumerDraft, line: PreviewLine, salt: number) {
  const pool = chorusPool(draft);
  const current = line.text.trim();
  for (let step = 0; step < pool.length; step += 1) {
    const candidate = pool[(salt + step) % pool.length];
    if (candidate && candidate !== current) return candidate;
  }
  return current;
}

export function canContinue(step: ConsumerFlowStep, draft: ConsumerDraft) {
  switch (step) {
    case "welcome":
      return isIndividualRecipient(draft.recipient);
    case "occasion":
      return draft.occasion !== null;
    case "about":
      return hasStory(draft);
    case "sound":
      return draft.feeling !== null && (draft.genre !== null || draft.fitStory);
    case "mode":
      return draft.mode !== null;
    case "with-me":
      return clean(draft.chorusLine).length > 0;
    case "songwriter":
      return draft.songwriterTouches.length > 0;
    case "preview":
      return draft.loved && previewHasLyric(draft);
    case "pricing":
      return draft.planId !== null;
    case "addons":
    case "delivery":
      return true;
    default:
      return false;
  }
}

export function advanceConsumerFlow(step: ConsumerFlowStep, draft: ConsumerDraft): ConsumerFlowStep {
  if (!canContinue(step, draft)) return step;
  switch (step) {
    case "welcome":
      return "occasion";
    case "occasion":
      return "about";
    case "about":
      return "sound";
    case "sound":
      return "mode";
    case "mode":
      if (draft.mode === "with-me") return "with-me";
      if (draft.mode === "songwriter") return "songwriter";
      return "preview";
    case "with-me":
    case "songwriter":
      return "preview";
    case "preview":
      return "pricing";
    case "pricing":
      return "addons";
    case "addons":
      return "delivery";
    case "delivery":
      return "delivery";
    default:
      return step;
  }
}

export function retreatConsumerFlow(step: ConsumerFlowStep, draft: ConsumerDraft): ConsumerFlowStep {
  switch (step) {
    case "occasion":
      return "welcome";
    case "about":
      return "occasion";
    case "sound":
      return "about";
    case "mode":
      return "sound";
    case "with-me":
    case "songwriter":
      return "mode";
    case "preview":
      if (draft.mode === "with-me") return "with-me";
      if (draft.mode === "songwriter") return "songwriter";
      return "mode";
    case "pricing":
      return "preview";
    case "addons":
      return "pricing";
    case "delivery":
      return "addons";
    default:
      return "welcome";
  }
}

export function walkConsumerFlow(draft: ConsumerDraft): ConsumerFlowStep[] {
  const seen: ConsumerFlowStep[] = ["welcome"];
  let step: ConsumerFlowStep = "welcome";
  for (let guard = 0; guard < consumerFlowSteps.length; guard += 1) {
    const next = advanceConsumerFlow(step, draft);
    if (next === step) break;
    seen.push(next);
    step = next;
    if (step === "delivery") break;
  }
  return seen;
}

export function withPreviewLines(draft: ConsumerDraft): ConsumerDraft {
  if (draft.lines.length > 0) return draft;
  const lines = buildPreviewLines(draft);
  return { ...draft, lines, activeLineId: lines.find((line) => !line.locked)?.id ?? null };
}

/** Songwriter's Touch maps onto Spotlight, which already includes a songwriter personalization touch. */
export function suggestedPlanId(mode: CreationModeId | null): IndividualSongPlanId {
  return mode === "songwriter" ? "spotlight" : "cheers";
}

export function consumerPlanCards(): ConsumerPlanCard[] {
  return individualSongPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceCents: plan.priceCents,
    priceLabel: formatPlanPrice(plan.priceCents),
    benefits: plan.benefits,
    featured: plan.id === "spotlight",
    badge: plan.id === "spotlight" ? "Most popular" : null
  }));
}

export function consumerAddOnCards() {
  return individualSongAddOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    priceCents: addOn.priceCents,
    priceLabel: formatPlanPrice(addOn.priceCents)
  }));
}

export function songwriterTouchNote() {
  const cheers = getIndividualSongPlan("cheers");
  const spotlight = getIndividualSongPlan("spotlight");
  const encore = getIndividualSongPlan("encore");
  if (!cheers || !spotlight || !encore) return "";
  return `A songwriter reviews what you choose. ${spotlight.name} includes a songwriter personalization touch (${formatPlanPrice(spotlight.priceCents)}). ${encore.name} includes that touch, a revision, and a QR song card (${formatPlanPrice(encore.priceCents)}). ${cheers.name} includes a songwriter quality check (${formatPlanPrice(cheers.priceCents)}).`;
}

export function qrCardIncluded(draft: Pick<ConsumerDraft, "planId" | "addOnIds">) {
  return draft.planId === "encore" || draft.addOnIds.includes("lyric-pdf");
}

export function addOnsAreOffered(step: ConsumerFlowStep, loved: boolean) {
  return loved && (step === "addons" || step === "delivery");
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? value as T : null;
}

function asString(value: unknown, max = 4000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function asStringList(value: unknown, max = 12) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, max).map((item) => item.slice(0, 500));
}

function asLines(value: unknown): PreviewLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Partial<PreviewLine>;
    const role = record.role === "chorus" ? "chorus" : record.role === "verse" ? "verse" : null;
    if (!role) return [];
    return [{
      id: asString(record.id, 40) || `${role}-${index + 1}`,
      role,
      text: asString(record.text, 2000),
      locked: record.locked === true
    }];
  });
}

export function readConsumerSession(raw: string | null): ConsumerSession {
  if (!raw) return emptyConsumerSession();
  try {
    const parsed = JSON.parse(raw) as { step?: unknown; draft?: Partial<ConsumerDraft> };
    const step = asEnum(parsed.step, consumerFlowSteps) ?? "welcome";
    const incoming = parsed.draft ?? {};
    const base = emptyConsumerDraft();
    const planId = asEnum(incoming.planId, individualSongPlans.map((plan) => plan.id));
    const addOnIds = asStringList(incoming.addOnIds).filter((id) => individualSongAddOns.some((addOn) => addOn.id === id));
    const draft: ConsumerDraft = {
      ...base,
      recipient: asEnum(incoming.recipient, recipientChoices.map((choice) => choice.id)),
      occasion: asEnum(incoming.occasion, occasionChoices.map((choice) => choice.id)),
      subjectName: asString(incoming.subjectName, 120),
      relationship: asString(incoming.relationship, 160),
      threeWords: asString(incoming.threeWords, 160),
      favoriteMemory: asString(incoming.favoriteMemory),
      alwaysSay: asString(incoming.alwaysSay, 400),
      somethingElse: asString(incoming.somethingElse),
      voiceStory: asString(incoming.voiceStory),
      feeling: asEnum(incoming.feeling, feelingChoices.map((choice) => choice.id)),
      genre: asEnum(incoming.genre, genreChoices.map((choice) => choice.id)),
      fitStory: incoming.fitStory === true,
      mode: asEnum(incoming.mode, creationModes.map((mode) => mode.id)),
      chorusLine: asString(incoming.chorusLine, 400),
      chorusOffset: Number.isInteger(incoming.chorusOffset) && (incoming.chorusOffset as number) >= 0 ? incoming.chorusOffset as number : 0,
      customChorusLines: asStringList(incoming.customChorusLines),
      includedMemoryIds: asStringList(incoming.includedMemoryIds),
      songwriterTouches: asStringList(incoming.songwriterTouches).filter((id): id is SongwriterTouchId => songwriterTouchChoices.some((choice) => choice.id === id)),
      lines: asLines(incoming.lines),
      activeLineId: asString(incoming.activeLineId, 40) || null,
      surpriseSalt: Number.isInteger(incoming.surpriseSalt) && (incoming.surpriseSalt as number) >= 0 ? incoming.surpriseSalt as number : 0,
      loved: incoming.loved === true,
      planId,
      addOnIds
    };
    return { step, draft };
  } catch {
    return emptyConsumerSession();
  }
}
