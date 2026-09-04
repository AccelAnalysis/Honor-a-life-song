/** Paths copied outside Next's Link/router also need the deployed base path. */
export function appPath(path: string): string { return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path.startsWith("/") ? path : `/${path}`}`; }
