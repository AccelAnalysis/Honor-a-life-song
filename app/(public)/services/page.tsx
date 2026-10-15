import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { formatOfferingPrice } from "@/domain/booking";
import { groupAccountHref } from "@/domain/consumer-song-flow";
import { experienceOfferings } from "@/domain/experience";
import { formatPlanPrice, individualSongPlans } from "@/domain/individual-song-plans";
import styles from "./services.module.css";

export default function ServicesPage() {
  return <PublicShell>
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>SongKeep</p>
        <h1>A song for one person, or a song for a group.</h1>
        <p>Individual packages start the song now. Group experiences start with an account, then the event.</p>
        <div className={styles.paths}>
          <Link className={styles.primary} href="/create">Start a personal song</Link>
          <Link className={styles.secondary} href={groupAccountHref()}>Start a group account</Link>
        </div>
      </section>

      <section className={styles.personal} aria-label="Individual SongKeep packages">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Individual</p>
          <h2>A personal song</h2>
          <p>Create the song first. No account yet. You choose the package after the draft feels right.</p>
        </div>
        <div className={styles.packages}>
          {individualSongPlans.map((plan) => {
            const signature = plan.id === "song-keep-signature";
            const className = signature ? `${styles.package} ${styles.packageSignature}` : plan.featured ? `${styles.package} ${styles.packageFeatured}` : styles.package;
            return <article className={className} key={plan.id}>
              {plan.badge ? <p className={styles.badge}>{plan.badge}</p> : null}
              {signature ? <p className={styles.fanfare}>Songwriter&apos;s Touch™</p> : null}
              <h3>{plan.name}</h3>
              <p className={styles.packagePrice}>{formatPlanPrice(plan.priceCents)}</p>
              <ul>
                {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
              <Link className={styles.primary} href={`/create?plan=${plan.id}`}>Create a song</Link>
            </article>;
          })}
        </div>
      </section>

      <section className={styles.comparison} aria-label="Group experiences">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Groups</p>
          <h2>A group experience</h2>
          <p>Groups create an account first. Billing comes after the event is taking shape. Honor a Life Song Experience stays here with the other group packages.</p>
        </div>
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
            <div className={styles.paths}>
              <Link className={styles.primary} href={groupAccountHref(offering.id)}>Create a group account</Link>
              <Link className={styles.secondary} href={`/begin?offering=${offering.id}`}>Already have an account</Link>
            </div>
          </div>
        </article>)}
      </section>
    </div>
  </PublicShell>;
}
