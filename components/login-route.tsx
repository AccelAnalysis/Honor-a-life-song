"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { SignInForm } from "./sign-in-form";
import { SongKeepLockup } from "./brand";
import { isPlatformAdmin, listUserOrganizations } from "@/lib/firebase/organization-account";
import { listUserExperienceAccess } from "@/lib/firebase/organization-invitations";
import { listCreatorAssignments } from "@/lib/firebase/creator-deliverables";
import { safeReturnPath } from "@/lib/safe-return-path";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./login-route.module.css";

export function LoginRoute() {
  const router = useRouter(), params = useSearchParams();
  const { user, status, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const requestedNext = safeReturnPath(params.get("next"));
  const next = requestedNext && !/^\/login(?:[/?#]|$)/.test(requestedNext) ? requestedNext : null;
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    (async () => {
      if (next) { router.replace(next); return; }
      if (await isPlatformAdmin(user.uid)) { if (!cancelled) router.replace("/admin"); return; }
      const organizations = await listUserOrganizations(user.uid);
      if (organizations.length) { if (!cancelled) router.replace("/organization"); return; }
      const [access, assignments] = await Promise.all([listUserExperienceAccess(user.uid), listCreatorAssignments(user.uid)]);
      if (!cancelled) router.replace(access.length ? "/memories" : assignments.length ? "/creator/deliverables" : "/create-account");
    })().catch(cause => { if (!cancelled) setError(customerMessage(cause, "We could not open your account. Please try again.")); });
    return () => { cancelled = true; };
  }, [user, next, retry, router]);
  return <main className={styles.shell}>
    <section className={styles.visual} aria-label="SongKeep">
      <Link className={styles.visualBrand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div className={styles.visualCopy}><span className={styles.resonance} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span><p>Every life has a song worth keeping.</p></div>
      <span className={styles.photoCredit}>Photo: Pexels</span>
    </section>
    <section className={styles.entry} aria-labelledby="login-title"><div className={styles.entryInner}>
      <Link className={styles.mobileBrand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="full" /></Link>
      <p className={styles.eyebrow}>Welcome{user ? " back" : ""}</p><h1 id="login-title">{user ? "Opening your account." : "Sign in to continue."}</h1>
      <p className={styles.lede}>Your songs, experiences, and invoices. Together in one place.</p>
      {user || status === "loading" ? <div className={styles.form}>
        {error ? <><p role="alert">{error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button><button onClick={() => void signOut().catch(cause => setError(customerMessage(cause)))}>Use another account</button></> : <p role="status">Opening SongKeep…</p>}
      </div> : <SignInForm next={next ?? undefined} onComplete={() => undefined} />}
      {!user ? <div className={styles.newHere}><span>New to SongKeep?</span><Link href={next ? `/create-account?next=${encodeURIComponent(next)}` : "/create-account"}>Create account →</Link></div> : null}
    </div></section>
  </main>;
}
