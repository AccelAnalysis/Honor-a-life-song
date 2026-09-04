"use client";

import { customerMessage } from "@/lib/customer-messages";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import { formatOfferingPrice, participantPermissionScopes, serviceOfferings } from "@/domain/booking";
import {
  npsBranchCopy,
  type ExperienceFeedback,
  type OrganizationExperienceRequest,
  type OrganizationReferral,
  type OrganizationRelationshipProfile,
  type ParticipantPermissionInvitation
} from "@/domain/customer-lifecycle";
import { getExperienceOffering } from "@/domain/experience";
import type {
  ExperienceParticipant,
  OrganizationAgreement,
  OrganizationExperience,
  OrganizationMember
} from "@/domain/organization-account";
import {
  createParticipantPermissionInvitation,
  listExperiencePermissionInvitations,
  listOrganizationExperienceRequests,
  listOrganizationFeedback,
  listOrganizationReferrals,
  listOrganizationRelationshipProfiles,
  submitOrganizationFeedback,
  submitOrganizationReferral
} from "@/lib/firebase/customer-lifecycle";
import {
  createExperienceParticipant,
  listExperienceParticipants,
  listOrganizationAgreements,
  listOrganizationExperiences,
  listOrganizationMembers
} from "@/lib/firebase/organization-account";
import { OrganizationTeam } from "./organization-team";
import { listBookingDrafts } from "@/lib/firebase/booking-draft";
import { bookingReturnPath, canPlanExperience, type BookingDraft } from "@/domain/account-onboarding";
import { appPath } from "@/lib/app-path";
import styles from "./organization-relationship.module.css";

type OrganizationRelationshipProps = { view?: "home" | "account" | "experiences" };

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function isCompleted(experience: OrganizationExperience) {
  return ["assets_processing", "post_event", "closed"].includes(experience.status);
}

function requestTone(request: OrganizationExperienceRequest) {
  if (request.financialStatus === "paid") return "positive";
  if (request.financialStatus === "invoice_open" || request.financialStatus === "invoice_requested") return "attention";
  if (request.status === "cancelled") return "quiet";
  return "neutral";
}

function experienceRoadmap(offeringId: OrganizationExperience["offeringId"]) {
  if (offeringId === "single-song-group-event") {
    return ["Event details", "Shared story", "Song creation", "Presentation & keepsakes"];
  }
  if (offeringId === "songkeep-legacy-album") {
    return ["Album subject", "Life-story map", "Track production", "Album reveal & release"];
  }
  return ["Participants", "Stories & interviews", "Song production", "Concert & keepsakes"];
}

export function OrganizationRelationship({ view = "home" }: OrganizationRelationshipProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, status, configurationError, signOut } = useAuth();
  const [drafts, setDrafts] = useState<BookingDraft[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRelationshipProfile[]>([]);
  const [requests, setRequests] = useState<OrganizationExperienceRequest[]>([]);
  const [experiences, setExperiences] = useState<OrganizationExperience[]>([]);
  const [feedback, setFeedback] = useState<ExperienceFeedback[]>([]);
  const [referrals, setReferrals] = useState<OrganizationReferral[]>([]);
  const [participants, setParticipants] = useState<ExperienceParticipant[]>([]);
  const [permissionInvitations, setPermissionInvitations] = useState<ParticipantPermissionInvitation[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [agreements, setAgreements] = useState<OrganizationAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionLink, setPermissionLink] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<ExperienceFeedback | null>(null);
  const requestedOrganizationId = searchParams.get("org");
  const requestedExperienceId = searchParams.get("experience");
  const highlightedRequestId = searchParams.get("request");

  const organization = (requestedOrganizationId ? organizations.find(item => item.id === requestedOrganizationId) : organizations[0]) ?? null;
  const canBook = canPlanExperience(organization?.membershipRole);
  const canManagePeople = ["organization_admin", "coordinator"].includes(organization?.membershipRole ?? "");
  const savedPlan = drafts.find(item => item.organizationId === organization?.id);
  const savedOffering = getExperienceOffering(savedPlan?.offeringId);
  const completedExperiences = useMemo(() => experiences.filter(isCompleted), [experiences]);
  const currentExperiences = useMemo(() => experiences.filter((item) => !isCompleted(item) && item.status !== "cancelled"), [experiences]);
  const focusExperience = experiences.find((item) => item.id === requestedExperienceId)
    ?? currentExperiences[0]
    ?? completedExperiences[0]
    ?? null;
  const activeRequests = requests.filter((request) => request.status !== "cancelled");
  const latestFeedbackByExperience = new Map<string, ExperienceFeedback>();
  feedback.filter((item) => item.submittedByUserId === user?.uid).forEach((item) => {
    if (!latestFeedbackByExperience.has(item.experienceId)) latestFeedbackByExperience.set(item.experienceId, item);
  });
  useEffect(() => { setFeedbackResult(null); }, [organization?.id, user?.uid]);
  const promoterFeedback = feedbackResult?.branch === "promoter"
    ? feedbackResult
    : feedback.find((item) => item.branch === "promoter" && item.submittedByUserId === user?.uid);
  const focusOffering = focusExperience ? getExperienceOffering(focusExperience.offeringId) : undefined;

  useEffect(() => {
    if (!user) {
      setOrganizations([]); setRequests([]); setExperiences([]); setMembers([]); setDrafts([]);
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([listOrganizationRelationshipProfiles(user.uid), listBookingDrafts(user.uid)])
      .then(([items, nextDrafts]) => { if (!cancelled) { setOrganizations(items); setDrafts(nextDrafts); } })
      .catch((loadError) => { if (!cancelled) setError(customerMessage(loadError, "We could not open this account.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, user]);

  useEffect(() => {
    if (!organization) return;
    let cancelled = false;
    setRequests([]); setExperiences([]); setFeedback([]); setReferrals([]); setMembers([]); setAgreements([]);
    setDetailLoading(true);
    setError(null);
    Promise.all([
      listOrganizationExperienceRequests(organization.id),
      listOrganizationExperiences(organization.id),
      listOrganizationFeedback(organization.id),
      listOrganizationReferrals(organization.id),
      listOrganizationMembers(organization.id),
      listOrganizationAgreements(organization.id)
    ]).then(([nextRequests, nextExperiences, nextFeedback, nextReferrals, nextMembers, nextAgreements]) => {
      if (cancelled) return;
      setRequests(nextRequests);
      setExperiences(nextExperiences);
      setFeedback(nextFeedback);
      setReferrals(nextReferrals);
      setMembers(nextMembers);
      setAgreements(nextAgreements);
    }).catch((loadError) => {
      if (!cancelled) setError(customerMessage(loadError, "We could not open your account. Please try again."));
    }).finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [organization]);

  useEffect(() => {
    if (!organization || !focusExperience || !canManagePeople) {
      setParticipants([]);
      setPermissionInvitations([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      listExperienceParticipants(organization.id, focusExperience.id),
      listExperiencePermissionInvitations(organization.id, focusExperience.id)
    ]).then(([nextParticipants, nextInvitations]) => {
      if (cancelled) return;
      setParticipants(nextParticipants);
      setPermissionInvitations(nextInvitations);
    }).catch((loadError) => {
      if (!cancelled) setError(customerMessage(loadError, "We could not load participant readiness."));
    });
    return () => { cancelled = true; };
  }, [focusExperience, organization, canManagePeople]);

  async function refreshRelationship() {
    if (!organization) return;
    const [nextRequests, nextExperiences, nextFeedback, nextReferrals] = await Promise.all([
      listOrganizationExperienceRequests(organization.id),
      listOrganizationExperiences(organization.id),
      listOrganizationFeedback(organization.id),
      listOrganizationReferrals(organization.id)
    ]);
    setRequests(nextRequests);
    setExperiences(nextExperiences);
    setFeedback(nextFeedback);
    setReferrals(nextReferrals);
  }


  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization || !focusExperience) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("add-participant");
    setError(null);
    try {
      await createExperienceParticipant({
        organizationId: organization.id,
        experienceId: focusExperience.id,
        displayName: String(form.get("displayName") ?? ""),
        familyContactName: String(form.get("followupName") ?? "") || undefined,
        familyContactEmail: String(form.get("followupEmail") ?? "") || undefined
      });
      formElement.reset();
      setParticipants(await listExperienceParticipants(organization.id, focusExperience.id));
    } catch (participantError) {
      setError(customerMessage(participantError, "We could not add the person."));
    } finally {
      setBusy(null);
    }
  }

  async function handlePermissionInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization || !focusExperience || !user) return;
    const form = new FormData(event.currentTarget);
    const participantId = String(form.get("participantId") ?? "");
    setBusy(`permission-${participantId}`);
    setError(null);
    try {
      const invitation = await createParticipantPermissionInvitation({
        organizationId: organization.id,
        experienceId: focusExperience.id,
        participantId,
        recipientEmail: String(form.get("recipientEmail") ?? ""),
        recipientName: String(form.get("recipientName") ?? "") || undefined,
        invitedByUserId: user.uid
      });
      const params = new URLSearchParams({ org: organization.id, experience: focusExperience.id, invitation: invitation.id });
      setPermissionLink(`${window.location.origin}${appPath(`/participate?${params.toString()}`)}`);
      setPermissionInvitations(await listExperiencePermissionInvitations(organization.id, focusExperience.id));
    } catch (invitationError) {
      setError(customerMessage(invitationError, "We could not create the permission link."));
    } finally {
      setBusy(null);
    }
  }

  async function handleFeedback(event: FormEvent<HTMLFormElement>, experienceId: string) {
    event.preventDefault();
    if (!organization || !user || score === null) return;
    const form = new FormData(event.currentTarget);
    setBusy(`feedback-${experienceId}`);
    setError(null);
    try {
      const result = await submitOrganizationFeedback({
        organizationId: organization.id,
        experienceId,
        submittedByUserId: user.uid,
        score,
        satisfaction: Number(form.get("satisfaction") ?? 0) || undefined,
        comments: String(form.get("comments") ?? "")
      });
      setFeedbackResult(result);
      setScore(null);
      await refreshRelationship();
    } catch (feedbackError) {
      setError(customerMessage(feedbackError, "We could not save the feedback."));
    } finally {
      setBusy(null);
    }
  }

  async function handleReferral(event: FormEvent<HTMLFormElement>, sourceFeedback: ExperienceFeedback) {
    event.preventDefault();
    if (!organization || !user) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("referral");
    setError(null);
    try {
      await submitOrganizationReferral({
        organizationId: organization.id,
        experienceId: sourceFeedback.experienceId,
        feedbackId: sourceFeedback.id,
        submittedByUserId: user.uid,
        advocateName: String(form.get("advocateName") ?? user.displayName ?? ""),
        advocateEmail: String(form.get("advocateEmail") ?? user.email ?? ""),
        referredOrganizationName: String(form.get("referredOrganizationName") ?? ""),
        referredContactName: String(form.get("referredContactName") ?? "") || undefined,
        referredContactEmail: String(form.get("referredContactEmail") ?? "") || undefined,
        message: String(form.get("message") ?? "") || undefined
      });
      formElement.reset();
      await refreshRelationship();
    } catch (referralError) {
      setError(customerMessage(referralError, "We could not save the introduction."));
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading" || loading) return <main className={styles.centered}><p role="status">Opening SongKeep…</p></main>;
  if (status === "unavailable") return <main className={styles.centered}><section><h1>Account access is unavailable.</h1><p>{configurationError}</p></section></main>;
  if (status === "signed_out" || !user) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><h1>Sign in to your organization.</h1><Link className={styles.primaryAction} href="/login?next=%2Forganization">Sign in</Link></section></main>;
  if (!organization) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><h1>Add your organization.</h1><p>Your songs, events, and invoices will be here.</p><Link className={styles.primaryAction} href="/create-account?next=%2Forganization">Continue</Link></section></main>;

  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
      <nav aria-label="Organization account">
        <Link aria-current={view === "home" ? "page" : undefined} href={`/organization?org=${organization.id}`}>Home</Link>
        <Link aria-current={view === "experiences" ? "page" : undefined} href={`/organization/experiences?org=${organization.id}`}>Experiences</Link>
        <Link href={`/organization/library?org=${organization.id}`}>Songs &amp; memories</Link>
        <Link href={`/organization/invoices?organization=${organization.id}`}>Invoices</Link>
        <Link aria-current={view === "account" ? "page" : undefined} href={`/organization/account?org=${organization.id}`}>Account &amp; team</Link>
      </nav>
      <div className={styles.signedIn}><span>{organization.name}</span><button type="button" onClick={() => { void signOut().then(() => router.replace("/login")).catch(cause => setError(customerMessage(cause))); }}>Sign out</button></div>
    </header>

    <div className={styles.content}>
      {organizations.length > 1 ? <nav className={styles.organizationSwitcher} aria-label="Choose organization">{organizations.map((item) => <Link aria-current={item.id === organization.id ? "page" : undefined} href={`/organization${view === "account" ? "/account" : ""}?org=${item.id}`} key={item.id}>{item.name}</Link>)}</nav> : null}
      {error ? <div className={styles.alert} role="alert"><strong>Something needs attention.</strong><span>{error}</span></div> : null}
      {detailLoading ? <p className={styles.loading} role="status">Updating your account…</p> : null}

      {view === "account" ? <>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Organization account</p>
          <h1>{organization.name}</h1>
          <p>Manage your contact details, team, and billing.</p>
        </section>
        <div className={styles.accountGrid}>
          <section className={styles.surface}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Primary contact</p><h2>{organization.contact.displayName}</h2></div></div>
            <dl className={styles.detailsList}>
              <div><dt>Role</dt><dd>{organization.contact.title ?? "Primary contact"}</dd></div>
              <div><dt>Email</dt><dd>{organization.contact.email}</dd></div>
              <div><dt>Phone</dt><dd>{organization.contact.phone ?? "Not recorded"}</dd></div>
            </dl>
          </section>
          <section className={styles.surface}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Organization</p><h2>Contact details</h2></div></div>
            <dl className={styles.detailsList}>
              <div><dt>Type</dt><dd>{titleize(organization.kind)}</dd></div>
              <div><dt>Main email</dt><dd>{organization.organizationEmail ?? "Not recorded"}</dd></div>
              <div><dt>Main phone</dt><dd>{organization.phone ?? "Not recorded"}</dd></div>
              <div><dt>Address</dt><dd>{organization.address ?? "Not recorded"}</dd></div>
            </dl>
          </section>
        </div>
        <OrganizationTeam key={organization.id} organizationId={organization.id} members={members} canManage={canBook} />
        <section className={styles.surface}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Billing</p><h2>Invoices, payments &amp; agreements</h2></div></div>
          <div className={styles.rows}>{activeRequests.length ? activeRequests.map((request) => <div className={styles.row} key={request.id}><div><strong>{request.offeringName}</strong><span>{formatOfferingPrice(request.amountCents)} · {titleize(request.financialStatus)}</span></div><Link href={`/organization/invoices?organization=${organization.id}&invoice=${request.invoiceId ?? request.id}`}>Open invoice</Link></div>) : <p className={styles.quiet}>No purchase requests yet.</p>}</div>
          <div className={styles.rows}>{agreements.map((agreement) => <div className={styles.row} key={agreement.id}><div><strong>{agreement.title}</strong><span>Version {agreement.documentVersion}</span></div><span>{titleize(agreement.status)}</span></div>)}</div>
        </section>
      </> : <>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Your SongKeep account</p>
          <h1>Welcome to SongKeep.</h1>
          <p>Your upcoming events, invoices, and songs are all here.</p>
          {canBook && !savedPlan ? <Link className={styles.primaryAction} href={`/begin?organizationId=${organization.id}`}>Plan an experience</Link> : null}
        </section>

        {canBook && savedPlan && savedOffering ? <section className={styles.surface} aria-labelledby="saved-plan-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Ready when you are</p><h2 id="saved-plan-heading">Continue planning</h2><p>{savedOffering.name} · {savedOffering.creativeOutput}</p></div>
          <Link className={styles.primaryAction} href={bookingReturnPath(savedPlan)}>Continue planning</Link></div>
        </section> : null}
        {!detailLoading && !experiences.length && !activeRequests.length && !savedPlan ? <section className={styles.surface}><h2>Your first experience starts here.</h2><p>Once you book, you’ll find your event details and invoice in this account.</p></section> : null}
        {experiences.length ? <section className={styles.surface} aria-labelledby="event-history-heading">
          <div className={styles.sectionHeading}><h2 id="event-history-heading">Your experiences</h2></div>
          {[{ label: "Upcoming & in progress", items: currentExperiences }, { label: "Past experiences", items: completedExperiences }].map(group => group.items.length ? <div key={group.label}><h3>{group.label}</h3><div className={styles.rows}>{group.items.map(item => <Link className={styles.row} href={`/organization?org=${organization.id}&experience=${item.id}#experience-readiness`} key={item.id}><div><strong>{item.title}</strong><span>{getExperienceOffering(item.offeringId)?.creativeOutput} · {formatDate(item.startsAt)}</span></div><span>{titleize(item.status)}</span></Link>)}</div></div> : null)}
        </section> : null}
        {activeRequests.length ? <section className={styles.surface} aria-labelledby="commercial-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Your requests</p><h2 id="commercial-heading">Requests &amp; payment</h2></div></div>
          <div className={styles.requestList}>{activeRequests.map((request) => <article data-tone={requestTone(request)} className={request.id === highlightedRequestId ? styles.highlighted : ""} key={request.id}>
            <div><span className={styles.statusPill}>{titleize(request.financialStatus)}</span><h3>{request.offeringName}</h3><p>{formatDate(request.preferredStartsAt)} · {formatOfferingPrice(request.amountCents)}</p><small>{request.financialStatus === "paid" ? "Payment received. Continue planning your event." : request.financialStatus === "invoice_requested" ? "Your invoice is being prepared." : "Review your invoice for payment details."}</small></div>
            <div className={styles.requestActions}><Link className={styles.primaryAction} href={`/organization/invoices?organization=${organization.id}&invoice=${request.invoiceId ?? request.id}`}>{request.financialStatus === "paid" ? "View invoice" : request.requestedPaymentMethod === "card" ? "Continue payment" : "View invoice"}</Link>{canBook && request.status !== "converted" ? <Link href={`/begin?organizationId=${organization.id}&offering=${request.offeringId}&replacesRequest=${request.id}`}>Change experience</Link> : request.experienceId ? <Link href={`/organization?org=${organization.id}&experience=${request.experienceId}#experience-readiness`}>Open experience</Link> : null}</div>
          </article>)}</div>
        </section> : null}

        {focusExperience ? <section id="experience-readiness" className={styles.surface} aria-labelledby="readiness-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Your event</p><h2 id="readiness-heading">{focusExperience.title}</h2><p>{focusOffering?.name ?? titleize(focusExperience.templateKind)} · {titleize(focusExperience.status)} · {formatDate(focusExperience.startsAt)}</p></div><Link href={`/organization/library?org=${organization.id}`}>Songs &amp; memories</Link></div>
          <ol className={styles.roadmap} aria-label="Experience readiness">{experienceRoadmap(focusExperience.offeringId).map((step, index) => <li key={step}><span>{index + 1}</span><strong>{step}</strong></li>)}</ol>
          {canManagePeople ? <details className={styles.capturePanel}>
            <summary>Add a person connected to this experience</summary>
            <form onSubmit={handleAddParticipant}>
              <label><span>Participant or subject name</span><input required name="displayName" autoComplete="name" /></label>
              <div className={styles.twoColumns}><label><span>Follow-up contact <small>Optional</small></span><input name="followupName" autoComplete="name" /></label><label><span>Follow-up email <small>Optional</small></span><input type="email" name="followupEmail" autoComplete="email" /></label></div>
              <p>The contact can be the participant or an eligible family member. Permission is still requested separately.</p>
              <button type="submit" disabled={busy === "add-participant"}>{busy === "add-participant" ? "Adding…" : "Add person"}</button>
            </form>
          </details> : null}
          {canManagePeople && participants.length ? <div className={styles.participantList}>{participants.map((participant) => {
            const invitation = permissionInvitations.find((item) => item.participantId === participant.id && item.status !== "revoked");
            return <article key={participant.id}>
              <div><strong>{participant.displayName}</strong><span>Permission: {titleize(participant.permissionReadiness)}</span>{invitation ? <small>Invitation {titleize(invitation.status)}</small> : null}</div>
              <details>
                <summary>{invitation ? "Create another link" : "Create permission link"}</summary>
                <form onSubmit={handlePermissionInvitation}>
                  <input type="hidden" name="participantId" value={participant.id} />
                  <label><span>Recipient email</span><input required type="email" name="recipientEmail" defaultValue={participant.familyContactEmail ?? ""} /></label>
                  <label><span>Recipient name <small>Optional</small></span><input name="recipientName" defaultValue={participant.familyContactName ?? ""} /></label>
                  <button type="submit" disabled={busy === `permission-${participant.id}`}>{busy === `permission-${participant.id}` ? "Creating…" : "Create secure link"}</button>
                </form>
              </details>
            </article>;
          })}</div> : canManagePeople ? <div className={styles.emptyState}><strong>No people have been added yet.</strong><p>Add the people taking part. We’ll help you invite them and collect their choices.</p></div> : null}
          {permissionLink ? <div className={styles.linkResult} role="status"><strong>Permission link ready</strong><code>{permissionLink}</code><div><button type="button" onClick={() => navigator.clipboard?.writeText(permissionLink)}>Copy</button><button type="button" onClick={() => window.print()}>Print</button></div></div> : null}
          <details className={styles.permissionGuide}><summary>What the individual chooses</summary><div>{participantPermissionScopes.map((permission) => <p key={permission.scope}><strong>{permission.label}</strong><span>{permission.description}</span></p>)}</div></details>
        </section> : null}

        {completedExperiences.map((experience) => {
          const existingFeedback = latestFeedbackByExperience.get(experience.id);
          const result = feedbackResult?.experienceId === experience.id ? feedbackResult : existingFeedback;
          return <section className={styles.surface} key={experience.id} aria-labelledby={`followup-${experience.id}`}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>After the experience</p><h2 id={`followup-${experience.id}`}>{experience.title}</h2><p>How was your experience? We’d love to hear.</p></div><Link href={`/organization/library?org=${organization.id}`}>Open materials</Link></div>
            {!result ? <form className={styles.feedbackForm} onSubmit={(event) => handleFeedback(event, experience.id)}>
              <fieldset><legend>How likely are you to recommend SongKeep to another organization?</legend><div className={styles.npsScale}>{Array.from({ length: 11 }, (_, index) => <label key={index}><input type="radio" name={`nps-${experience.id}`} checked={score === index} onChange={() => setScore(index)} /><span>{index}</span></label>)}</div><div className={styles.scaleLabels}><span>Not likely</span><span>Very likely</span></div></fieldset>
              <label><span>Overall satisfaction</span><select name="satisfaction" defaultValue="5"><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></label>
              <label><span>What mattered most, and what could be better?</span><textarea name="comments" rows={4} /></label>
              <button type="submit" disabled={score === null || busy === `feedback-${experience.id}`}>{busy === `feedback-${experience.id}` ? "Saving…" : "Share feedback"}</button>
            </form> : <div className={styles.feedbackResult} data-branch={result.branch}><strong>{npsBranchCopy[result.branch].title}</strong><p>{npsBranchCopy[result.branch].body}</p></div>}
          </section>;
        })}

        {promoterFeedback ? <section className={styles.surface} aria-labelledby="referral-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Introduce another organization</p><h2 id="referral-heading">Make a warm introduction.</h2><p>Know a group that would enjoy SongKeep? Introduce us.</p></div></div>
          <form className={styles.referralForm} onSubmit={(event) => handleReferral(event, promoterFeedback)}>
            <div className={styles.twoColumns}><label><span>Your name</span><input required name="advocateName" defaultValue={user.displayName ?? organization.contact.displayName} /></label><label><span>Your email</span><input required type="email" name="advocateEmail" defaultValue={user.email ?? organization.contact.email} /></label></div>
            <label><span>Organization to introduce</span><input required name="referredOrganizationName" /></label>
            <div className={styles.twoColumns}><label><span>Contact name <small>Optional</small></span><input name="referredContactName" /></label><label><span>Contact email <small>Optional</small></span><input type="email" name="referredContactEmail" /></label></div>
            <label><span>Personal note <small>Optional</small></span><textarea name="message" rows={3} /></label>
            <button type="submit" disabled={busy === "referral"}>{busy === "referral" ? "Saving…" : "Save introduction"}</button>
          </form>
          {referrals.length ? <p className={styles.quiet}>{referrals.length} {referrals.length === 1 ? "introduction" : "introductions"} connected to this organization.</p> : null}
        </section> : null}

        {canBook && completedExperiences.length ? <section className={styles.surface} aria-labelledby="next-experience-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Make more memories</p><h2 id="next-experience-heading">Plan what comes next.</h2><p>Bring your people together again. Your account is ready when you are.</p></div></div>
          <div className={styles.offerGrid}>{serviceOfferings.map((offering) => <Link href={`/begin?organizationId=${organization.id}&offering=${offering.id}${focusExperience ? `&sourceExperience=${focusExperience.id}` : ""}`} key={offering.id}><span>{formatOfferingPrice(offering.priceCents)}</span><strong>{offering.shortName}</strong><small>{offering.creativeOutput}</small></Link>)}</div>
        </section> : null}
      </>}
    </div>
  </main>;
}
