export type PreviewTrack = {
  id: string;
  title: string;
  credit: string;
  src: string;
};

/** Original short sketches shipped with the site so visitors can hear music without an account. */
export const builtInPreviews: readonly PreviewTrack[] = [
  { id: "porch-light", title: "Porch light", credit: "SongKeep preview", src: "/previews/porch-light.wav" },
  { id: "kitchen-hymn", title: "Kitchen hymn", credit: "SongKeep preview", src: "/previews/kitchen-hymn.wav" },
  { id: "long-walk-home", title: "Long walk home", credit: "SongKeep preview", src: "/previews/long-walk-home.wav" }
];

export const publicPreviewEntitlement = { canPlay: true, consentState: "permitted" as const };

export function guestDraftIsReady(draft: string) {
  return draft.trim().length >= 40;
}

export function httpsAudioLink(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Paste an https link to an audio file.");
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error("Paste an https link to an audio file.");
  }
  return url.toString();
}

export function safePreviewFileName(fileName: string) {
  const extension = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const allowed = ["mp3", "wav", "m4a", "ogg", "webm", "aac"];
  return `preview.${allowed.includes(extension) ? extension : "audio"}`;
}
