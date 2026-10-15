"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { SongKeepLockup } from "./brand";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import { customerMessage } from "@/lib/customer-messages";

export function UnsubscribeRoute() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unsubscribe() {
    if (busy || !token) return;
    setBusy(true);
    setError(null);
    try {
      const call = httpsCallable<{ token: string }, { unsubscribed: boolean }>(getFirebaseFunctions(), "songkeepUnsubscribe");
      await call({ token });
      setDone(true);
    } catch (cause) {
      setError(customerMessage(cause, "This unsubscribe link could not be confirmed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return <main className="centeredPage"><section className="authCard">
    <Link href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
    <p>Email choices</p>
    <h1>{done ? "You are unsubscribed." : "Unsubscribe from SongKeep emails."}</h1>
    {done ? <p>SongKeep will stop sending emails about your song link, another song, and group bookings. Your account and purchases stay available when you sign in.</p> : <>
      <p>This stops SongKeep emails for the account that received this message. Your songs stay in your account.</p>
      {token ? <button type="button" disabled={busy} onClick={unsubscribe}>{busy ? "Saving…" : "Unsubscribe"}</button> : <p role="alert">This unsubscribe link is incomplete. Open the link from your SongKeep email.</p>}
      {error ? <p role="alert">{error}</p> : null}
    </>}
  </section></main>;
}
