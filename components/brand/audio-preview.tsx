import type { AudioEntitlementModel, TrackMetadataModel } from "@/lib/brand-sensory.types";
import { AudioPlayer } from "./audio-player";

interface AudioPreviewProps {
  src?: string;
  metadata: TrackMetadataModel;
  entitlement: AudioEntitlementModel;
  previewSeconds?: number;
}

export function AudioPreview({ src, metadata, entitlement, previewSeconds = 40 }: AudioPreviewProps) {
  const boundedPreview = Math.max(20, Math.min(40, previewSeconds));

  return (
    <AudioPlayer
      src={src}
      metadata={metadata}
      entitlement={entitlement}
      variant="public-preview"
      compact
      previewEndSeconds={boundedPreview}
    />
  );
}
