/** Paths copied outside Next's Link/router also need the deployed base path. */
export function appPath(path: string): string { return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path.startsWith("/") ? path : `/${path}`}`; }

/**
 * Root-relative files in `public/` are not rewritten by Next on a raw media URL.
 * GitHub Pages serves them under the site base path. Remote and blob URLs stay unchanged.
 */
export function publicAssetPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return appPath(path);
}
