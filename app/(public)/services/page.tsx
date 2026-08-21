import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function ServicesPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">Services</p>
        <h1>Ways to honor a story through song</h1>
        <p className="lede">Honor a Life Song uses one shared meaning-to-song engine, configured for an individual or family service, Project Ageless, or future community-program templates.</p>
        <div className="cardGrid">
          <article className="card" id="individual-family-songs">
            <h2>Individual & Family Songs</h2>
            <p>One purchaser or family can guide a song through story capture, interview, human songwriting, review, production and secure delivery.</p>
            <Link href="/how-it-works">See the shared song journey →</Link>
          </article>
          <article className="card" id="project-ageless">
            <h2>Project Ageless</h2>
            <p>Facilities can coordinate flexible participant touchpoints, family connections, songs, a concert or presentation, keepsakes, sponsorship and outcomes.</p>
            <Link href="/services/project-ageless">Explore Project Ageless →</Link>
          </article>
          <article className="card" id="community-programs">
            <h2>Community Programs</h2>
            <p>Future mission, cohort, veteran, hospice, school and community programs can use configurable templates over the same people, story, consent, creative-work and delivery services.</p>
            <span className="mutedLabel">Program configurations are defined by the shared platform rather than separate applications.</span>
          </article>
        </div>
      </main>
    </PublicShell>
  );
}
