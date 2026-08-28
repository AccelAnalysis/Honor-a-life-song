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
        const returnUrl = new URL(safeNext, "https://songkeep.invalid");
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
      <Link href="/" className={styles.brand}>SongKeep</Link>
      <div>
        <p className={styles.kicker}>{accessOnly ? "Private access" : "SongKeep"}</p>
        <h1>{accessOnly ? "Keep what was shared with you." : "One account. Every experience."}</h1>
        <p>{joiningOrganization ? "Create your sign-in to join your team." : claimingMemories ? "Create your sign-in to keep your songs and memories." : "Plan events. Manage your team. Keep your songs and memories."}</p>
      </div>
    </section>

    <section className={styles.formSide} aria-labelledby="create-account-title">
      <div className={styles.formInner}>
        <p className={styles.kicker}>Account</p>
        <h2 id="create-account-title">{accessOnly ? "Create sign-in." : completingOrganization ? "Finish setup." : "Create your account."}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label><span>Name</span><input required name="displayName" autoComplete="name" defaultValue={completingOrganization ? signedInUser?.displayName ?? "" : ""} /></label>
          <label><span>Email</span><input required type="email" name="email" autoComplete="email" defaultValue={completingOrganization ? signedInUser?.email ?? "" : ""} readOnly={completingOrganization} /></label>

          {!accessOnly ? <>
            <label><span>Organization</span><input required name="organizationName" autoComplete="organization" /></label>
            <label><span>Type</span><select name="organizationKind" defaultValue="facility">{organizationKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
          </> : null}

          {!completingOrganization ? <><label><span>Password</span><input required minLength={8} type="password" name="password" autoComplete="new-password" /></label>
          <label><span>Confirm password</span><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" /></label></> : null}

          <p className={styles.legal}>Agreements and participant permissions are completed separately.</p>
          <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Saving…" : accessOnly ? "Create & continue" : completingOrganization ? "Finish setup" : "Create account"}</button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
        </form>
        <p className={styles.signIn}>Already have an account? <Link href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login"}>Sign in</Link></p>
      </div>
    </section>
  </main>;
}
