import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { getWorkspaceStaticParams } from "../lib/workspace-static-routes";

function explicitPages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? explicitPages(path) : entry.name === "page.tsx" ? [path] : [];
  });
}

describe("workspace route ownership", () => {
  it("never prerenders a URL owned by a concrete lifecycle page", () => {
    const root = "app/(lifecycle)";
    const owned = explicitPages(root).map(path => relative(root, path).split(sep).slice(0, -1).join("/"));
    const generated = getWorkspaceStaticParams().map(entry => [entry.workspace, ...entry.slug].join("/"));
    expect(owned.length).toBeGreaterThan(10);
    expect(generated.filter(path => owned.includes(path))).toEqual([]);
  });
  it("keeps deeper workspace destinations and deduplicates their URLs", () => {
    const generated = getWorkspaceStaticParams().map(entry => [entry.workspace, ...entry.slug].join("/"));
    expect(generated).toContain("organization/library");
    expect(generated).toContain("organization/help");
    expect(generated).toContain("customer");
    expect(generated).toContain("facility");
    expect(new Set(generated).size).toBe(generated.length);
  });
});
