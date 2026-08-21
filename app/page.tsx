import Link from "next/link";
import { SonicSignature } from "@/components/brand";
import { PublicShell } from "@/components/public-shell";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="consumerHero" id="hero-value-proposition" aria-labelledby="consumer-hero-title">
        <div className="consumerHeroMedia" role="img" aria-label="A woman at a piano in a warm, lived-in home" />
        <div className="consumerHeroContent">
          <p className="eyebrow">A story becomes a song.</p>
          <h1 id="consumer-hero-title">Every life has a song.</h1>
          <p className="consumerHeroLead">We listen for the moments that made someone who they are—then shape them into a human-created song that can be heard, held, and shared.</p>
          <div className="consumerHeroActions">
            <Link className="button primary" href="/how-it-works/share-your-story">Begin a song</Link>
            <Link className="button secondary" href="/how-it-works">See how a story becomes music</Link>
          </div>
          <SonicSignature inverse label="Hear our sonic signature" />
        </div>
        <span className="consumerHeroCredit">Reference image: Centre for Ageing Better / Pexels</span>
      </section>

      <section className="consumerScene" id="featured-stories-songs" aria-labelledby="listening-title">
        <div className="consumerSceneImage" role="img" aria-label="A woman listening quietly in a sunlit room">
          <span className="consumerSceneCredit">Reference image: Los Muertos Crew / Pexels</span>
        </div>
        <div className="consumerSceneCopy">
          <p className="eyebrow">First, we listen.</p>
          <h2 id="listening-title">The details people remember are where the music begins.</h2>
          <div className="resonanceLine" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
          <p>A phrase. A laugh. A place that always felt like home. Honor a Life Song turns those personal details into something a family can hear again and again.</p>
          <Link className="textLink" href="/how-it-works/share-your-story">Share the first memory →</Link>
        </div>
      </section>

      <section className="visualSection" aria-labelledby="song-collection-title">
        <div className="visualIntro">
          <div>
            <p className="eyebrow">Songs as keepsakes</p>
            <h2 id="song-collection-title">Each story becomes its own musical world.</h2>
          </div>
          <p>Public examples appear only when the people represented have given the appropriate permission. Until then, these reference covers demonstrate how songs become recognizable visual objects across the platform.</p>
        </div>
        <div className="songGallery" aria-label="Reference song artwork collection">
          <article className="songCover">
            <div className="songCoverMeta"><small>Individual song</small><h3>One life, heard closely.</h3><p>Private listening · lyrics · keepsake</p></div>
          </article>
          <article className="songCover">
            <div className="songCoverMeta"><small>Family song</small><h3>Memories gathered together.</h3><p>Voices become verses.</p></div>
          </article>
          <article className="songCover">
            <div className="songCoverMeta"><small>Community song</small><h3>A shared experience in sound.</h3><p>Stories · performance · connection</p></div>
          </article>
        </div>
      </section>

      <section className="storyProcess" id="home-how-it-works" aria-labelledby="process-title">
        <div className="storyProcessInner">
          <div className="studioImage" role="img" aria-label="A close recording-studio view of a guitar and microphone">
            <span className="studioCredit">Reference image: Saulo Leite / Pexels</span>
          </div>
          <div className="processCopy">
            <div><p className="eyebrow">Human from beginning to end</p><h2 id="process-title">Story. Song. Something lasting.</h2></div>
            <div className="processSteps">
              <div className="processStep"><strong>01</strong><div><h3>Tell us about the person.</h3><p>Write, speak, upload a photograph, or invite someone else to remember with you.</p></div></div>
              <div className="processStep"><strong>02</strong><div><h3>We listen for what matters.</h3><p>A human songwriter shapes the story, verifies the details, and develops the lyrics with care.</p></div></div>
              <div className="processStep"><strong>03</strong><div><h3>Receive a song made for them.</h3><p>Review the work, hear the final recording, and open a private keepsake made to endure.</p></div></div>
            </div>
            <Link className="button primary" href="/how-it-works">Explore the complete journey</Link>
          </div>
        </div>
      </section>

      <section className="visualSection" id="program-highlights" aria-labelledby="program-title">
        <div className="visualIntro">
          <div><p className="eyebrow">More than one kind of story</p><h2 id="program-title">Made for a person. Built for a community.</h2></div>
          <p>The same human-led process can honor an individual, bring a family together, or become the emotional center of a community program.</p>
        </div>
        <div className="programMosaic">
          <Link className="programTile" href="/services#individual-family-songs"><div><h3>Individual &amp; family songs</h3><p>Birthdays, anniversaries, memorials, milestones, and the moments between them.</p></div></Link>
          <Link className="programTile" href="/services/project-ageless"><div><h3>Project Ageless</h3><p>Stories, songs, family participation, and a shared presentation.</p></div></Link>
          <Link className="programTile" href="/services#community-programs"><div><h3>Community programs</h3><p>Cohorts, veterans, hospice, schools, and mission-driven partners.</p></div></Link>
        </div>
      </section>

      <section className="permissionScene" id="testimonials" aria-labelledby="permission-title">
        <div className="permissionSceneMark" aria-hidden="true">“</div>
        <div>
          <p className="eyebrow">Real voices, shared with care</p>
          <h2 id="permission-title">A meaningful story is never marketing material by default.</h2>
          <p>Participant songs, photographs, and testimonials appear publicly only when the specific permission exists. The emotional experience and the consent boundary belong together.</p>
        </div>
      </section>

      <section className="closingScene" id="request-a-song" aria-labelledby="closing-title">
        <div>
          <p className="eyebrow">Begin with one memory</p>
          <h2 id="closing-title">Who do you want the world to hear?</h2>
          <p>You do not need to arrive with a finished story. Start with the person, the moment, or the feeling you do not want to lose.</p>
          <Link className="button" href="/how-it-works/share-your-story">Begin a song</Link>
        </div>
      </section>

      <section className="referenceNotice consumerBoundary"><strong>Reference boundary:</strong> This experience demonstrates the approved consumer composition. Inquiry persistence, public participant media, and production audio remain permission- and service-gated rather than simulated.</section>
    </PublicShell>
  );
}
