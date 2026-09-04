import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { formatOfferingPrice } from "@/domain/booking";
import { experienceOfferings } from "@/domain/experience";
import styles from "./services.module.css";

export default function ServicesPage() {
  return <PublicShell>
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>SongKeep experiences</p>
        <h1>Choose what your organization wants to make possible.</h1>
        <p>The organization purchases the experience. Participants and families receive private invitations, permissions, memories, and eligible products later.</p>
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

      <section className={styles.lifecycle}>
        <div><p className={styles.eyebrow}>One continuous relationship</p><h2>The experience does not end at the event.</h2></div>
        <div className={styles.lifecycleSteps}>
          <p><span>01</span><strong>Organization account</strong><small>One permanent customer record for contacts, invoices, experiences, and renewal.</small></p>
          <p><span>02</span><strong>Participant invitations</strong><small>Each person controls recording, sharing, performance, media, and public-use choices.</small></p>
          <p><span>03</span><strong>Private memories &amp; products</strong><small>Eligible people can access and purchase products created from the organization experience.</small></p>
          <p><span>04</span><strong>Loyalty &amp; advocacy</strong><small>Feedback, service recovery, referrals, and the next experience remain connected.</small></p>
        </div>
      </section>
    </main>
  </PublicShell>;
}
