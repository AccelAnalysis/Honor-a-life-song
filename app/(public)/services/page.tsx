import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function ServicesPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">Services</p>
        <h1>Ways to honor a story through song</h1>
        <p className="lede">Choose a personal song for an individual or family, bring Project Ageless to a facility, or talk with us about a community program shaped around your group.</p>
        <div className="cardGrid">
          <article className="card" id="individual-family-songs">
            <h2>Individual & Family Songs</h2>
            <p>Create a one-of-a-kind song from the memories, people, places, and moments that define someone you love.</p>
            <Link href="/how-it-works">See how a song comes together →</Link>
          </article>
          <article className="card" id="project-ageless">
            <h2>Project Ageless</h2>
            <p>Bring residents, families, and staff together through storytelling, songwriting, listening, keepsakes, and a shared presentation.</p>
            <Link href="/services/project-ageless">Explore Project Ageless →</Link>
          </article>
          <article className="card" id="community-programs">
            <h2>Community Programs</h2>
            <p>Create a tailored song experience for veterans, hospice communities, schools, cohorts, nonprofits, or other mission-driven groups.</p>
            <span className="mutedLabel">Tell us about your community and what you hope the experience will create.</span>
          </article>
        </div>
      </main>
    </PublicShell>
  );
}
