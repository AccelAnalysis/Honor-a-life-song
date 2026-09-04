import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { formatOfferingPrice } from "@/domain/booking";
import { experienceOfferings } from "@/domain/experience";
import styles from "./services.module.css";

const ctaLabels = {
  "single-song-group-event": "Plan Group Event",
  "honor-a-life-song-experience": "Plan Full Experience",
  "songkeep-legacy-album": "Explore Legacy Album"
} as const;

export default function ServicesPage() {
  return (
    <PublicShell>
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className="eyebrow">Experiences for organizations</p>
          <h1>Choose how your stories become music.</h1>
          <p>
            Start with one shared song, create a deeper participant experience, or preserve a complete story as a
            professionally developed legacy album. Every experience remains connected to one organization account.
          </p>
        </header>

        <section className={styles.comparison} aria-label="Compare SongKeep experiences">
          {experienceOfferings.map((experience) => (
            <article
              className={experience.id === "honor-a-life-song-experience" ? styles.featured : experience.id === "songkeep-legacy-album" ? styles.premium : undefined}
              id={experience.id}
              key={experience.id}
            >
              {experience.id === "honor-a-life-song-experience" ? <span className={styles.recommended}>Complete participant experience</span> : null}
              {experience.id === "songkeep-legacy-album" ? <span className={styles.recommended}>Premium musical legacy</span> : null}
              <div className={styles.titleRow}>
                <div>
                  <p className={styles.price}>{formatOfferingPrice(experience.priceCents)}</p>
                  <h2>{experience.name}</h2>
                </div>
              </div>
              <p className={styles.summary}>{experience.description}</p>
              <dl>
                <div><dt>Best for</dt><dd>{experience.bestFor}</dd></div>
                <div><dt>Story experience</dt><dd>{experience.storyCapture}</dd></div>
                <div><dt>Music</dt><dd>{experience.creativeOutput}</dd></div>
                <div><dt>Presentation</dt><dd>{experience.presentation}</dd></div>
                <div><dt>Afterward</dt><dd>{experience.postEvent}</dd></div>
              </dl>
              <Link className={styles.primaryAction} href={`/begin?offering=${experience.id}&step=details`}>
                {ctaLabels[experience.id]} — {formatOfferingPrice(experience.priceCents)}
              </Link>
              {experience.id === "honor-a-life-song-experience" ? <Link className={styles.detailLink} href="/services/project-ageless">See the complete experience</Link> : null}
              {experience.requiresConsultation ? <span className={styles.consultationNote}>Includes a scope and release conversation before production begins.</span> : null}
            </article>
          ))}
        </section>

        <aside className={styles.helpChoose}>
          <div>
            <p className="eyebrow">Not sure which fits?</p>
            <h2>We’ll help you choose.</h2>
            <p>Tell us about your organization, participants, goals, and the kind of story experience you envision.</p>
          </div>
          <Link className={styles.secondaryAction} href="/schedule-a-consultation">Talk with us</Link>
        </aside>
      </main>
    </PublicShell>
  );
}
