import { describe, expect, it } from "vitest";
import { appendLyricVersion } from "../domain/creative";
import { consentAllows, type ConsentRecord } from "../domain/consent";
import type { LyricVersion } from "../domain/types";
import { creatorProductionEligible } from "../domain/workflows";
import { creatorChildren, creatorServiceConnections } from "../lib/creator-navigation";

describe("Creator workflow integrity", () => {
  it("does not treat a lyric-development state as production-ready", () => {
    expect(creatorProductionEligible("Lyric Development")).toBe(false);
    expect(creatorProductionEligible("Customer Review")).toBe(false);
    expect(creatorProductionEligible("Approved for Production")).toBe(true);
  });

  it("preserves prior lyric versions when a new version is appended", () => {
    const prior: LyricVersion[] = [
      { id: "lyrics-v1", creativeWorkId: "work-1", version: 1, createdAt: "2026-08-20T10:00:00Z" },
      { id: "lyrics-v2", creativeWorkId: "work-1", version: 2, createdAt: "2026-08-20T11:00:00Z" }
    ];
    const next: LyricVersion = { id: "lyrics-v3", creativeWorkId: "work-1", version: 3, createdAt: "2026-08-20T12:00:00Z" };
    const result = appendLyricVersion(prior, next);

    expect(result.map((version) => version.id)).toEqual(["lyrics-v1", "lyrics-v2", "lyrics-v3"]);
    expect(prior.map((version) => version.id)).toEqual(["lyrics-v1", "lyrics-v2"]);
  });

  it("fails closed when creator authorization exists but required consent does not", () => {
    expect(consentAllows(undefined, "internal_creative_use").allowed).toBe(false);

    const record: ConsentRecord = {
      id: "consent-1",
      subjectPersonId: "person-1",
      grantedByPersonId: "person-1",
      authorityBasis: "self",
      state: "active",
      scopes: ["internal_creative_use"],
      restrictions: [],
      version: 1
    };
    expect(consentAllows(record, "internal_creative_use").allowed).toBe(true);
    expect(consentAllows(record, "public_marketing").allowed).toBe(false);
  });

  it("keeps internal and delivery-candidate media on distinct exposure boundaries", () => {
    const internalNotes = creatorChildren.song.find((item) => item.id === "song-internal-notes");
    const sensitiveFlags = creatorChildren.story.find((item) => item.id === "story-sensitive-content-flags");
    const workingFiles = creatorChildren.media.find((item) => item.id === "media-working-files");
    const finalAudio = creatorChildren.media.find((item) => item.id === "media-final-audio");
    const deliveryAssets = creatorChildren.media.find((item) => item.id === "media-delivery-assets");

    expect(internalNotes?.exposure).toBe("creator_internal");
    expect(sensitiveFlags?.exposure).toBe("creator_internal");
    expect(workingFiles?.exposure).toBe("creator_internal");
    expect(finalAudio?.exposure).toBe("delivery_candidate");
    expect(deliveryAssets?.boundaries).toContain("secure-delivery");
  });

  it("does not report unconnected production services as successful", () => {
    expect(Object.values(creatorServiceConnections).every((connected) => connected === false)).toBe(true);
  });
});
