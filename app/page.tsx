import Link from "next/link";
import { Journey } from "@/components/journey";
import { PublicShell } from "@/components/public-shell";

const programHighlights = [
  ["Individual & Family Songs", "A guided story-to-song journey for birthdays, anniversaries, memorials, milestones and other meaningful occasions.", "/services#individual-family-songs"],
  ["Project Ageless", "A flexible participatory residency for communities that captures stories, creates songs and can culminate in presentation and keepsakes.", "/services/project-ageless"],
  ["Community Programs", "Future mission, cohort, veteran, hospice, school and community programs can use the same configurable platform services.", "/services#community-programs"]
] as const;

export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero" id="hero-value-proposition">
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

      <section className="section" id="home-how-it-works">
        <div className="sectionHeading">
          <p className="eyebrow">How it works</p>
          <h2>A human-led journey from story to keepsake</h2>
        </div>
        <Journey />
        <Link className="textLink" href="/how-it-works">Explore the complete process →</Link>
      </section>

      <section className="section compactSection" id="featured-stories-songs">
        <div className="sectionHeading">
          <p className="eyebrow">Featured Stories / Songs</p>
          <h2>Stories shared only with permission</h2>
          <p className="lede">The public platform has a defined home for sample songs, stories and approved media. No participant story, song or testimonial is fabricated for the chassis; permissioned public content can plug into this section when it is available.</p>
        </div>
      </section>

      <section className="section" id="program-highlights">
        <div className="sectionHeading">
          <p className="eyebrow">Program Highlights</p>
          <h2>One platform, multiple service configurations</h2>
        </div>
        <div className="cardGrid">
          {programHighlights.map(([title, body, href]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link href={href}>Learn more →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section compactSection" id="testimonials">
        <div className="sectionHeading">
          <p className="eyebrow">Testimonials</p>
          <h2>Participant, family and facility voices</h2>
          <p className="lede">Testimonials belong in the public experience only when the underlying story and testimonial permissions allow that use. This section is ready for approved content without substituting placeholder quotations for real voices.</p>
        </div>
      </section>

      <section className="section ctaSection" id="request-a-song">
        <div>
          <p className="eyebrow">Request a Song</p>
          <h2>Start with the story you want to honor.</h2>
          <p>See what to prepare for story capture, interview and the human songwriting process before the production request service is connected.</p>
        </div>
        <Link className="button primary" href="/how-it-works/share-your-story">Prepare to share your story</Link>
      </section>

      <section className="referenceNotice"><strong>Chassis boundary:</strong> The public hierarchy is route-backed, but authoritative Inquiry / Request persistence remains a shared service integration and is not simulated by this public slice.</section>
    </PublicShell>
  );
}
