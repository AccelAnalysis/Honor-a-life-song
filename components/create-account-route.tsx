"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import { createOrganizationWithPrimaryContact } from "@/lib/firebase/customer-lifecycle";
import type { OrganizationKind } from "@/domain/types";
import { safeReturnPath } from "@/lib/safe-return-path";
import styles from "./create-account-route.module.css";

const organizationKinds: Array<{ value: OrganizationKind; label: string }> = [
  { value: "facility", label: "Senior living or care community" },
  { value: "business", label: "Business" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "faith_community", label: "Faith community" },
  { value: "healthcare", label: "Healthcare organization" },
  { value: "school", label: "School or education organization" },
  { value: "veterans_organization", label: "Veterans organization" },
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
  const respondingToPermissions = Boolean(safeNext?.startsWith("/participate"));
  const accessOnly = joiningOrganization || claimingMemories || respondingToPermissions;
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

    if (!completingOrganization && password !== confirmPassword) {
      setError("The passwords do not match.");
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

      const organizationId = await createOrganizationWithPrimaryContact({
        userId: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? displayName,
        contactTitle: String(form.get("contactTitle") ?? ""),
        contactPhone: String(form.get("contactPhone") ?? ""),
        organizationName: String(form.get("organizationName") ?? ""),
        organizationKind: String(form.get("organizationKind") ?? "facility") as OrganizationKind,
        organizationEmail: String(form.get("organizationEmail") ?? ""),
        organizationPhone: String(form.get("organizationPhone") ?? ""),
        website: String(form.get("website") ?? ""),
        address: String(form.get("address") ?? "")
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

  const accessHeading = joiningOrganization
    ? "Join your organization."
    : respondingToPermissions
      ? "Respond to your invitation."
      : "Keep what was shared with you.";

  return <main className={styles.shell}>
    <section className={styles.story}>
      <Link href="/" className={styles.brand} aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div>
        <p className={styles.kicker}>{accessOnly ? "Private access" : "SongKeep for organizations"}</p>
        <h1>{accessOnly ? accessHeading : "One relationship. Every experience."}</h1>
        <p>{accessOnly
          ? "Your sign-in keeps private invitations, permissions, songs, and purchases connected to the right person."
          : "Create the organization account once. Keep contacts, invoices, experiences, participants, and future plans together."}</p>
      </div>
    </section>

    <section className={styles.formSide} aria-labelledby="create-account-title">
      <div className={styles.formInner}>
        <div className={styles.formBrand}><SongKeepLockup variant="app" /></div>
        <p className={styles.kicker}>Account</p>
        <h2 id="create-account-title">{accessOnly ? "Create your sign-in." : completingOrganization ? "Add your organization." : "Tell us who to work with."}</h2>
        {!accessOnly ? <p className={styles.intro}>The person and the organization remain separate, so your organization keeps its SongKeep history even when contacts change.</p> : null}

        <form onSubmit={handleSubmit} className={styles.form}>
          <fieldset>
            <legend>{accessOnly ? "Your details" : "Primary contact"}</legend>
            <div className={styles.twoColumns}>
              <label><span>Name</span><input required name="displayName" autoComplete="name" defaultValue={completingOrganization ? signedInUser?.displayName ?? "" : ""} /></label>
              {!accessOnly ? <label><span>Title or role</span><input required name="contactTitle" autoComplete="organization-title" placeholder="Activities Director" /></label> : null}
            </div>
            <div className={styles.twoColumns}>
              <label><span>Email</span><input required type="email" name="email" autoComplete="email" defaultValue={completingOrganization ? signedInUser?.email ?? "" : ""} readOnly={completingOrganization} /></label>
              {!accessOnly ? <label><span>Direct phone</span><input required type="tel" name="contactPhone" autoComplete="tel" /></label> : null}
            </div>
          </fieldset>

          {!accessOnly ? <fieldset>
            <legend>Organization</legend>
            <label><span>Organization name</span><input required name="organizationName" autoComplete="organization" /></label>
            <div className={styles.twoColumns}>
              <label><span>Type</span><select name="organizationKind" defaultValue="facility">{organizationKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
              <label><span>Main phone <small>Optional</small></span><input type="tel" name="organizationPhone" autoComplete="tel-national" /></label>
            </div>
            <details className={styles.optionalDetails}>
              <summary>Add organization contact details</summary>
              <div className={styles.optionalFields}>
                <label><span>General or billing email <small>Optional</small></span><input type="email" name="organizationEmail" autoComplete="email" /></label>
                <label><span>Website <small>Optional</small></span><input type="url" name="website" autoComplete="url" /></label>
                <label><span>Address <small>Optional</small></span><input name="address" autoComplete="street-address" /></label>
              </div>
            </details>
          </fieldset> : null}

          {!completingOrganization ? <fieldset>
            <legend>Secure sign-in</legend>
            <div className={styles.twoColumns}>
              <label><span>Password</span><input required minLength={8} type="password" name="password" autoComplete="new-password" /></label>
              <label><span>Confirm password</span><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" /></label>
            </div>
          </fieldset> : null}

          <p className={styles.legal}>Organization agreements and individual participant permissions are completed separately.</p>
          <button type="submit" disabled={busy || status === "unavailable"}>{busy ? "Saving…" : accessOnly ? "Create & continue" : completingOrganization ? "Add organization" : "Create organization account"}</button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
        </form>
        <p className={styles.signIn}>Already have an account? <Link href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login"}>Sign in</Link></p>
      </div>
    </section>
  </main>;
}
