import Link from "next/link";

export function IdentityLifecyclePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="centeredPage">
      <section className="authCard">
        <Link className="brand" href="/">Honor a Life Song</Link>
        <p className="eyebrow">Account access</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="unavailable">
          <strong>This online feature is not available yet.</strong>
          <span>If you need help with an existing song, invitation, or account, return to sign in or the Honor a Life Song home page.</span>
        </div>
        <div className="buttonRow">
          <Link className="button secondary" href="/login">Return to sign in</Link>
          <Link className="button secondary" href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
