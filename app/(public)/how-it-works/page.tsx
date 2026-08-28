import { PublicShell } from "@/components/public-shell";
import { Journey } from "@/components/journey";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">How It Works</p>
        <h1>From an organization&apos;s idea to songs and memories people can keep</h1>
        <p className="lede">Your organization chooses an experience and prepares the setting. Participants join in ways that work for them, human songwriters shape what they hear, and the event becomes a bridge to carefully shared post-event memories.</p>
        <Journey />
        <div className="callout">
          <strong>Human from beginning to end:</strong> Stories are interpreted and shaped by people who listen for the details, relationships, and meaning that make each participant&apos;s experience their own.
        </div>
      </main>
    </PublicShell>
  );
}
