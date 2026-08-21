import type { TrackMetadataModel } from "@/lib/brand-sensory.types";
import styles from "./brand-sensory.module.css";

export function TrackMetadata({ metadata }: { metadata: TrackMetadataModel }) {
  const details = [metadata.subjectLabel, metadata.creatorCredit, metadata.year].filter(Boolean).join(" · ");

  return (
    <div className={styles.metadata}>
      <strong>{metadata.title}</strong>
      {details ? <span>{details}</span> : null}
    </div>
  );
}
