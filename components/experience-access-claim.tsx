"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import type { ExperienceAccessInvitation } from "@/domain/organization-account";
import {
  acceptExperienceAccessInvitationSecure,
  getExperienceAccessInvitation
} from "@/lib/firebase/organization-invitations";
import styles from "./experience-access-claim.module.css";

export function ExperienceAccessClaim() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, configurationError } = useAuth();
  const organizationId = searchParams.get("org");
  const experienceId = searchParams.get("experience");
  const invitationId = searchParams.get("id");
  const [invitation, setInvitation] = useState<ExperienceAccessInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeLink = Boolean(organizationId && experienceId && invitationId);
  const returnPath = completeLink
    ? `/claim?org=${encodeURIComponent(organizationId!)}&experience=${encodeURIComponent(experienceId!)}&id=${encodeURIComponent(invitationId!)}`
    : "/claim";

  useEffect(() => {
    if (!completeLink || status !== "signed_in" || !user?.emailVerified) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getExperienceAccessInvitation(organizationId!, experienceId!, invitationId!)
      .then((nextInvitation) => { if (!cancelled) setInvitation(nextInvitation); })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this invitation.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [completeLink, experienceId, invitationId, organizationId, status, user]);

  async function accept() {
    if (!user || !organizationId || !experienceId || !invitationId) return;
    setLoading(true);
    setError(null);
    try {
      await acceptExperienceAccessInvitationSecure({
        organizationId,
        experienceId,
        invitationId,
        userId: user.uid,
        email: user.email ?? "",
        emailVerified: user.emailVerified
      });
      router.push("/memories");
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "We could not connect these memories to your account.");
      setLoading(false);
    }
  }

  return <main className={styles.shell}>
    <section className={styles.story}>
      <Link className={styles.brand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div className={styles.storyCopy}>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <p>Your songs. Your memories.</p>
      </div>
    </section>

    <section className={styles.claim} aria-labelledby="claim-title">
      <div className={styles.claimInner}>
        <div className={styles.claimBrand}><SongKeepLockup variant="app" /></div>
        <p className={styles.eyebrow}>Private access</p>
        {!completeLink ? <><h1 id="claim-title">Link incomplete.</h1><p>Use the full link you received.</p><Link className={styles.secondary} href="/">Home</Link></> : null}
        {completeLink && status === "loading" ? <h1 id="claim-title">Opening…</h1> : null}
        {completeLink && status === "unavailable" ? <><h1 id="claim-title">Access unavailable.</h1><p>{configurationError ?? "Account access is unavailable here."}</p></> : null}
        {completeLink && status === "signed_out" ? <>
          <h1 id="claim-title">Sign in to continue.</h1>
          <p>Use the email that received this invitation.</p>
          <div className={styles.actions}><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link><Link className={styles.secondary} href={`/create-account?next=${encodeURIComponent(returnPath)}`}>Create account</Link></div>
        </> : null}
        {completeLink && user && !user.emailVerified ? <>
          <h1 id="claim-title">Verify your email.</h1>
          <p>We need to confirm it’s you.</p>
          <Link href={`/verify-email?next=${encodeURIComponent(returnPath)}`}>Verify email</Link>
        </> : null}
        {completeLink && user?.emailVerified && loading && !invitation ? <h1 id="claim-title">Opening…</h1> : null}
        {completeLink && user?.emailVerified && invitation ? <>
          <p className={styles.host}>{invitation.organizationName}</p>
          <h1 id="claim-title">{invitation.experienceTitle}</h1>
          <p><strong>{invitation.participantName}</strong></p>
          <div className={styles.accessSummary}><span>Available</span><strong>{invitation.entitlementIds.length} {invitation.entitlementIds.length === 1 ? "item" : "items"}</strong></div>
          {invitation.status === "pending" ? <button type="button" disabled={loading} onClick={accept}>{loading ? "Adding…" : "Add to SongKeep"}</button> : null}
          {invitation.status === "accepted" ? <Link href="/memories">Open SongKeep</Link> : null}
          {invitation.status === "revoked" || invitation.status === "expired" ? <p className={styles.error}>This invitation is no longer available. Contact the organization or SongKeep for help.</p> : null}
          <small>Private by default.</small>
        </> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>
    </section>
  </main>;
}
