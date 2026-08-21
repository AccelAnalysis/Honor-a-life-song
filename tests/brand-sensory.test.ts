import { describe, expect, it } from "vitest";
import { brandSensory } from "../lib/brand-sensory";
import {
  audioRestrictionMessage,
  canPlayAudio,
  canPresentApprovedMedia,
  mediaRestrictionMessage
} from "../lib/media-presentation";

describe("brand sensory authority", () => {
  it("forbids autoplay and preserves the public preview window", () => {
    expect(brandSensory.audio.autoplay).toBe(false);
    expect(brandSensory.audio.publicPreviewSeconds).toEqual({ min: 20, max: 40 });
  });

  it("retains resonance as a living secondary accent rather than a status color", () => {
    expect(brandSensory.colors.resonance).toBe("#4F7470");
    expect(brandSensory.colors.resonance).not.toBe(brandSensory.colors.success);
  });

  it("keeps audio and recorder state contracts explicit", () => {
    expect(brandSensory.audio.requiredPlayerStates).toContain("restricted");
    expect(brandSensory.audio.requiredRecorderStates).toContain("denied");
  });
});

describe("consent-aware media presentation", () => {
  it("fails closed for public media without confirmed permission", () => {
    const media = {
      alt: "Portrait",
      consentState: "unknown" as const,
      usageScope: "public-marketing" as const
    };

    expect(canPresentApprovedMedia(media)).toBe(false);
    expect(mediaRestrictionMessage(media)).toMatch(/not been confirmed/i);
  });

  it("does not treat access to an audio record as consent to play it", () => {
    const entitlement = { canPlay: true, consentState: "restricted" as const };

    expect(canPlayAudio(entitlement)).toBe(false);
    expect(audioRestrictionMessage(entitlement)).toMatch(/restricted/i);
  });

  it("allows playback only when entitlement and consent both permit it", () => {
    expect(canPlayAudio({ canPlay: true, consentState: "permitted" })).toBe(true);
    expect(canPlayAudio({ canPlay: false, consentState: "permitted" })).toBe(false);
  });
});
