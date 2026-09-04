"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import type { PreferredContactMethod } from "@/domain/organization-account";
import type { OrganizationKind } from "@/domain/types";
import { createOrganizationRelationship } from "@/lib/firebase/organization-onboarding";
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
    const organizationKind = String(form.get("organizationKind") ?? "facility") as OrganizationKind;
    const contactTitle = String(form.get("contactTitle") ?? "").trim();
    const contactPhone = String(form.get("contactPhone") ?? "").trim();
    const organizationEmail = String(form.get("organizationEmail") ?? "").trim();
    const organizationPhone = String(form.get("organizationPhone") ?? "").trim();
    const preferredContactMethod = String(form.get("preferredContactMethod") ?? "email") as PreferredContactMethod;

    if (!completingOrganization && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!accessOnly && !organizationName) {
      setError("Enter the organization name.");
      return;
    }
    if (!accessOnly && (!contactTitle || !contactPhone)) {
      setError("Enter the primary contact’s title and phone number.");
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
      const organizationId = await createOrganizationRelationship({
        userId: user.uid,
        contactEmail: user.email ?? email,
        contactName: user.displayName ?? displayName,
        contactTitle,
        contactPhone,
        preferredContactMethod,
        organizationName,
        organizationKind,
        organizationEmail: organizationEmail || undefined,
        organizationPhone: organizationPhone || undefined
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
      <Link href="/" className={styles.brand} aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div>
        <p className={styles.kicker}>{accessOnly ? "Private access" : "Your organization"}</p>
        <h1>{accessOnly ? "Keep what was shared with you." : "One account. Every experience."}</h1>
        <p>{joiningOrganization ? "Create your sign-in to join your team." : claimingMemories ? "Create your sign-in to keep your songs and memories." : "The organization keeps its history even when contacts or roles change."}</p>
      </div>
    </section>

    <section className={styles.formSide} aria-labelledby="create-account-title">
      <div className={styles.formInner}>
        <div className={styles.formBrand}><SongKeepLockup variant="app" /></div>
        <p className={styles.kicker}>Account</p>
        <h2 id="create-account-title">{accessOnly ? "Create sign-in." : completingOrganization ? "Finish organization setup." : "Create your organization account."}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <fieldset>
            <legend>{accessOnly ? "Your sign-in" : "Primary contact"}</legend>
            <p>{accessOnly ? "Use your own name and email." : "This person receives initial follow-up and can be changed later without changing the organization account."}</p>
            <div className={styles.fieldGrid}>
              <label><span>Name</span><input required name="displayName" autoComplete="name" defaultValue={completingOrganization ? signedInUser?.displayName ?? "" : ""} /></label>
              {!accessOnly ? <label><span>Title or role</span><input required name="contactTitle" autoComplete="organization-title" placeholder="Activities Director" /></label> : null}
              <label><span>Email</span><input required type="email" name="email" autoComplete="email" defaultValue={completingOrganization ? signedInUser?.email ?? "" : ""} readOnly={completingOrganization} /></label>
              {!accessOnly ? <label><span>Phone</span><input required type="tel" name="contactPhone" autoComplete="tel" inputMode="tel" /></label> : null}
              {!accessOnly ? <label className={styles.fullWidth}><span>Preferred contact</span><select name="preferredContactMethod" defaultValue="email"><option value="email">Email</option><option value="phone">Phone call</option><option value="text">Text message</option></select></label> : null}
            </div>
          </fieldset>

          {!accessOnly ? <fieldset>
            <legend>Organization</legend>
            <p>Organization details stay with the customer record even if the primary contact changes.</p>
            <div className={styles.fieldGrid}>
              <label className={styles.fullWidth}><span>Organization name</span><input required name="organizationName" autoComplete="organization" /></label>
              <label className={styles.fullWidth}><span>Organization type</span><select name="organizationKind" defaultValue="facility">{organizationKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
              <label><span>Organization email <small>Optional</small></span><input type="email" name="organizationEmail" autoComplete="work email" /></label>
              <label><span>Main phone <small>Optional</small></span><input type="tel" name="organizationPhone" autoComplete="organization tel" inputMode="tel" /></label>
            </div>
          </fieldset> : null}

          {!completingOrganization ? <fieldset>
            <legend>Secure sign-in</legend>
            <div className={styles.fieldGrid}>
              <label><span>Password</span><input required minLength={8} type="password" name="password" autoComplete="new-password" /></label>
              <label><span>Confirm password</span><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" /></label>
            </div>
          </fieldset> : null}

          <p className={styles.legal}>Organization agreements and each participant’s permission choices are completed separately.</p>
          <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Saving…" : accessOnly ? "Create & continue" : completingOrganization ? "Save organization" : "Create organization account"}</button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
        </form>
        <p className={styles.signIn}>Already have an account? <Link href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login"}>Sign in</Link></p>
      </div>
    </section>
  </main>;
}
