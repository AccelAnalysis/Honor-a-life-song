import { describe, expect, it } from "vitest";
import {
  buildCreatorHref,
  creatorChildren,
  creatorParentCarriesWorkContext,
  creatorLeafDestinations,
  getCreatorStaticRouteSlugs,
  resolveCreatorRoute
} from "../lib/creator-navigation";
import { workspaceNavigation } from "../lib/navigation";

describe("Creator / Production hierarchy", () => {
  it("preserves the eight existing top-level destinations in order", () => {
    expect(workspaceNavigation.creator.map((item) => item.label)).toEqual([
      "Creator Dashboard",
      "My Work",
      "Story Workspace",
      "Song Workspace",
      "Production",
      "Media",
      "Calendar",
      "Messages"
    ]);
  });

  it("registers every source-defined child under the bounded eight-page slice", () => {
    expect(creatorChildren["creator-home"].map((item) => item.label)).toEqual(["Assigned Work", "Due Soon", "Awaiting Review", "Revision Requests", "Production Queue"]);
    expect(creatorChildren.work.map((item) => item.label)).toEqual(["New Assignments", "In Progress", "Awaiting Customer", "Revision", "Completed"]);
    expect(creatorChildren.story.map((item) => item.label)).toEqual(["Interview Notes", "Source Materials", "Story Themes", "Timeline", "Important People", "Facts to Verify", "Pronunciations", "Sensitive Content Flags"]);
    expect(creatorChildren.song.map((item) => item.label)).toEqual(["Song Overview", "Lyrics", "Customer Feedback", "Internal Notes", "Approvals", "Files"]);
    expect(creatorChildren.production.map((item) => item.label)).toEqual(["Composition", "Arrangement", "Recording", "Editing", "Mixing", "Mastering / Finalization", "Quality Review"]);
    expect(creatorChildren.media.map((item) => item.label)).toEqual(["Working Files", "Final Audio", "Lyric PDF", "Delivery Assets"]);
  });

  it("models Lyrics as a genuine grandchild hierarchy", () => {
    const lyrics = creatorChildren.song.find((item) => item.id === "song-lyrics");
    expect(lyrics?.grandchildren?.map((item) => item.label)).toEqual(["Draft", "Version History", "Comparison"]);
  });

  it("does not invent Calendar or Messages child pages", () => {
    expect(creatorChildren.calendar).toEqual([]);
    expect(creatorChildren.messages).toEqual([]);
    expect(creatorLeafDestinations.calendar?.label).toBe("Calendar");
    expect(creatorLeafDestinations.messages?.label).toBe("Messages");
  });

  it("round-trips nested lyrics routes and preserves selected CreativeWork context", () => {
    const href = buildCreatorHref({
      parentId: "song",
      childId: "song-lyrics",
      grandchildId: "lyrics-version-history",
      creativeWorkId: "work-42"
    });
    expect(href).toBe("/creator/creative-work/work-42/song/lyrics/version-history");

    const resolved = resolveCreatorRoute(href.split("/").filter(Boolean).slice(1));
    expect(resolved?.parent.id).toBe("song");
    expect(resolved?.child?.id).toBe("song-lyrics");
    expect(resolved?.grandchild?.id).toBe("lyrics-version-history");
    expect(resolved?.creativeWorkId).toBe("work-42");
  });

  it("preserves selected-work context across Story, Song, Production, and Media parents", () => {
    expect(["story", "song", "production", "media"].every((parent) => creatorParentCarriesWorkContext(parent as "story" | "song" | "production" | "media"))).toBe(true);
    expect(buildCreatorHref({ parentId: "story", childId: "story-pronunciations", creativeWorkId: "work-42" })).toContain("creative-work/work-42/story/pronunciations");
    expect(buildCreatorHref({ parentId: "production", childId: "production-recording", creativeWorkId: "work-42" })).toContain("creative-work/work-42/production/recording");
    expect(buildCreatorHref({ parentId: "media", childId: "media-working-files", creativeWorkId: "work-42" })).toContain("creative-work/work-42/media/working-files");
  });

  it("fails safely for invalid nested routes instead of falling back", () => {
    expect(resolveCreatorRoute(["song", "lyrics", "autonomous-rewrite"])).toBeUndefined();
    expect(resolveCreatorRoute(["calendar", "invented-child"])).toBeUndefined();
  });

  it("includes nested and selected-context routes in static preview params", () => {
    const staticSlugs = getCreatorStaticRouteSlugs("reference-work").map((parts) => parts.join("/"));
    expect(staticSlugs).toContain("song/lyrics/draft");
    expect(staticSlugs).toContain("creative-work/reference-work/song/lyrics/comparison");
    expect(staticSlugs).toContain("dashboard/assigned-work");
    expect(staticSlugs).toContain("calendar");
  });
});
