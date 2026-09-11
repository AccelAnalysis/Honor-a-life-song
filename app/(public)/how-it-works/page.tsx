import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main>
        <section className="storyProcess" aria-labelledby="how-it-works-title">
          <div className="storyProcessInner">
            <div className="studioImage" role="img" aria-label="A close recording-studio view of a guitar and microphone"><span className="studioCredit">Photo: Saulo Leite / Pexels</span></div>
            <div className="processCopy">
              <div><p className="eyebrow">How it works</p><h2 id="how-it-works-title">From story to song.</h2></div>
              <div className="processSteps" aria-label="Choose, create, celebrate">
                <div className="processStep"><strong>01</strong><div><h3>Choose.</h3><p>Choose the SongKeep experience that fits your family, community, or team.</p></div></div>
                <div className="processStep"><strong>02</strong><div><h3>Create.</h3><p>Share the stories that matter and shape them into songs worth keeping.</p></div></div>
                <div className="processStep"><strong>03</strong><div><h3>Celebrate.</h3><p>Gather your people, experience the music together, and keep what matters.</p></div></div>
              </div>
              <Link className="button primary" href="/services">Choose an experience</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
