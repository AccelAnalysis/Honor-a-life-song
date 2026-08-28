"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { createOrganizationAccount } from "@/lib/firebase/organization-account";
import type { OrganizationKind } from "@/domain/types";
import styles from "./create-account-route.module.css";

type AccountKind = "individual" | "organization";

const organizationKinds: Array<{ value: OrganizationKind; label: string }> = [
  { value: "facility", label: "Senior living or care community" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "school", label: "School or education organization" },
  { value: "healthcare", label: "Healthcare organization" },
  { value: "veterans_organization", label: "Veterans organization" },
  { value: "faith_community", label: "Faith community" },
  { value: "business", label: "Business" },
  { value: "community_partner", label: "Community organization" },
  { value: "other", label: "Other organization" }
];

export function CreateAccountRoute() {
  const router = useRouter();
  const { createAccount, status, configurationError } = useAuth();
  const [accountKind, setAccountKind] = useState<AccountKind>("organization");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const organizationName = String(form.get("organizationName") ?? "").trim();
    const organizationKind = String(form.get("organizationKind") ?? "community_partner") as OrganizationKind;

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (accountKind === "organization" && !organizationName) {
      setError("Enter the organization name.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const user = await createAccount({ displayName, email, password });
      if (accountKind === "organization") {
        const organizationId = await createOrganizationAccount({
          userId: user.uid,
          email,
          displayName,
          organizationName,
          kind: organizationKind
        });
        router.push(`/organization?org=${organizationId}`);
      } else {
        router.push("/customer");
      }
    } catch (accountError) {
      setError(accountError instanceof Error ? accountError.message : "We could not create the account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className={styles.shell}>
    <section className={styles.story}>
      <Link href="/" className={styles.brand}>Honor a Life Song</Link>
      <div>
        <p className={styles.kicker}>One account, every experience</p>
        <h1>Keep the relationship going long after the event.</h1>
        <p>Organizations can manage agreements, team access, upcoming experiences, completed events, songs, lyrics, videos, and future dates from one place.</p>
      </div>
    </section>

    <section className={styles.formSide} aria-labelledby="create-account-title">
      <div className={styles.formInner}>
        <p className={styles.kicker}>Create your account</p>
        <h2 id="create-account-title">How will you use Honor a Life Song?</h2>
        <div className={styles.accountChoice} role="group" aria-label="Account type">
          <button type="button" aria-pressed={accountKind === "organization"} onClick={() => setAccountKind("organization")}>Organization</button>
          <button type="button" aria-pressed={accountKind === "individual"} onClick={() => setAccountKind("individual")}>Individual or family</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label><span>Your name</span><input required name="displayName" autoComplete="name" /></label>
          <label><span>Email address</span><input required type="email" name="email" autoComplete="email" /></label>

          {accountKind === "organization" ? <>
            <label><span>Organization name</span><input required name="organizationName" autoComplete="organization" /></label>
            <label><span>Organization type</span><select name="organizationKind" defaultValue="facility">{organizationKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
          </> : null}

          <label><span>Password</span><input required minLength={8} type="password" name="password" autoComplete="new-password" /></label>
          <label><span>Confirm password</span><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" /></label>

          <p className={styles.legal}>By creating an account, you are creating secure access to the platform. Service agreements, event scopes, participant permissions, and electronic signatures are completed separately when they apply.</p>
          <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Creating account…" : accountKind === "organization" ? "Create organization account" : "Create account"}</button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
        </form>
        <p className={styles.signIn}>Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </section>
  </main>;
}
