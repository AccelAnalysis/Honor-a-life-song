import { PublicShell } from "@/components/public-shell";
import { Journey } from "@/components/journey";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">How it works</p>
        <h1>Choose. Create. Celebrate.</h1>
        <Journey />
        <div className="callout"><strong>Human-made, start to finish.</strong></div>
      </main>
    </PublicShell>
  );
}
