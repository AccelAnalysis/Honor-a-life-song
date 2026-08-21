import { describe, expect, it } from "vitest";
import { getNavigation, workspaceIds } from "@/lib/navigation";

for (const workspace of workspaceIds) {
  describe(`${workspace} navigation`, () => {
    it("has one chassis-active root route and unique slugs", () => {
      const nav = getNavigation(workspace);
      expect(nav.filter((item) => item.availability === "chassis")).toHaveLength(1);
      expect(nav[0].slug).toBe("");
      expect(new Set(nav.map((item) => item.slug)).size).toBe(nav.length);
    });
  });
}
