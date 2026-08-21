export type AudioPlayerState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "ended"
  | "unavailable"
  | "restricted"
  | "error";

export type VoiceRecorderState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "paused"
  | "review"
  | "uploading"
  | "saved"
  | "denied"
  | "error";

export type MediaConsentState = "permitted" | "restricted" | "withdrawn" | "unknown";

export type AudioContextVariant =
  | "public-preview"
  | "customer-review"
  | "customer-final"
  | "creator-production"
  | "facility-program"
  | "secure-delivery"
  | "story-contribution"
  | "interview-source";

export interface TrackMetadataModel {
  title: string;
  subjectLabel?: string;
  creatorCredit?: string;
  year?: string;
  artworkAlt?: string;
}

export interface AudioEntitlementModel {
  canPlay: boolean;
  canDownload?: boolean;
  canShare?: boolean;
  consentState: MediaConsentState;
  restrictionReason?: string;
}

export interface ApprovedMediaPresentation {
  alt: string;
  consentState: MediaConsentState;
  usageScope: "private" | "family" | "event" | "public-marketing" | "sponsor-acknowledgment";
  restrictionReason?: string;
}
