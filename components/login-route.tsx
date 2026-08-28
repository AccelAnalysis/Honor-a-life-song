"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { getLoginNode } from "@/lib/identity-navigation";
import { isPlatformAdmin, listUserOrganizations } from "@/lib/firebase/organization-account";
import styles from "./login-route.module.css";

interface ScreenCopy {
  eyebrow: string;
  title: string;
  body: string;
  mode: "credentials" | "verification" | "resolving";
}

function copyForNode(nodeId?: string): ScreenCopy {
  if (nodeId === "login-mfa") {
    return {
      eyebrow: "One more step",
      title: "Keep this song private.",
      body: "Complete the additional verification requested for your account.",
      mode: "verification"
    };
  }

  if (["login-resolve-access", "login-person", "login-memberships", "login-roles", "login-organization"].includes(nodeId ?? "")) {
    return {
      eyebrow: "Welcome back",
      title: "Finding the right place for you.",
      body: "Your account can connect you to a personal song, an organization, a family collaboration, or the creative work you help make.",
      mode: "resolving"
    };
  }

  if (["login-enter-workspace", "login-permitted-workspaces"].includes(nodeId ?? "")) {
    return {
      eyebrow: "Almost there",
      title: "Opening your experience.",
      body: "Only the songs, stories, organizations, and programs shared with this account will be available.",
      mode: "resolving"
    };
  }

  return {
    eyebrow: "Return to something meaningful",
    title: "Welcome back.",
    body: "Sign in to manage your experience, review a song, access an organization account, or revisit something created together.",
    mode: "credentials"
  };
}

export function LoginRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { signIn, status, configurationError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const parts = pathname.split("/").filter(Boolean);
  const loginIndex = parts.lastIndexOf("login");
  const activeSlug = loginIndex >= 0 ? parts.slice(loginIndex + 1).join("/") : "";
  const activeNode = activeSlug ? getLoginNode(activeSlug) : undefined;
  const copy = copyForNode(activeNode?.id);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    try {
      const user = await signIn(email, password);
      const admin = await isPlatformAdmin(user.uid).catch(() => false);
      if (admin) {
        router.push("/admin");
        return;
      }
      const organizations = await listUserOrganizations(user.uid).catch(() => []);
      router.push(organizations.length > 0 ? "/organization" : "/customer");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "We could not sign you in. Check your email and password and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.visual} aria-label="Honor a Life Song listening experience">
        <Link className={styles.visualBrand} href="/">Honor a Life Song</Link>
        <div className={styles.visualCopy}>
          <span className={styles.resonance} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
          <p>The moments you remember become the song you keep.</p>
        </div>
        <span className={styles.photoCredit}>Photo: Los Muertos Crew / Pexels</span>
      </section>

      <section className={styles.entry} aria-labelledby="login-title">
        <div className={styles.entryInner}>
          <Link className={styles.mobileBrand} href="/">Honor a Life Song</Link>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 id="login-title">{copy.title}</h1>
          <p className={styles.lede}>{copy.body}</p>

          {copy.mode === "credentials" ? (
            <form className={styles.form} onSubmit={handleSignIn}>
              <label>
                <span>Email address</span>
                <input required type="email" name="email" autoComplete="email" placeholder="you@example.com" />
              </label>
              <label>
                <span>Password</span>
                <input required type="password" name="password" autoComplete="current-password" placeholder="Your password" />
              </label>
              <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Signing in…" : "Continue"}</button>
              {error ? <p role="alert">{error}</p> : null}
              {configurationError ? <p role="status">{configurationError}</p> : null}
              <div className={styles.formLinks}>
                <Link href="/password-recovery">Forgot your password?</Link>
                <Link href="/accept-invitation">Have an invitation?</Link>
              </div>
            </form>
          ) : null}

          {copy.mode === "verification" ? (
            <div className={styles.resolving} role="status" aria-live="polite">
              <span aria-hidden="true" />
              <div><strong>Additional verification</strong><p>If multi-factor authentication is enabled for this Firebase project, the provider flow will continue from here.</p></div>
            </div>
          ) : null}

          {copy.mode === "resolving" ? (
            <div className={styles.resolving} role="status" aria-live="polite">
              <span aria-hidden="true" />
              <div><strong>Your privacy comes first.</strong><p>We only open songs, stories, organizations, and programs this account is allowed to see.</p></div>
            </div>
          ) : null}

          <div className={styles.newHere}>
            <span>New to Honor a Life Song?</span>
            <Link href="/create-account">Create your account →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
