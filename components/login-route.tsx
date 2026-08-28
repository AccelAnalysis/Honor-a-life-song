"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLoginNode } from "@/lib/identity-navigation";
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
      body: "Enter the verification code from your secure sign-in message.",
      mode: "verification"
    };
  }

  if (["login-resolve-access", "login-person", "login-memberships", "login-roles", "login-organization"].includes(nodeId ?? "")) {
    return {
      eyebrow: "Welcome back",
      title: "Finding the right place for you.",
      body: "Your account can connect you to a personal song, a family collaboration, a program, or the creative work you help make.",
      mode: "resolving"
    };
  }

  if (["login-enter-workspace", "login-permitted-workspaces"].includes(nodeId ?? "")) {
    return {
      eyebrow: "Almost there",
      title: "Opening your song journey.",
      body: "Only the songs, stories, and programs shared with this account will be available.",
      mode: "resolving"
    };
  }

  return {
    eyebrow: "Return to something meaningful",
    title: "Welcome back to your song.",
    body: "Sign in to continue a story, review a lyric, hear a finished song, or join someone you love in the process.",
    mode: "credentials"
  };
}

export function LoginRoute() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const loginIndex = parts.lastIndexOf("login");
  const activeSlug = loginIndex >= 0 ? parts.slice(loginIndex + 1).join("/") : "";
  const activeNode = activeSlug ? getLoginNode(activeSlug) : undefined;
  const copy = copyForNode(activeNode?.id);

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
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              <label>
                <span>Email address</span>
                <input type="email" name="email" autoComplete="email" placeholder="you@example.com" />
              </label>
              <label>
                <span>Password</span>
                <input type="password" name="password" autoComplete="current-password" placeholder="Your password" />
              </label>
              <button type="submit" disabled aria-describedby="sign-in-availability-note">Continue to your song</button>
              <div className={styles.formLinks}>
                <Link href="/password-recovery">Forgot your password?</Link>
                <Link href="/accept-invitation">Have an invitation?</Link>
              </div>
            </form>
          ) : null}

          {copy.mode === "verification" ? (
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              <label>
                <span>Verification code</span>
                <input type="text" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" />
              </label>
              <button type="submit" disabled aria-describedby="sign-in-availability-note">Verify and continue</button>
              <Link className={styles.quietLink} href="/login">Use a different account</Link>
            </form>
          ) : null}

          {copy.mode === "resolving" ? (
            <div className={styles.resolving} role="status" aria-live="polite">
              <span aria-hidden="true" />
              <div><strong>Your privacy comes first.</strong><p>We only open songs, stories, and programs this account is allowed to see.</p></div>
            </div>
          ) : null}

          <p className={styles.previewNote} id="sign-in-availability-note">Online account sign-in is not available yet. If you need help accessing an existing song, invitation, or program, contact Honor a Life Song.</p>

          <div className={styles.newHere}>
            <span>New to Honor a Life Song?</span>
            <Link href="/create-account">Begin your song journey →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
