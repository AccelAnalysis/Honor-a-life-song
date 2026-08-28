"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { safeReturnPath } from "@/lib/safe-return-path";

export function VerifyEmailRoute() {
  const { user, status, resendVerification, configurationError } = useAuth();
  const searchParams = useSearchParams();
  const nextPath = safeReturnPath(searchParams.get("next"));
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      await resendVerification();
      setSent(true);
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "We could not resend the verification email.");
    } finally {
      setBusy(false);
    }
  }

  async function continueAfterVerification() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await user.reload();
      await user.getIdToken(true);
      if (!user.emailVerified) {
        setError("Email not verified yet.");
        return;
      }
      window.location.assign(nextPath ?? "/organization");
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "We could not refresh verification.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <main className="centeredPage"><section className="authCard"><p>Checking…</p></section></main>;
  if (status === "signed_out" || !user) {
    const returnPath = `/verify-email${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
    return <main className="centeredPage"><section className="authCard"><h1>Sign in to verify.</h1><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link></section></main>;
  }

  return <main className="centeredPage"><section className="authCard">
    <p className="eyebrow">SongKeep</p>
    <h1>{user.emailVerified ? "Email verified." : "Verify your email."}</h1>
    {!user.emailVerified ? <p>{user.email ?? "Check your inbox."}</p> : null}
    {!user.emailVerified ? <button disabled={busy || status === "unavailable"} type="button" onClick={resend}>{busy ? "Sending…" : "Resend email"}</button> : null}
    {!user.emailVerified ? <button disabled={busy} type="button" onClick={continueAfterVerification}>I&apos;ve verified</button> : null}
    {sent ? <p role="status">Email sent.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {configurationError ? <p role="status">{configurationError}</p> : null}
    {user.emailVerified ? <Link href={nextPath ?? "/organization"}>Continue</Link> : null}
  </section></main>;
}
