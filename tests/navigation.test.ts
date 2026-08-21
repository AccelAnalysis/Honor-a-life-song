import { describe, expect, it } from "vitest";
import { getNavigation, workspaceIds } from "../lib/navigation";

for (const workspace of workspaceIds) {
  describe(`${workspace} navigation`, () => {
    it("has a governed root route and unique slugs", () => {
      const nav = getNavigation(workspace);
      expect(nav[0].slug).toBe("");
      expect(new Set(nav.map((item) => item.slug)).size).toBe(nav.length);

      if (workspace === "admin") {
        expect(nav[0].availability).toBe("structured");
        expect(nav.every((item) => item.availability === "structured")).toBe(true);
      } else {
        expect(nav.filter((item) => item.availability === "chassis")).toHaveLength(1);
      }
    });
  });
}
