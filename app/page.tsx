import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

const serviceCards = [
  ["Individual & Family Songs", "A guided story-to-song journey for birthdays, anniversaries, memorials, milestones and other meaningful occasions.", "/services"],
  ["Project Ageless", "A flexible participatory residency for communities that captures stories, creates songs and culminates in presentation and keepsakes.", "/services/project-ageless"],
  ["Community Programs", "The same core meaning-to-song engine can support future mission, cohort, veteran, hospice and community programs.", "/services"]
] as const;

export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero">
        <div>
          <p className="eyebrow">Every life carries a story worth hearing.</p>
          <h1>Every life has a song. We help you share it.</h1>
          <p className="lede">Honor a Life Song turns meaningful stories into human-created songs, shared experiences and lasting keepsakes.</p>
          <div className="buttonRow">
            <Link className="button primary" href="/services">Explore services</Link>
            <Link className="button secondary" href="/how-it-works">How it works</Link>
          </div>
        </div>
        <div className="heroPanel" aria-label="Platform journey preview">
          <span>Share the story</span><span>→</span><span>Create the song</span><span>→</span><span>Honor the life</span>
        </div>
      </section>
      <section className="section">
        <div className="sectionHeading"><p className="eyebrow">One platform, multiple experiences</p><h2>Built around a shared meaning-to-song engine</h2></div>
        <div className="cardGrid">{serviceCards.map(([title, body, href]) => <article className="card" key={title}><h3>{title}</h3><p>{body}</p><Link href={href}>Learn more →</Link></article>)}</div>
      </section>
      <section className="referenceNotice"><strong>Chassis build:</strong> This public experience establishes the real platform structure. Transactional service modules will be connected in later implementation slices rather than simulated here.</section>
    </PublicShell>
  );
}
