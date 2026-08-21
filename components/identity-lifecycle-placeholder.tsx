import Link from "next/link";

export function IdentityLifecyclePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="centeredPage">
      <section className="authCard">
        <Link className="brand" href="/">Honor a Life Song</Link>
        <p className="eyebrow">Identity / Access Shell</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="unavailable">
          <strong>Workflow reserved; production identity service not connected</strong>
          <span>This destination is part of the governed identity lifecycle. It is exposed so Login has a concrete exit path, but this Login slice does not simulate the separate production workflow.</span>
        </div>
        <div className="buttonRow">
          <Link className="button secondary" href="/login">Return to Login</Link>
          <Link className="button secondary" href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
