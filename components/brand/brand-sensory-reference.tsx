import { AudioPlayer } from "./audio-player";
import { SongArtwork } from "./song-artwork";
import styles from "./brand-sensory.module.css";

export function BrandSensoryReference() {
  return (
    <section className={styles.reference} aria-labelledby="brand-sensory-reference-title">
      <SongArtwork
        title="The Porch Light Stayed On"
        subjectLabel="Reference artwork — no participant media"
      />

      <div className={styles.referenceCopy}>
        <span className={styles.referenceEyebrow}>Honor a Life Song · Sensory reference</span>
        <h1 className={styles.referenceTitle} id="brand-sensory-reference-title">For Evelyn</h1>
        <p className={styles.referenceStory}>
          This bounded reference surface demonstrates the private-record-release direction without inventing participant photography,
          story facts, or production audio. It uses the sanctioned artwork, metadata, waveform, playback, restriction, typography,
          and resonance language that later workflow implementations can inherit.
        </p>

        <AudioPlayer
          metadata={{
            title: "The Porch Light Stayed On",
            subjectLabel: "Reference track",
            creatorCredit: "Human-created song",
            year: "2026"
          }}
          entitlement={{
            canPlay: false,
            consentState: "unknown",
            restrictionReason: "Reference mode contains no production audio. Playback remains unavailable until an authorized asset is supplied."
          }}
          variant="secure-delivery"
        />
      </div>
    </section>
  );
}
