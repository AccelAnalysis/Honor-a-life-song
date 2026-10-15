"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./auth-provider";
import { contactName, organizationKinds } from "@/domain/account-onboarding";
import type { ExperienceOfferingId } from "@/domain/experience";
import type { OrganizationKind } from "@/domain/types";
import { createOrganizationWithPrimaryContact } from "@/lib/firebase/customer-lifecycle";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { customerErrorCode, customerMessage } from "@/lib/customer-messages";
import styles from "./create-account-route.module.css";

export type AccountRegistrationResult = { user: User; organizationId?: string };
export function AccountRegistrationForm({ onComplete, accessOnly = false, offeringId, signInHref = "/login", onSignIn, onBusyChange, initialValues, lockEmail = false, lockOrganization = false }: {
  onComplete: (result: AccountRegistrationResult) => Promise<void> | void;
  accessOnly?: boolean;
  offeringId?: ExperienceOfferingId;
  signInHref?: string;
  onSignIn?: () => void;
  onBusyChange?: (busy: boolean) => void;
  lockEmail?: boolean;
  lockOrganization?: boolean;
  initialValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    organizationName?: string;
    organizationKind?: OrganizationKind;
    contactTitle?: string;
    contactPhone?: string;
  };
}) {
  const { createAccount, user, status, configurationError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState({ firstName: initialValues?.firstName ?? "", lastName: initialValues?.lastName ?? "" });
  const [profileLoading, setProfileLoading] = useState(Boolean(user));
  const formRef = useRef<HTMLFormElement>(null);
  const attempt = useRef<string | null>(null);
  const submitted = useRef(false);
  // Keep the same form mounted while Auth resolves. Passwords never leave this form or enter a draft.
  useEffect(() => {
    if (!user || submitted.current) { setProfileLoading(false); return; }
    let cancelled = false;
    setProfileLoading(true);
    getDoc(doc(getFirebaseFirestore(), "users", user.uid)).then(snapshot => {
      if (!cancelled) setNames({ firstName: snapshot.data()?.firstName ?? initialValues?.firstName ?? "", lastName: snapshot.data()?.lastName ?? initialValues?.lastName ?? "" });
    }).catch(() => undefined).finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [initialValues?.firstName, initialValues?.lastName, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const value = (name: string) => String(values.get(name) ?? "").trim();
    const firstName = value("firstName"), lastName = value("lastName");
    const password = String(values.get("password") ?? "");
    if (!user && password !== String(values.get("confirmPassword") ?? "")) {
      setError("The passwords do not match."); formRef.current?.querySelector<HTMLInputElement>('[name="confirmPassword"]')?.focus(); return;
    }
    setBusy(true); onBusyChange?.(true); submitted.current = true; setError(null);
    let signInReady = Boolean(user);
    try {
      const displayName = contactName(firstName, lastName);
      const accountUser = user ?? await createAccount({ firstName, lastName, email: value("email"), password });
      signInReady = true;
      if (accessOnly) { await onComplete({ user: accountUser }); return; }
      attempt.current ??= crypto.randomUUID();
      const organizationId = await createOrganizationWithPrimaryContact({
        setupId: attempt.current, userId: accountUser.uid, email: accountUser.email ?? value("email"),
        firstName, lastName, displayName, organizationName: value("organizationName"),
        organizationKind: (value("organizationKind") || "community_partner") as OrganizationKind,
        contactTitle: value("contactTitle"), contactPhone: value("contactPhone"), offeringId
      });
      await onComplete({ user: accountUser, organizationId });
    } catch (cause) {
      if (!accessOnly && signInReady && customerErrorCode(cause) === "permission-denied") {
        setError("Your sign-in is ready, but SongKeep could not finish creating your organization. Choose Save & continue to try again.");
      } else {
        setError(customerMessage(cause, "Your sign-in may already be ready. Please retry to finish setting up your organization."));
      }
    } finally { setBusy(false); onBusyChange?.(false); }
  }

  if (profileLoading) return <p role="status">Opening your details…</p>;
  return <>
    <form ref={formRef} onSubmit={submit} className={styles.form} aria-label={accessOnly ? "Create your account" : "Create your organization account"} aria-busy={busy}>
      <fieldset disabled={busy}>
        <legend>Your details</legend>
        <div className={styles.twoColumns}>
          <label><span>First name</span><input required maxLength={80} name="firstName" autoComplete="given-name" defaultValue={names.firstName} /></label>
          <label><span>Last name</span><input required maxLength={80} name="lastName" autoComplete="family-name" defaultValue={names.lastName} /></label>
        </div>
        <label><span>Email</span><input required type="email" name="email" autoComplete="email" defaultValue={user?.email ?? initialValues?.email ?? ""} readOnly={Boolean(user) || lockEmail} /></label>
      </fieldset>
      {!accessOnly ? <fieldset disabled={busy}>
        <legend>Your organization or group</legend>
        <small>You’ll start as this organization’s account administrator and can invite your team after setup.</small>
        <label><span>Organization or group name</span><input required maxLength={160} name="organizationName" autoComplete="organization" defaultValue={initialValues?.organizationName ?? ""} readOnly={lockOrganization} /></label>
        <label><span id="registration-group-type">Group type</span><select name={lockOrganization ? undefined : "organizationKind"} aria-labelledby="registration-group-type" defaultValue={initialValues?.organizationKind ?? "community_partner"} disabled={lockOrganization}>{organizationKinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select>{lockOrganization ? <input type="hidden" name="organizationKind" value={initialValues?.organizationKind ?? "community_partner"} /> : null}</label>
        <details className={styles.optionalDetails}><summary>Add your role and phone number <small>Optional</small></summary>
          <div className={styles.optionalFields}>
            <label><span>Title or role</span><input name="contactTitle" maxLength={120} autoComplete="organization-title" defaultValue={initialValues?.contactTitle ?? ""} /></label>
            <label><span>Phone number</span><input type="tel" name="contactPhone" maxLength={40} autoComplete="tel" defaultValue={initialValues?.contactPhone ?? ""} /></label>
          </div>
        </details>
      </fieldset> : null}
      {!user ? <fieldset disabled={busy}>
        <legend>Your sign-in</legend>
        <div className={styles.twoColumns}>
          <label><span>Password</span><input required minLength={8} type="password" name="password" autoComplete="new-password" aria-describedby="password-help" /></label>
          <label><span>Confirm password</span><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" /></label>
        </div>
        <small id="password-help">Use at least 8 characters.</small>
      </fieldset> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {configurationError ? <p className={styles.error} role="status">{configurationError}</p> : null}
      <button type="submit" disabled={busy || status === "unavailable" || status === "loading"}>{busy ? (user ? "Creating your organization…" : "Creating your account…") : user ? "Save & continue" : "Create account & continue"}</button>
    </form>
    {!user ? <p className={styles.signIn}>Already have an account? {onSignIn ? <button type="button" onClick={onSignIn}>Sign in</button> : <Link href={signInHref}>Sign in</Link>}</p> : null}
  </>;
}
