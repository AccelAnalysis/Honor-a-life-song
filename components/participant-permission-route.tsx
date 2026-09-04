"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import { participantPermissionScopes } from "@/domain/booking";
import type { ConsentScope } from "@/domain/consent";
import type { ParticipantPermissionInvitation } from "@/domain/customer-lifecycle";
import {
  getParticipantPermissionInvitation,
  submitParticipantPermissionResponse
} from "@/lib/firebase/customer-lifecycle";
import styles from "./participant-permission-route.module.css";

export function ParticipantPermissionRoute() {
  const searchParams = useSearchParams();
  const { user, status, configurationError } = useAuth();
  const organizationId = searchParams.get("org") ?? "";
  const experienceId = searchParams.get("experience") ?? "";
  const invitationId = searchParams.get("invitation") ?? "";
  const [invitation, setInvitation] = useState<ParticipantPermissionInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>([
    "participation",
    "interview_recording",
    "internal_creative_use",
    "private_performance"
  ]);
  const [error, setError] = useState<string | null>(null);

  const returnPath = `/participate?${new URLSearchParams({ org: organizationId, experience: experienceId, invitation: invitationId }).toString()}`;

  useEffect(() => {
    if (!user || !user.emailVerified || !organizationId || !experienceId || !invitationId) {
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    getParticipantPermissionInvitation(organizationId, experienceId, invitationId)
      .then((result) => {
        if (cancelled) return;
        setInvitation(result);
        if (result?.status === "submitted" || result?.status === "approved") setComplete(true);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this invitation.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [experienceId, invitationId, organizationId, status, user]);

  function toggleScope(scope: ConsentScope, checked: boolean) {
    setSelectedScopes((current) => checked
      ? [...new Set([...current, scope])]
      : current.filter((item) => item !== scope));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email || !invitation) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await submitParticipantPermissionResponse({
        organizationId,
        experienceId,
        invitationId,
        userId: user.uid,
        userEmail: user.email,
        emailVerified: user.emailVerified,
        signatureName: String(form.get("signatureName") ?? ""),
        authorityBasis: String(form.get("authorityBasis") ?? "self") as "self" | "authorized_representative",
        scopes: selectedScopes,
        restrictions: String(form.get("restrictions") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
        participantDeliveryEmail: String(form.get("participantDeliveryEmail") ?? user.email),
        designatedFamilyEmails: String(form.get("designatedFamilyEmails") ?? "")
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean)
      });
      setComplete(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not submit your choices.");
    } finally {
      setBusy(false);
    }
  }

  if (!organizationId || !experienceId || !invitationId) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><h1>This invitation is incomplete.</h1><p>Ask the organization or SongKeep team for a new permission link.</p></section></main>;
  if (status === "loading" || loading) return <main className={styles.centered}><p role="status">Opening your invitation…</p></main>;
  if (status === "unavailable") return <main className={styles.centered}><section><h1>Private access is unavailable.</h1><p>{configurationError}</p></section></main>;
  if (status === "signed_out" || !user) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><p className={styles.eyebrow}>Private invitation</p><h1>Sign in with the invited email.</h1><p>Your verified sign-in connects these choices to the correct participant.</p><div className={styles.authActions}><Link className={styles.primary} href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link><Link className={styles.secondary} href={`/create-account?next=${encodeURIComponent(returnPath)}`}>Create sign-in</Link></div><p className={styles.small}>A staff-assisted or paper form remains available when independent digital access is not practical.</p></section></main>;
  if (!user.emailVerified) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><p className={styles.eyebrow}>Verify your email</p><h1>Protect the participant’s choices.</h1><p>Use the verification message sent to {user.email}, then reopen this invitation.</p><Link className={styles.secondary} href={returnPath}>Check again</Link></section></main>;
  if (error && !invitation) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><h1>We could not open this invitation.</h1><p>{error}</p></section></main>;
  if (!invitation) return <main className={styles.centered}><section><h1>This invitation is no longer available.</h1></section></main>;

  if (complete) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><div className={styles.completeMark} aria-hidden="true">✓</div><p className={styles.eyebrow}>Choices submitted</p><h1>Thank you, {invitation.participantName}.</h1><p>Your response is connected to {invitation.experienceTitle}. SongKeep reviews the response before using or releasing participant materials.</p><Link className={styles.primary} href="/memories">Open SongKeep memories</Link></section></main>;

  return <main className={styles.shell}>
    <header><Link href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link><span>Participant permissions</span></header>
    <div className={styles.layout}>
      <aside>
        <p className={styles.eyebrow}>{invitation.organizationName}</p>
        <h1>Your story. Your choices.</h1>
        <p>{invitation.participantName} has been invited to take part in {invitation.experienceTitle}.</p>
        <div className={styles.safetyNote}><strong>Organization agreements do not decide this for you.</strong><span>Each use—participation, recording, family sharing, event media, and public use—has its own choice.</span></div>
      </aside>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error ? <div className={styles.alert} role="alert"><strong>Please review the form.</strong><span>{error}</span></div> : null}
        <fieldset className={styles.permissions}>
          <legend>Choose what SongKeep may do</legend>
          {participantPermissionScopes.map((permission) => <label key={permission.scope}>
            <input type="checkbox" checked={selectedScopes.includes(permission.scope)} onChange={(event) => toggleScope(permission.scope, event.target.checked)} />
            <span><strong>{permission.label}{permission.optional ? " — optional" : ""}</strong><small>{permission.description}</small></span>
          </label>)}
        </fieldset>

        {selectedScopes.includes("designated_family_sharing") ? <label className={styles.field}><span>Designated family email addresses</span><textarea name="designatedFamilyEmails" rows={3} placeholder="One per line or separated by commas" /></label> : null}
        <label className={styles.field}><span>Email for private delivery</span><input required type="email" name="participantDeliveryEmail" defaultValue={user.email ?? invitation.recipientEmail} /></label>
        <label className={styles.field}><span>Restrictions or details SongKeep should follow <small>Optional</small></span><textarea name="restrictions" rows={4} placeholder="For example: private performance only; do not use photographs publicly." /></label>
        <div className={styles.twoColumns}>
          <label className={styles.field}><span>Who is completing this form?</span><select name="authorityBasis" defaultValue="self"><option value="self">The participant</option><option value="authorized_representative">An authorized representative</option></select></label>
          <label className={styles.field}><span>Full legal name</span><input required name="signatureName" defaultValue={invitation.recipientName ?? user.displayName ?? ""} /></label>
        </div>
        <p className={styles.legal}>Submitting records these choices under permission form version {invitation.agreementVersion}. SongKeep may contact you when a restriction or representative authority needs clarification.</p>
        <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit my choices"}</button>
        <button className={styles.print} type="button" onClick={() => window.print()}>Print this form</button>
      </form>
    </div>
  </main>;
}
