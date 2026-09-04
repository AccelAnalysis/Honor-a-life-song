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
import { customerMessage } from "@/lib/customer-messages";
import styles from "./create-account-route.module.css";

export type AccountRegistrationResult = { user: User; organizationId?: string };
export function AccountRegistrationForm({ onComplete, accessOnly = false, offeringId, signInHref = "/login", onSignIn, onBusyChange }: {
  onComplete: (result: AccountRegistrationResult) => Promise<void> | void;
  accessOnly?: boolean;
  offeringId?: ExperienceOfferingId;
  signInHref?: string;
  onSignIn?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { createAccount, user, status, configurationError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState({ firstName: "", lastName: "" });
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
      if (!cancelled) setNames({ firstName: snapshot.data()?.firstName ?? "", lastName: snapshot.data()?.lastName ?? "" });
    }).catch(() => undefined).finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

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
    try {
      const displayName = contactName(firstName, lastName);
      const accountUser = user ?? await createAccount({ firstName, lastName, email: value("email"), password });
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
      setError(customerMessage(cause, "Your sign-in may already be ready. Please retry to finish setting up your organization."));
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
        <label><span>Email</span><input required type="email" name="email" autoComplete="email" defaultValue={user?.email ?? ""} readOnly={Boolean(user)} /></label>
      </fieldset>
      {!accessOnly ? <fieldset disabled={busy}>
        <legend>Your organization or group</legend>
        <label><span>Organization or group name</span><input required maxLength={160} name="organizationName" autoComplete="organization" /></label>
        <label><span>Group type</span><select name="organizationKind" defaultValue="community_partner">{organizationKinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
        <details className={styles.optionalDetails}><summary>Add your role and phone number <small>Optional</small></summary>
          <div className={styles.optionalFields}>
            <label><span>Title or role</span><input name="contactTitle" maxLength={120} autoComplete="organization-title" /></label>
            <label><span>Phone number</span><input type="tel" name="contactPhone" maxLength={40} autoComplete="tel" /></label>
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
      <button type="submit" disabled={busy || status === "unavailable" || status === "loading"}>{busy ? "Creating your account…" : user ? "Save & continue" : "Create account & continue"}</button>
    </form>
    {!user ? <p className={styles.signIn}>Already have an account? {onSignIn ? <button type="button" onClick={onSignIn}>Sign in</button> : <Link href={signInHref}>Sign in</Link>}</p> : null}
  </>;
}
