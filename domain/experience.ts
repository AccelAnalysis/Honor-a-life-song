import type { ConsentScope } from "./consent";

export const experienceOfferingIds = [
  "single-song-group-event",
  "honor-a-life-song-experience",
  "songkeep-legacy-album"
] as const;

export type ExperienceOfferingId = (typeof experienceOfferingIds)[number];
export type ExperienceTemplateKind = "group_event" | "full_program" | "legacy_album";
export type ExperienceParticipantMode = "group" | "named_roster" | "album_subject";
export type ExperienceSectionId =
  | "overview"
  | "event_setup"
  | "participants"
  | "interviews"
  | "songs"
  | "shared_song"
  | "concert"
  | "album_map"
  | "tracks"
  | "release"
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
  bestFor: string;
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
    shortName: "Group Event",
    priceCents: 20_000,
    currency: "USD",
    buyer: "organization",
    templateKind: "group_event",
    participantMode: "group",
    description: "A shared story experience that brings one gathering together through one original song.",
    bestFor: "A meaningful group activity or a first SongKeep experience",
    storyCapture: "Shared group story conversation",
    creativeOutput: "One shared song",
    presentation: "Event presentation",
    postEvent: "Shared song and approved event materials",
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
    description: "A multi-touch experience where individual stories become songs and return to the community in concert.",
    bestFor: "Organizations seeking deeper participant and family engagement",
    storyCapture: "Several participant interviews and family contributions",
    creativeOutput: "Multiple participant songs",
    presentation: "Follow-up concert",
    postEvent: "Songs, lyrics, approved video, photos, reports, and keepsakes",
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
    participantMode: "album_subject",
    description: "A complete musical life story developed as a cohesive album and prepared for an approved digital release.",
    bestFor: "A person, family, organization, or community whose story deserves a full album",
    storyCapture: "Extended interviews, collaborator input, and life-story mapping",
    creativeOutput: "A cohesive multi-track legacy album",
    presentation: "Private reveal or release experience",
    postEvent: "Album, artwork, release metadata, private listening, and approved distribution links",
    sections: ["overview", "participants", "interviews", "album_map", "tracks", "release", "materials"]
  }
] as const;

const offeringAliases: Readonly<Record<string, ExperienceOfferingId>> = {
  "individual-song": "single-song-group-event",
  "individual-legacy-song": "single-song-group-event",
  "complete-honor-a-life-song-experience": "honor-a-life-song-experience",
  "legacy-album": "songkeep-legacy-album",
  "songkeep-album": "songkeep-legacy-album"
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
  album_map: "Album story map",
  tracks: "Tracks",
  release: "Release",
  materials: "Event materials"
};

export const entitlementConsentScopes: Record<"participant" | "designated_family", readonly ConsentScope[]> = {
  participant: ["participation"],
  designated_family: ["designated_family_sharing"]
};
