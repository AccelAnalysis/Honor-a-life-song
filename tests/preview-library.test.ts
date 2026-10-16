import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publicAssetPath } from "../lib/app-path";
import { builtInPreviews, guestDraftIsReady, httpsAudioLink } from "../lib/preview-library";

describe("preview library", () => {
  it("ships more than one playable preview", () => {
    expect(builtInPreviews.length).toBeGreaterThan(1);
    expect(new Set(builtInPreviews.map((track) => track.src)).size).toBe(builtInPreviews.length);
    for (const track of builtInPreviews) {
      expect(track.src.startsWith("/previews/")).toBe(true);
      expect(readFileSync(`public${track.src}`).byteLength).toBeGreaterThan(1000);
    }
    expect(readFileSync("app/page.tsx", "utf8")).toContain("<PreviewLibrary />");
    expect(readFileSync("components/guest-songwriting.tsx", "utf8")).toContain("<PreviewLibrary />");
    expect(readFileSync("components/songwriting-studio.tsx", "utf8")).toContain("<PreviewLibrary");
  });

  it("loads built-in previews from the GitHub Pages base path", () => {
    const previous = process.env.NEXT_PUBLIC_BASE_PATH;
    process.env.NEXT_PUBLIC_BASE_PATH = "/Honor-a-life-song";
    try {
      expect(publicAssetPath(builtInPreviews[0].src)).toBe("/Honor-a-life-song/previews/porch-light.wav");
      expect(publicAssetPath("https://cdn.example/song.mp3")).toBe("https://cdn.example/song.mp3");
      expect(publicAssetPath("blob:https://accelanalysis.github.io/id")).toBe("blob:https://accelanalysis.github.io/id");
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
      else process.env.NEXT_PUBLIC_BASE_PATH = previous;
    }
    expect(readFileSync("components/brand/audio-player.tsx", "utf8")).toContain("publicAssetPath(src)");
  });

  it("accepts only https links for an added preview", () => {
    expect(httpsAudioLink("https://example.com/song.mp3")).toBe("https://example.com/song.mp3");
    for (const value of ["http://example.com/song.mp3", "javascript:alert(1)", "/previews/porch-light.wav", "not a url"]) {
      expect(() => httpsAudioLink(value)).toThrow(/https/);
    }
  });

  it("asks for an account only after a guest has a lyric", () => {
    expect(guestDraftIsReady("too short")).toBe(false);
    expect(guestDraftIsReady("She taught piano in the church basement for forty years.")).toBe(true);
  });

  it("lets visitors read published previews and keeps uploads signed in", () => {
    const firestore = readFileSync("firestore.rules", "utf8");
    const storage = readFileSync("storage.rules", "utf8");
    expect(firestore).toContain("match /songPreviews/{previewId}");
    expect(firestore).toContain("resource.data.published == true");
    expect(storage).toContain("match /song-previews/{previewId}/{fileName}");
    expect(storage).toContain("request.resource.contentType.matches('audio/.*')");
    expect(storage).toContain("allow update, delete: if false;");
    expect(storage).not.toContain("allow read, write: if true");
    expect(readFileSync("lib/firebase/song-previews.ts", "utf8")).not.toMatch(/SONGKEEP_LYRIC_MODEL_KEY|sk-|api\.openai\.com/);
  });
});
