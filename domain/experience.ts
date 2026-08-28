import type { ConsentScope } from "./consent";

export const experienceOfferingIds = [
  "single-song-group-event",
  "honor-a-life-song-experience"
] as const;

export type ExperienceOfferingId = (typeof experienceOfferingIds)[number];
export type ExperienceTemplateKind = "group_event" | "full_program";
export type ExperienceParticipantMode = "group" | "named_roster";
export type ExperienceSectionId =
  | "overview"
  | "event_setup"
  | "participants"
  | "interviews"
  | "songs"
  | "shared_song"
  | "concert"
  | "materials";

export type ExperienceOffering = {
  id: ExperienceOfferingId;
  name: string;
  priceCents: number;
  currency: "USD";
  buyer: "organization";
  templateKind: ExperienceTemplateKind;
  participantMode: ExperienceParticipantMode;
  description: string;
  storyCapture: string;
  creativeOutput: string;
  presentation: string;
  postEvent: string;
  sections: readonly ExperienceSectionId[];
};

export const experienceOfferings: readonly ExperienceOffering[] = [
  {
    id: "single-song-group-event",
    name: "Single-Song Group Event",
    priceCents: 20_000,
    currency: "USD",
    buyer: "organization",
    templateKind: "group_event",
    participantMode: "group",
    description: "A facility or community group event built around shared stories, one shared song, and an event presentation.",
    storyCapture: "Shared group story capture",
    creativeOutput: "One shared song",
    presentation: "Event presentation",
    postEvent: "Shared song and approved event materials",
    sections: ["overview", "event_setup", "shared_song", "materials"]
  },
  {
    id: "honor-a-life-song-experience",
    name: "Honor a Life Song Experience",
    priceCents: 250_000,
    currency: "USD",
    buyer: "organization",
    templateKind: "full_program",
    participantMode: "named_roster",
    description: "A multi-touch organization experience with participant selection, interviews, multiple songs, and a follow-up concert.",
    storyCapture: "Several participant interviews",
    creativeOutput: "Multiple participant songs",
    presentation: "Follow-up concert",
    postEvent: "Songs, lyrics, concert video, and other approved materials",
    sections: ["overview", "participants", "interviews", "songs", "concert", "materials"]
  }
] as const;

const offeringAliases: Readonly<Record<string, ExperienceOfferingId>> = {
  "individual-song": "single-song-group-event",
  "individual-legacy-song": "single-song-group-event",
  "complete-honor-a-life-song-experience": "honor-a-life-song-experience"
};

export function normalizeExperienceOfferingId(value: string | null | undefined): ExperienceOfferingId | undefined {
  if (!value) return undefined;
  if (experienceOfferingIds.includes(value as ExperienceOfferingId)) return value as ExperienceOfferingId;
  return offeringAliases[value];
}

export function getExperienceOffering(id: ExperienceOfferingId | string | undefined): ExperienceOffering | undefined {
  const normalized = normalizeExperienceOfferingId(id);
  return experienceOfferings.find((offering) => offering.id === normalized);
}

export const experienceSectionLabels: Record<ExperienceSectionId, string> = {
  overview: "Overview",
  event_setup: "Event setup",
  participants: "Participants",
  interviews: "Interviews",
  songs: "Songs",
  shared_song: "Shared song",
  concert: "Concert",
  materials: "Event materials"
};

export const entitlementConsentScopes: Record<"participant" | "designated_family", readonly ConsentScope[]> = {
  participant: ["participation"],
  designated_family: ["designated_family_sharing"]
};
