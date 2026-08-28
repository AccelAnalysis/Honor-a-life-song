import { describe, expect, it } from "vitest";
import { brandSensory } from "../lib/brand-sensory";
import {
  audioRestrictionMessage,
  canPlayAudio,
  canPresentApprovedMedia,
  mediaRestrictionMessage
} from "../lib/media-presentation";

describe("brand sensory authority", () => {
  it("defines SongKeep as the application-facing brand", () => {
    expect(brandSensory.applicationBrand.name).toBe("SongKeep");
    expect(brandSensory.applicationBrand.tagline).toBe("Your Story. Your Song. Always.");
    expect(brandSensory.authorityVersion).toBe("0.2.0");
  });

  it("uses the approved SongKeep-derived palette", () => {
    expect(brandSensory.colors.midnightInk).toBe("#141648");
    expect(brandSensory.colors.azure).toBe("#1572C6");
    expect(brandSensory.colors.magenta).toBe("#D53FA3");
    expect(brandSensory.gradients.primary).toContain("#834AB4");
  });

  it("forbids autoplay and preserves the public preview window", () => {
    expect(brandSensory.audio.autoplay).toBe(false);
    expect(brandSensory.audio.publicPreviewSeconds).toEqual({ min: 20, max: 40 });
  });

  it("keeps brand accents distinct from semantic status colors", () => {
    expect(brandSensory.colors.azure).not.toBe(brandSensory.colors.success);
    expect(brandSensory.colors.magenta).not.toBe(brandSensory.colors.danger);
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
