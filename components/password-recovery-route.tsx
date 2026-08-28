"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";

export function PasswordRecoveryRoute() {
  const { sendPasswordReset, status, configurationError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "We could not send the reset email.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="centeredPage"><section className="authCard">
    <p className="eyebrow">Account access</p>
    <h1>Reset your password</h1>
    {sent ? <><p>If an account can receive password recovery at that address, Firebase has sent the recovery email.</p><Link href="/login">Return to sign in</Link></> : <form onSubmit={submit}>
      <label><span>Email address</span><input required type="email" name="email" autoComplete="email" /></label>
      <button disabled={busy || status === "unavailable"} type="submit">{busy ? "Sending…" : "Send reset email"}</button>
      {error ? <p role="alert">{error}</p> : null}
      {configurationError ? <p role="status">{configurationError}</p> : null}
    </form>}
  </section></main>;
}
