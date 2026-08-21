import type { ApprovedMediaPresentation, AudioEntitlementModel } from "@/lib/brand-sensory.types";

export function canPresentApprovedMedia(media: ApprovedMediaPresentation) {
  return media.consentState === "permitted";
}

export function mediaRestrictionMessage(media: ApprovedMediaPresentation) {
  if (media.restrictionReason) return media.restrictionReason;

  switch (media.consentState) {
    case "withdrawn":
      return "This media is no longer available for this use.";
    case "restricted":
      return "This media is restricted for this use.";
    case "unknown":
      return "Media permission has not been confirmed for this use.";
    default:
      return undefined;
  }
}

export function canPlayAudio(entitlement: AudioEntitlementModel) {
  return entitlement.canPlay && entitlement.consentState === "permitted";
}

export function audioRestrictionMessage(entitlement: AudioEntitlementModel) {
  if (entitlement.restrictionReason) return entitlement.restrictionReason;
  if (entitlement.consentState === "withdrawn") return "Playback permission has been withdrawn.";
  if (entitlement.consentState === "restricted") return "Playback is restricted in this context.";
  if (entitlement.consentState === "unknown") return "Playback permission has not been confirmed.";
  if (!entitlement.canPlay) return "Playback is not available for this account or context.";
  return undefined;
}
