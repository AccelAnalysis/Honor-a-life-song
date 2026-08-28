"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import { getLoginNode } from "@/lib/identity-navigation";
import { isPlatformAdmin, listUserOrganizations } from "@/lib/firebase/organization-account";
import { listUserExperienceAccess } from "@/lib/firebase/organization-invitations";
import { safeReturnPath } from "@/lib/safe-return-path";
import styles from "./login-route.module.css";

interface ScreenCopy {
  eyebrow: string;
  title: string;
  body: string;
  mode: "credentials" | "verification" | "resolving";
}

function copyForNode(nodeId?: string): ScreenCopy {
  if (nodeId === "login-mfa") {
    return { eyebrow: "Security", title: "One more step.", body: "Verify your account.", mode: "verification" };
  }
  if (["login-resolve-access", "login-person", "login-memberships", "login-roles", "login-organization", "login-enter-workspace", "login-permitted-workspaces"].includes(nodeId ?? "")) {
    return { eyebrow: "SongKeep", title: "Opening your account.", body: "Finding what belongs to you.", mode: "resolving" };
  }
  return { eyebrow: "Welcome", title: "Welcome back.", body: "Your stories, songs, and experiences are waiting.", mode: "credentials" };
}

export function LoginRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, status, configurationError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const parts = pathname.split("/").filter(Boolean);
  const loginIndex = parts.lastIndexOf("login");
  const activeSlug = loginIndex >= 0 ? parts.slice(loginIndex + 1).join("/") : "";
  const activeNode = activeSlug ? getLoginNode(activeSlug) : undefined;
  const copy = copyForNode(activeNode?.id);
  const requestedNext = searchParams.get("next");
  const safeNext = safeReturnPath(requestedNext);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    try {
      const user = await signIn(email, password);
      if (safeNext) {
        router.push(safeNext);
        return;
      }
      const admin = await isPlatformAdmin(user.uid).catch(() => false);
      if (admin) {
        router.push("/admin");
        return;
      }
      const organizations = await listUserOrganizations(user.uid).catch(() => []);
      if (organizations.length > 0) {
        router.push("/organization");
        return;
      }
      const experienceAccess = await listUserExperienceAccess(user.uid).catch(() => []);
      router.push(experienceAccess.length > 0 ? "/memories" : "/create-account?complete=organization");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "We could not sign you in. Check your email and password and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.visual} aria-label="SongKeep">
        <Link className={styles.visualBrand} href="/" aria-label="SongKeep home">
          <SongKeepLockup variant="full" inverse />
        </Link>
        <div className={styles.visualCopy}>
          <span className={styles.resonance} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
          <p>Every life has a song worth keeping.</p>
        </div>
        <span className={styles.photoCredit}>Photo: Los Muertos Crew / Pexels</span>
      </section>

      <section className={styles.entry} aria-labelledby="login-title">
        <div className={styles.entryInner}>
          <Link className={styles.mobileBrand} href="/" aria-label="SongKeep home">
            <SongKeepLockup variant="full" />
          </Link>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 id="login-title">{copy.title}</h1>
          <p className={styles.lede}>{copy.body}</p>

          {copy.mode === "credentials" ? (
            <form className={styles.form} onSubmit={handleSignIn}>
              <label><span>Email</span><input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
              <label><span>Password</span><input required type="password" name="password" autoComplete="current-password" placeholder="Password" /></label>
              <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Signing in…" : "Sign in"}</button>
              {error ? <p role="alert">{error}</p> : null}
              {configurationError ? <p role="status">{configurationError}</p> : null}
              <div className={styles.formLinks}><Link href="/password-recovery">Forgot password?</Link><Link href="/accept-invitation">Have an invitation?</Link></div>
            </form>
          ) : null}

          {copy.mode === "verification" ? <div className={styles.resolving} role="status" aria-live="polite"><span aria-hidden="true" /><div><strong>Verify your account</strong></div></div> : null}
          {copy.mode === "resolving" ? <div className={styles.resolving} role="status" aria-live="polite"><span aria-hidden="true" /><div><strong>Opening SongKeep…</strong></div></div> : null}

          <div className={styles.newHere}><span>New to SongKeep?</span><Link href={safeNext ? `/create-account?next=${encodeURIComponent(safeNext)}` : "/create-account"}>{safeNext ? "Create sign-in" : "Create account"} →</Link></div>
        </div>
      </section>
    </main>
  );
}
