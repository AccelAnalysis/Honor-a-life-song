import type { ConsentScope } from "./consent";

export const experienceOfferingIds = [
  "single-song-group-event",
  "honor-a-life-song-experience",
  "songkeep-legacy-album"
] as const;

export type ExperienceOfferingId = (typeof experienceOfferingIds)[number];
export type ExperienceTemplateKind = "group_event" | "full_program" | "legacy_album";
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
  shortName: string;
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
  bestFor: string;
  requiresConsultation: boolean;
  sections: readonly ExperienceSectionId[];
};

export const experienceOfferings: readonly ExperienceOffering[] = [
  {
    id: "single-song-group-event",
    name: "Single-Song Group Event",
    shortName: "Group Event",
    priceCents: 20_000,
    currency: "USD",
    buyer: "organization",
    templateKind: "group_event",
    participantMode: "group",
    description: "A facility or community group event built around shared stories, one shared song, and an event presentation.",
    storyCapture: "Shared group story conversation",
    creativeOutput: "One original shared song",
    presentation: "Event presentation",
    postEvent: "Shared song and approved event materials",
    bestFor: "A meaningful group activity or first SongKeep experience",
    requiresConsultation: false,
    sections: ["overview", "event_setup", "shared_song", "materials"]
  },
  {
    id: "honor-a-life-song-experience",
    name: "Honor a Life Song Experience",
    shortName: "Full Experience",
    priceCents: 250_000,
    currency: "USD",
    buyer: "organization",
    templateKind: "full_program",
    participantMode: "named_roster",
    description: "A multi-touch organization experience with participant selection, interviews, multiple songs, and a follow-up concert.",
    storyCapture: "Several participant interviews and family contributions",
    creativeOutput: "Multiple original participant songs",
    presentation: "Follow-up concert",
    postEvent: "Songs, lyrics, approved video, photos, reports, and keepsakes",
    bestFor: "Communities seeking a deeper participant and family experience",
    requiresConsultation: false,
    sections: ["overview", "participants", "interviews", "songs", "concert", "materials"]
  },
  {
    id: "songkeep-legacy-album",
    name: "SongKeep Legacy Album",
    shortName: "Legacy Album",
    priceCents: 600_000,
    currency: "USD",
    buyer: "organization",
    templateKind: "legacy_album",
    participantMode: "named_roster",
    description: "A complete musical life story developed as a cohesive multi-track album with creative direction, release artwork, and digital distribution preparation.",
    storyCapture: "Extended interviews, family contributions, and life-story mapping",
    creativeOutput: "A professionally curated multi-track legacy album",
    presentation: "Private listening experience or release event",
    postEvent: "Album masters, lyrics, artwork, release page, and approved streaming links",
    bestFor: "A person, family, couple, organization, or community with a story larger than one song",
    requiresConsultation: true,
    sections: ["overview", "participants", "interviews", "songs", "materials"]
  }
] as const;

const offeringAliases: Readonly<Record<string, ExperienceOfferingId>> = {
  "individual-song": "single-song-group-event",
  "individual-legacy-song": "single-song-group-event",
  "complete-honor-a-life-song-experience": "honor-a-life-song-experience",
  "legacy-album": "songkeep-legacy-album"
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
  songs: "Songs & tracks",
  shared_song: "Shared song",
  concert: "Concert",
  materials: "Materials & release"
};

export const entitlementConsentScopes: Record<"participant" | "designated_family", readonly ConsentScope[]> = {
  participant: ["participation"],
  designated_family: ["designated_family_sharing"]
};
