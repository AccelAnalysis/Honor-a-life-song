import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import styles from "./services.module.css";

const experiences = [
  {
    id: "single-song-group-event",
    price: "$200",
    name: "Single-Song Group Event",
    summary: "One gathering. One shared story. One original song.",
    bestFor: "A meaningful group activity or first SongKeep experience",
    story: "Shared group story conversation",
    music: "One original shared song",
    presentation: "Presented during your gathering",
    afterward: "The song and approved event materials",
    cta: "Book Group Event — $200"
  },
  {
    id: "honor-a-life-song-experience",
    price: "$2,500",
    name: "Honor a Life Song Experience",
    summary: "Individual stories become original songs, then return to the community in concert.",
    bestFor: "Communities seeking a deeper resident and family experience",
    story: "Several participant interviews and family contributions",
    music: "Multiple participant songs",
    presentation: "A follow-up concert for the community",
    afterward: "Songs, lyrics, approved video, photos, reports, and keepsakes",
    cta: "Plan Full Experience — $2,500"
  }
] as const;

export default function ServicesPage() {
  return (
    <PublicShell>
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className="eyebrow">Experiences for communities</p>
          <h1>Choose the experience that fits your community.</h1>
          <p>
            Both experiences are created for facilities and organizations. Choose a simple shared-song event or a
            fuller resident journey with interviews, multiple songs, and a concert.
          </p>
        </header>

        <section className={styles.comparison} aria-label="Compare SongKeep experiences">
          {experiences.map((experience, index) => (
            <article className={index === 1 ? styles.featured : undefined} id={experience.id} key={experience.id}>
              {index === 1 ? <span className={styles.recommended}>Deeper resident experience</span> : null}
              <div className={styles.titleRow}>
                <div>
                  <p className={styles.price}>{experience.price}</p>
                  <h2>{experience.name}</h2>
                </div>
              </div>
              <p className={styles.summary}>{experience.summary}</p>
              <dl>
                <div><dt>Best for</dt><dd>{experience.bestFor}</dd></div>
                <div><dt>Story experience</dt><dd>{experience.story}</dd></div>
                <div><dt>Music</dt><dd>{experience.music}</dd></div>
                <div><dt>Presentation</dt><dd>{experience.presentation}</dd></div>
                <div><dt>Afterward</dt><dd>{experience.afterward}</dd></div>
              </dl>
              <Link className={styles.primaryAction} href={`/begin?offering=${experience.id}&step=details`}>
                {experience.cta}
              </Link>
              {index === 1 ? <Link className={styles.detailLink} href="/services/project-ageless">See the full experience</Link> : null}
            </article>
          ))}
        </section>

        <aside className={styles.helpChoose}>
          <div>
            <p className="eyebrow">Not sure which fits?</p>
            <h2>We’ll help you choose.</h2>
            <p>Tell us about your community, the number of participants, and the kind of gathering you envision.</p>
          </div>
          <Link className={styles.secondaryAction} href="/schedule-a-consultation">Talk with us</Link>
        </aside>
      </main>
    </PublicShell>
  );
}
