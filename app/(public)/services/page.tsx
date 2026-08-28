import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function ServicesPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">Experiences</p>
        <h1>Choose what fits your community.</h1>
        <div className="cardGrid">
          <article className="card" id="single-song-group-event">
            <p className="eyebrow">$200</p>
            <h2>Single-Song Group Event</h2>
            <p>One gathering. One shared song.</p>
            <Link href="/begin?offering=single-song-group-event">Choose this experience →</Link>
          </article>
          <article className="card" id="honor-a-life-song-experience">
            <p className="eyebrow">$2,500</p>
            <h2>Honor a Life Song Experience</h2>
            <p>Resident stories, multiple songs, and a follow-up concert.</p>
            <Link href="/begin?offering=honor-a-life-song-experience">Choose this experience →</Link>
          </article>
        </div>
      </main>
    </PublicShell>
  );
}
