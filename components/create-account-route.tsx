"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { createOrganizationAccount } from "@/lib/firebase/organization-account";
import type { OrganizationKind } from "@/domain/types";
import { safeReturnPath } from "@/lib/safe-return-path";
import styles from "./create-account-route.module.css";

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
  const searchParams = useSearchParams();
  const { createAccount, user: signedInUser, status, configurationError } = useAuth();
  const requestedNext = searchParams.get("next");
  const safeNext = safeReturnPath(requestedNext);
  const joiningOrganization = Boolean(safeNext?.startsWith("/accept-invitation"));
  const claimingMemories = Boolean(safeNext?.startsWith("/claim"));
  const accessOnly = joiningOrganization || claimingMemories;
  const completingOrganization = !accessOnly && status === "signed_in" && Boolean(signedInUser);
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
    if (!accessOnly && !organizationName) {
      setError("Enter the organization name.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const user = completingOrganization && signedInUser
        ? signedInUser
        : await createAccount({ displayName, email, password });
      if (safeNext && accessOnly) {
        router.push(safeNext);
        return;
      }
      const organizationId = await createOrganizationAccount({
        userId: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? displayName,
        organizationName,
        kind: organizationKind
      });
      if (safeNext) {
        const returnUrl = new URL(safeNext, "https://honor-a-life-song.invalid");
        returnUrl.searchParams.set("organizationId", organizationId);
        router.push(`${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`);
      } else {
        router.push(`/organization?org=${organizationId}`);
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
        <p className={styles.kicker}>{accessOnly ? "Private access" : "One organization, every experience"}</p>
        <h1>{accessOnly ? "Your own sign-in. Only what was shared with you." : "Keep every experience connected over time."}</h1>
        <p>{joiningOrganization ? "Create your personal sign-in, then return to the invitation to join the organization's existing experiences and account." : claimingMemories ? "Create a secure sign-in, then return to the invitation to keep the songs and event materials shared with you." : "Organizations can manage agreements, team access, upcoming experiences, completed events, songs, videos, and future dates from one place."}</p>
      </div>
    </section>

    <section className={styles.formSide} aria-labelledby="create-account-title">
      <div className={styles.formInner}>
        <p className={styles.kicker}>Create your account</p>
        <h2 id="create-account-title">{accessOnly ? "Create your secure sign-in." : completingOrganization ? "Finish your organization account." : "Create your organization account."}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label><span>Your name</span><input required name="displayName" autoComplete="name" defaultValue={completingOrganization ? signedInUser?.displayName ?? "" : ""} /></label>
          <label><span>Email address</span><input required type="email" name="email" autoComplete="email" defaultValue={completingOrganization ? signedInUser?.email ?? "" : ""} readOnly={completingOrganization} /></label>

          {!accessOnly ? <>
            <label><span>Organization name</span><input required name="organizationName" autoComplete="organization" /></label>
            <label><span>Organization type</span><select name="organizationKind" defaultValue="facility">{organizationKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
          </> : null}

          {!completingOrganization ? <><label><span>Password</span><input required minLength={8} type="password" name="password" autoComplete="new-password" /></label>
          <label><span>Confirm password</span><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" /></label></> : null}

          <p className={styles.legal}>By creating an account, you are creating secure access to the platform. Service agreements, event scopes, participant permissions, and electronic signatures are completed separately when they apply.</p>
          <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Saving account…" : accessOnly ? "Create account and continue" : completingOrganization ? "Finish organization account" : "Create organization account"}</button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
        </form>
        <p className={styles.signIn}>Already have an account? <Link href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login"}>Sign in</Link></p>
      </div>
    </section>
  </main>;
}
