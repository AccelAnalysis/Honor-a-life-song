import Link from "next/link";
import { SonicSignature } from "@/components/brand";
import { PublicShell } from "@/components/public-shell";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="consumerHero" id="hero-value-proposition" aria-labelledby="consumer-hero-title">
        <div className="consumerHeroMedia" role="img" aria-label="A woman at a piano in a warm, lived-in home" />
        <div className="consumerHeroContent">
          <p className="eyebrow">Stories become songs.</p>
          <h1 id="consumer-hero-title">Bring their stories to life.</h1>
          <p className="consumerHeroLead">SongKeep creates meaningful music experiences for the people your organization serves.</p>
          <div className="consumerHeroActions">
            <Link className="button primary" href="/services">Choose an experience</Link>
            <Link className="button secondary" href="/how-it-works">How it works</Link>
          </div>
          <SonicSignature inverse label="Hear SongKeep" />
        </div>
        <span className="consumerHeroCredit">Photo: Centre for Ageing Better / Pexels</span>
      </section>

      <section className="consumerScene" id="featured-stories-songs" aria-labelledby="listening-title">
        <div className="consumerSceneImage" role="img" aria-label="A woman listening quietly in a sunlit room">
          <span className="consumerSceneCredit">Photo: Los Muertos Crew / Pexels</span>
        </div>
        <div className="consumerSceneCopy">
          <p className="eyebrow">Listen first.</p>
          <h2 id="listening-title">A life, heard.</h2>
          <div className="resonanceLine" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
          <p>Real stories become songs participants and families can keep.</p>
          <Link className="textLink" href="/how-it-works">See the journey →</Link>
        </div>
      </section>

      <section className="visualSection" aria-labelledby="song-collection-title">
        <div className="visualIntro">
          <div>
            <p className="eyebrow">Songs worth keeping</p>
            <h2 id="song-collection-title">Made from real lives.</h2>
          </div>
          <p>Private when they should be. Shared when permitted.</p>
        </div>
        <div className="songGallery" aria-label="Song artwork collection">
          <article className="songCover">
            <div className="songCoverMeta"><small>Participant song</small><h3>One life.</h3><p>Song · lyrics · keepsake</p></div>
          </article>
          <article className="songCover">
            <div className="songCoverMeta"><small>Group event</small><h3>One shared song.</h3><p>Stories brought together.</p></div>
          </article>
          <article className="songCover">
            <div className="songCoverMeta"><small>Full experience</small><h3>A community in music.</h3><p>Stories · songs · concert</p></div>
          </article>
        </div>
      </section>

      <section className="storyProcess" id="home-how-it-works" aria-labelledby="process-title">
        <div className="storyProcessInner">
          <div className="studioImage" role="img" aria-label="A close recording-studio view of a guitar and microphone">
            <span className="studioCredit">Photo: Saulo Leite / Pexels</span>
          </div>
          <div className="processCopy">
            <div><p className="eyebrow">Human from start to finish</p><h2 id="process-title">From story to song.</h2></div>
            <div className="processSteps">
              <div className="processStep"><strong>01</strong><div><h3>Choose.</h3><p>Pick the experience that fits your community.</p></div></div>
              <div className="processStep"><strong>02</strong><div><h3>Listen.</h3><p>We gather stories and shape them into music.</p></div></div>
              <div className="processStep"><strong>03</strong><div><h3>Celebrate.</h3><p>Share the music, then keep what was created.</p></div></div>
            </div>
            <Link className="button primary" href="/how-it-works">How it works</Link>
          </div>
        </div>
      </section>

      <section className="visualSection" id="program-highlights" aria-labelledby="program-title">
        <div className="visualIntro">
          <div><p className="eyebrow">Two ways to begin</p><h2 id="program-title">Choose your experience.</h2></div>
        </div>
        <div className="programMosaic">
          <Link className="programTile" href="/begin?offering=single-song-group-event"><div><h3>$200 Group Event</h3><p>One shared song.</p></div></Link>
          <Link className="programTile" href="/begin?offering=honor-a-life-song-experience"><div><h3>$2,500 Honor a Life Song</h3><p>Stories, songs, and a follow-up concert.</p></div></Link>
        </div>
      </section>

      <section className="permissionScene" id="testimonials" aria-labelledby="permission-title">
        <div className="permissionSceneMark" aria-hidden="true">“</div>
        <div>
          <p className="eyebrow">Shared with care</p>
          <h2 id="permission-title">Shared only with permission.</h2>
          <p>People stay in control of how their stories and media are used.</p>
        </div>
      </section>

      <section className="closingScene" id="request-a-song" aria-labelledby="closing-title">
        <div>
          <p className="eyebrow">SongKeep</p>
          <h2 id="closing-title">Bring it to your community.</h2>
          <p>Choose an experience. We’ll guide the rest.</p>
          <Link className="button" href="/begin">Get started</Link>
        </div>
      </section>
    </PublicShell>
  );
}
