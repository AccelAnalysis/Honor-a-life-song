import Link from "next/link";
import { SonicSignature } from "./sonic-signature";
import styles from "./brand-sensory-reference.module.css";

export function BrandSensoryReference() {
  return (
    <section className={styles.stage} aria-labelledby="brand-sensory-reference-title">
      <Link className={styles.back} href="/">Return home</Link>
      <div className={styles.art} aria-label="Reference album artwork without participant media">
        <div className={styles.rings} aria-hidden="true" />
        <div className={styles.wave} aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <span key={index} />)}</div>
        <span className={styles.artLabel}>Honor a Life Song</span>
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Consumer listening mode</p>
        <h1 id="brand-sensory-reference-title">For someone unforgettable.</h1>
        <p className={styles.track}>The story becomes the record.</p>
        <SonicSignature label="Hear the reference sonic signature" />
        <div className={styles.rule} />
        <p className={styles.manifesto}>Person first. Story second. Music always visible. Architecture quietly underneath.</p>
        <details className={styles.details}>
          <summary>Reference boundary</summary>
          <p>This composition uses abstract reference artwork and an original browser-generated tonal motif. It contains no production participant, copyrighted recording, private delivery, or fabricated testimonial. The workflow and consent contracts remain available in their dedicated reference routes.</p>
        </details>
      </div>
    </section>
  );
}
