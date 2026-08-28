import Link from "next/link";
import { SonicSignature } from "@/components/brand";
import { PublicShell } from "@/components/public-shell";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="consumerHero" id="hero-value-proposition" aria-labelledby="consumer-hero-title">
        <div className="consumerHeroMedia" role="img" aria-label="A woman at a piano in a warm, lived-in home" />
        <div className="consumerHeroContent">
          <p className="eyebrow">Every life has a song.</p>
          <h1 id="consumer-hero-title">Bring an unforgettable story-to-song experience to the people you serve.</h1>
          <p className="consumerHeroLead">Honor a Life Song helps facilities and community organizations turn the stories of the people they serve into human-created music, shared celebration, and lasting memories.</p>
          <div className="consumerHeroActions">
            <Link className="button primary" href="/services">Choose an experience</Link>
            <Link className="button secondary" href="/how-it-works">See what happens</Link>
          </div>
          <SonicSignature inverse label="Hear our sonic signature" />
        </div>
        <span className="consumerHeroCredit">Photo: Centre for Ageing Better / Pexels</span>
      </section>

      <section className="consumerScene" id="featured-stories-songs" aria-labelledby="listening-title">
        <div className="consumerSceneImage" role="img" aria-label="A woman listening quietly in a sunlit room">
          <span className="consumerSceneCredit">Photo: Los Muertos Crew / Pexels</span>
        </div>
        <div className="consumerSceneCopy">
          <p className="eyebrow">First, we listen.</p>
          <h2 id="listening-title">The details people remember are where the music begins.</h2>
          <div className="resonanceLine" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
          <p>A phrase. A laugh. A place that always felt like home. We help your team create the conditions for those details to be heard, shaped into music, and celebrated with participants and their families.</p>
          <Link className="textLink" href="/how-it-works">See the experience from beginning to end →</Link>
        </div>
      </section>

      <section className="visualSection" aria-labelledby="song-collection-title">
        <div className="visualIntro">
          <div>
            <p className="eyebrow">Songs as keepsakes</p>
            <h2 id="song-collection-title">Each story becomes its own musical world.</h2>
          </div>
          <p>Each organization experience can create shared event materials and, when permission is given, private songs and keepsakes for participants and designated family members.</p>
        </div>
        <div className="songGallery" aria-label="Song artwork collection">
          <article className="songCover">
            <div className="songCoverMeta"><small>Participant song</small><h3>One life, heard closely.</h3><p>Private listening · lyrics · keepsake</p></div>
          </article>
          <article className="songCover">
            <div className="songCoverMeta"><small>Single-song group event</small><h3>Memories gathered together.</h3><p>Shared stories become one song.</p></div>
          </article>
          <article className="songCover">
            <div className="songCoverMeta"><small>Full experience</small><h3>A community celebrated in sound.</h3><p>Stories · songs · follow-up concert</p></div>
          </article>
        </div>
      </section>

      <section className="storyProcess" id="home-how-it-works" aria-labelledby="process-title">
        <div className="storyProcessInner">
          <div className="studioImage" role="img" aria-label="A close recording-studio view of a guitar and microphone">
            <span className="studioCredit">Photo: Saulo Leite / Pexels</span>
          </div>
          <div className="processCopy">
            <div><p className="eyebrow">Human from beginning to end</p><h2 id="process-title">Story. Song. Something lasting.</h2></div>
            <div className="processSteps">
              <div className="processStep"><strong>01</strong><div><h3>Choose the experience for your organization.</h3><p>Select a single-song group event or the complete multi-touch Honor a Life Song experience.</p></div></div>
              <div className="processStep"><strong>02</strong><div><h3>We listen to the people you serve.</h3><p>Participants join in flexible ways while human songwriters shape shared or individual stories with care.</p></div></div>
              <div className="processStep"><strong>03</strong><div><h3>Celebrate, then share with permission.</h3><p>Present the music, return to approved event materials, and privately connect participants and families to what was created for them.</p></div></div>
            </div>
            <Link className="button primary" href="/how-it-works">Explore the complete journey</Link>
          </div>
        </div>
      </section>

      <section className="visualSection" id="program-highlights" aria-labelledby="program-title">
        <div className="visualIntro">
          <div><p className="eyebrow">Two ways to begin</p><h2 id="program-title">Choose the experience that fits your community.</h2></div>
          <p>Both options belong to your organization account, build its event history, and create a path back to approved songs and memories.</p>
        </div>
        <div className="programMosaic">
          <Link className="programTile" href="/services#single-song-group-event"><div><h3>$200 Single-Song Group Event</h3><p>Shared story capture, one group song, and an event presentation.</p></div></Link>
          <Link className="programTile" href="/services#honor-a-life-song-experience"><div><h3>$2,500 Honor a Life Song Experience</h3><p>Participant stories, multiple songs, family involvement, and a follow-up concert.</p></div></Link>
          <Link className="programTile" href="/how-it-works"><div><h3>See the journey</h3><p>From organization planning through the post-event participant and family connection.</p></div></Link>
        </div>
      </section>

      <section className="permissionScene" id="testimonials" aria-labelledby="permission-title">
        <div className="permissionSceneMark" aria-hidden="true">“</div>
        <div>
          <p className="eyebrow">Real voices, shared with care</p>
          <h2 id="permission-title">A meaningful story is never marketing material by default.</h2>
          <p>We only share a song, photograph, or testimonial publicly when the person represented—or their authorized representative—has chosen to allow it.</p>
        </div>
      </section>

      <section className="closingScene" id="request-a-song" aria-labelledby="closing-title">
        <div>
          <p className="eyebrow">Bring it to your community</p>
          <h2 id="closing-title">Whose stories could your organization help people hear?</h2>
          <p>You do not need to arrive with a finished program. Start with the people you serve, the kind of gathering you imagine, and the experience you want them to carry forward.</p>
          <Link className="button" href="/begin">Plan an experience</Link>
        </div>
      </section>
    </PublicShell>
  );
}
