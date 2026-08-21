import type { LyricVersion } from "./types";

export function orderLyricVersions(versions: readonly LyricVersion[]) {
  return [...versions].sort((a, b) => a.version - b.version || a.createdAt.localeCompare(b.createdAt));
}

export function appendLyricVersion(existing: readonly LyricVersion[], next: LyricVersion) {
  if (existing.some((version) => version.id === next.id)) {
    throw new Error(`LyricVersion ${next.id} already exists.`);
  }
  if (existing.some((version) => version.creativeWorkId !== next.creativeWorkId)) {
    throw new Error("LyricVersion history cannot combine different CreativeWork records.");
  }
  const currentMax = existing.reduce((max, version) => Math.max(max, version.version), 0);
  if (next.version <= currentMax) {
    throw new Error(`LyricVersion ${next.version} does not advance version history.`);
  }
  return orderLyricVersions([...existing, next]);
}
