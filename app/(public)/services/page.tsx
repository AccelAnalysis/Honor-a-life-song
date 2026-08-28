import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function ServicesPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">Services</p>
        <h1>Music experiences for facilities and community organizations</h1>
        <p className="lede">Choose a focused group event or a complete multi-touch experience. Both are purchased by the organization and remain connected to its account, event history, and approved post-event materials.</p>
        <div className="cardGrid">
          <article className="card" id="single-song-group-event">
            <p className="eyebrow">$200</p>
            <h2>Single-Song Group Event</h2>
            <p>Bring a group together for shared story capture, one shared song, and an event presentation, with approved materials returning to the organization afterward.</p>
            <Link href="/begin?offering=single-song-group-event">Choose the group event →</Link>
          </article>
          <article className="card" id="honor-a-life-song-experience">
            <p className="eyebrow">$2,500</p>
            <h2>Honor a Life Song Experience</h2>
            <p>Plan a multi-touch program with participant selection, interviews, multiple songs, family involvement where appropriate, and a follow-up concert.</p>
            <Link href="/services/project-ageless">Explore the full experience →</Link>
          </article>
          <article className="card" id="community-programs">
            <h2>Built for many kinds of communities</h2>
            <p>Senior living, veterans, hospice, schools, nonprofits, healthcare, faith communities, cohorts, and other mission-driven organizations can use the same two experience models.</p>
            <Link href="/how-it-works">See how organizations move through the journey →</Link>
          </article>
        </div>
      </main>
    </PublicShell>
  );
}
