const applicationOrigin = "https://honor-a-life-song.invalid";

export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const parsed = new URL(value, applicationOrigin);
    if (parsed.origin !== applicationOrigin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
