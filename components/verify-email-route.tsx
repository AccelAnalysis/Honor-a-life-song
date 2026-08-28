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
        setError("This email has not been verified yet. Open the verification message, then try again.");
        return;
      }
      window.location.assign(nextPath ?? "/organization");
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "We could not refresh the verification status.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <main className="centeredPage"><section className="authCard"><p>Checking your account…</p></section></main>;
  if (status === "signed_out" || !user) {
    const returnPath = `/verify-email${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
    return <main className="centeredPage"><section className="authCard"><h1>Sign in to verify your email.</h1><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link></section></main>;
  }

  return <main className="centeredPage"><section className="authCard">
    <p className="eyebrow">Account security</p>
    <h1>{user.emailVerified ? "Your email is verified." : "Verify your email"}</h1>
    <p>{user.emailVerified ? "This email address has been confirmed for your Honor a Life Song account." : `We sent a verification message to ${user.email ?? "your email address"}. Open that message to confirm your address.`}</p>
    {!user.emailVerified ? <button disabled={busy || status === "unavailable"} type="button" onClick={resend}>{busy ? "Sending…" : "Resend verification email"}</button> : null}
    {!user.emailVerified ? <button disabled={busy} type="button" onClick={continueAfterVerification}>I&apos;ve verified my email</button> : null}
    {sent ? <p role="status">Verification email sent.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {configurationError ? <p role="status">{configurationError}</p> : null}
    {user.emailVerified ? <Link href={nextPath ?? "/organization"}>Continue</Link> : null}
  </section></main>;
}
