"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "./auth-provider";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./create-account-route.module.css";
export function SignInForm({ onComplete, next }: { onComplete: (user: User) => Promise<void> | void; next?: string }) {
  const { signIn, status, configurationError } = useAuth();
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try { await onComplete(await signIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""))); }
    catch (cause) { setError(customerMessage(cause, "We could not sign you in. Please try again.")); }
    finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit} aria-label="Sign in" aria-busy={busy}>
    <label><span>Email</span><input required name="email" type="email" autoComplete="username" /></label>
    <label><span>Password</span><input required name="password" type="password" autoComplete="current-password" /></label>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
    <button type="submit" disabled={busy || status === "loading" || status === "unavailable"}>{busy ? "Signing in…" : "Sign in & continue"}</button>
    <Link className={styles.signIn} href={`/password-recovery${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Forgot password?</Link>
  </form>;
}
