import { PublicShell } from "@/components/public-shell";
import { Journey } from "@/components/journey";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">How It Works</p>
        <h1>From a life story to a song you can keep</h1>
        <p className="lede">We begin by listening. From there, a human songwriter shapes the story, works with you through review, produces the recording, and delivers a finished keepsake made to last.</p>
        <Journey />
        <div className="callout">
          <strong>Human from beginning to end:</strong> Your memories are interpreted and shaped by people who listen for the details, relationships, and meaning that make the story yours.
        </div>
      </main>
    </PublicShell>
  );
}
