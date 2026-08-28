"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
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
      <Link className={styles.brand} href="/">Honor a Life Song</Link>
      <div className={styles.storyCopy}>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <p>A story shared in community can remain close long after the event.</p>
      </div>
    </section>

    <section className={styles.claim} aria-labelledby="claim-title">
      <div className={styles.claimInner}>
        <p className={styles.eyebrow}>Private participant &amp; family access</p>
        {!completeLink ? <><h1 id="claim-title">This invitation link is incomplete.</h1><p>Use the complete link provided by the organization that hosted the experience.</p><Link className={styles.secondary} href="/">Return home</Link></> : null}
        {completeLink && status === "loading" ? <><h1 id="claim-title">Opening your invitation…</h1></> : null}
        {completeLink && status === "unavailable" ? <><h1 id="claim-title">Private access is unavailable here.</h1><p>{configurationError ?? "Account access is not configured in this environment."}</p></> : null}
        {completeLink && status === "signed_out" ? <>
          <h1 id="claim-title">Keep the memories shared with you.</h1>
          <p>Sign in with the email address that received this invitation. If you are new, create a secure sign-in first.</p>
          <div className={styles.actions}><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link><Link className={styles.secondary} href={`/create-account?next=${encodeURIComponent(returnPath)}`}>Create account</Link></div>
        </> : null}
        {completeLink && user && !user.emailVerified ? <>
          <h1 id="claim-title">Verify your email to continue.</h1>
          <p>This confirms that the invitation reached the intended person before any private experience details are shown.</p>
          <Link href={`/verify-email?next=${encodeURIComponent(returnPath)}`}>Verify email</Link>
        </> : null}
        {completeLink && user?.emailVerified && loading && !invitation ? <><h1 id="claim-title">Opening your invitation…</h1></> : null}
        {completeLink && user?.emailVerified && invitation ? <>
          <p className={styles.host}>{invitation.organizationName}</p>
          <h1 id="claim-title">{invitation.experienceTitle}</h1>
          <p><strong>{invitation.participantName}</strong> was part of this experience. This invitation connects only the materials that were released for {invitation.recipient === "designated_family" ? "designated family access" : "participant access"}.</p>
          <div className={styles.accessSummary}><span>Available when claimed</span><strong>{invitation.entitlementIds.length} permissioned {invitation.entitlementIds.length === 1 ? "item" : "items"}</strong></div>
          {invitation.status === "pending" ? <button type="button" disabled={loading} onClick={accept}>{loading ? "Connecting…" : "Keep these memories"}</button> : null}
          {invitation.status === "accepted" ? <Link href="/memories">Open your memories</Link> : null}
          {invitation.status === "revoked" || invitation.status === "expired" ? <p className={styles.error}>This invitation is no longer available. Contact the organization or Honor a Life Song for help.</p> : null}
          <small>Claiming access does not make a song, photograph, or event video public.</small>
        </> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>
    </section>
  </main>;
}
