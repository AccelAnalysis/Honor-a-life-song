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
    <p className="eyebrow">SongKeep</p>
    <h1>Reset password</h1>
    {sent ? <><p>Check your email.</p><Link href="/login">Back to sign in</Link></> : <form onSubmit={submit}>
      <label><span>Email</span><input required type="email" name="email" autoComplete="email" /></label>
      <button disabled={busy || status === "unavailable"} type="submit">{busy ? "Sending…" : "Send reset link"}</button>
      {error ? <p role="alert">{error}</p> : null}
      {configurationError ? <p role="status">{configurationError}</p> : null}
    </form>}
  </section></main>;
}
