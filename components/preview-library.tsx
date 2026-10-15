"use client";

import { useEffect, useState } from "react";
import { AudioPlayer } from "@/components/brand";
import { listPublishedPreviews } from "@/lib/firebase/song-previews";
import { builtInPreviews, publicPreviewEntitlement, type PreviewTrack } from "@/lib/preview-library";
import styles from "./preview-library.module.css";

export function PreviewLibrary({ compact = false }: { compact?: boolean }) {
  const [tracks, setTracks] = useState<PreviewTrack[]>([...builtInPreviews]);
  const [activeId, setActiveId] = useState(builtInPreviews[0].id);
  const active = tracks.find((track) => track.id === activeId) ?? tracks[0];

  useEffect(() => {
    let cancelled = false;
    listPublishedPreviews().then((extra) => {
      if (cancelled || !extra.length) return;
      setTracks((current) => {
        const seen = new Set(current.map((track) => track.id));
        return [...current, ...extra.filter((track) => !seen.has(track.id))];
      });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  if (!active) return null;

  return <section className={compact ? styles.compact : styles.library} aria-label="Song previews">
    <div className={styles.choices} role="list">
      {tracks.map((track) => <button
        aria-current={track.id === active.id ? "true" : undefined}
        className={track.id === active.id ? styles.active : undefined}
        key={track.id}
        onClick={() => setActiveId(track.id)}
        type="button"
      >
        <strong>{track.title}</strong>
        <span>{track.credit}</span>
      </button>)}
    </div>
    <AudioPlayer
      entitlement={publicPreviewEntitlement}
      key={active.id}
      metadata={{ title: active.title, creatorCredit: active.credit, subjectLabel: "Preview" }}
      previewEndSeconds={40}
      src={active.src}
      variant="public-preview"
    />
  </section>;
}
