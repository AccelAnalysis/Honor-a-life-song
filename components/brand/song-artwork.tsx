import type { ApprovedMediaPresentation } from "@/lib/brand-sensory.types";
import { canPresentApprovedMedia, mediaRestrictionMessage } from "@/lib/media-presentation";
import styles from "./brand-sensory.module.css";

interface SongArtworkProps {
  title: string;
  subjectLabel?: string;
  src?: string;
  media?: ApprovedMediaPresentation;
}

export function SongArtwork({ title, subjectLabel, src, media }: SongArtworkProps) {
  const mayShowImage = Boolean(src && media && canPresentApprovedMedia(media));
  const restriction = media ? mediaRestrictionMessage(media) : undefined;

  return (
    <figure className={styles.artwork}>
      {mayShowImage ? <img className={styles.artworkImage} src={src} alt={media?.alt ?? ""} /> : null}
      <figcaption className={styles.artworkOverlay}>
        <strong>{title}</strong>
        {subjectLabel ? <span>{subjectLabel}</span> : null}
        {!mayShowImage && restriction ? <span>{restriction}</span> : null}
      </figcaption>
    </figure>
  );
}
