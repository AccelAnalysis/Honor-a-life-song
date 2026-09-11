import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { formatOfferingPrice } from "@/domain/booking";
import { experienceOfferings } from "@/domain/experience";
import styles from "./services.module.css";

export default function ServicesPage() {
  return <PublicShell>
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>SongKeep experiences</p>
        <h1>Choose your experience.</h1>
        <p>Bring your group together through original music, personal stories, and moments worth keeping.</p>
      </section>

      <section className={styles.comparison} aria-label="Compare SongKeep experiences">
        {experienceOfferings.map((offering, index) => <article className={styles.offer} key={offering.id}>
          <div className={styles.offerNumber} aria-hidden="true">0{index + 1}</div>
          <div className={styles.offerBody}>
            <div className={styles.offerHeading}>
              <div><p className={styles.eyebrow}>{offering.bestFor}</p><h2>{offering.name}</h2></div>
              <strong>{formatOfferingPrice(offering.priceCents)}</strong>
            </div>
            <p>{offering.description}</p>
            <dl>
              <div><dt>Story</dt><dd>{offering.storyCapture}</dd></div>
              <div><dt>Music</dt><dd>{offering.creativeOutput}</dd></div>
              <div><dt>Experience</dt><dd>{offering.presentation}</dd></div>
              <div><dt>Afterward</dt><dd>{offering.postEvent}</dd></div>
            </dl>
            <Link className={styles.primary} href={`/begin?offering=${offering.id}`}>Choose {offering.shortName}</Link>
          </div>
        </article>)}
      </section>


    </div>
  </PublicShell>;
}
