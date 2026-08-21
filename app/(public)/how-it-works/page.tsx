import { PublicShell } from "@/components/public-shell";
import { Journey } from "@/components/journey";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">Meaning-to-Song Engine</p>
        <h1>How Honor a Life Song works</h1>
        <p className="lede">The public journey follows six understandable stages: share the story, capture it through human conversation, shape the song, review it, produce it and deliver the approved keepsake.</p>
        <Journey />
        <div className="callout">
          <strong>One shared journey:</strong> These public stages describe the service experience. The deeper operational state machine remains in the chassis so individual songs and Project Ageless can use the same governed story, creative-work, approval, production and delivery services.
        </div>
      </main>
    </PublicShell>
  );
}
