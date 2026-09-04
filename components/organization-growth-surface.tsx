"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  deriveLifecyclePlan,
  getNetPromoterBand,
  type ExperienceFeedback,
  type NetPromoterBand
} from "@/domain/customer-lifecycle";
import type {
  ExperienceAccessInvitation,
  ExperienceParticipant,
  OrganizationAccount,
  OrganizationExperience
} from "@/domain/organization-account";
import {
  listExperienceFeedback,
  submitExperienceFeedback,
  submitOrganizationReferral
} from "@/lib/firebase/customer-lifecycle";
import {
  listExperienceAccessInvitations,
  listExperienceParticipants,
  listOrganizationExperiences,
  listUserOrganizations
} from "@/lib/firebase/organization-account";
import styles from "./organization-growth-surface.module.css";

const referenceOrganization: OrganizationAccount = {
  id: "reference-organization",
  name: "Your Organization",
  kind: "facility",
  createdBy: "reference-user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const referenceExperience: OrganizationExperience = {
  id: "reference-experience",
  organizationId: referenceOrganization.id,
  title: "Honor a Life Song Experience",
  offeringId: "honor-a-life-song-experience",
  templateKind: "full_program",
  participantMode: "named_roster",
  status: "post_event",
  startsAt: new Date().toISOString(),
  billingStatus: "paid",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const referenceParticipants: ExperienceParticipant[] = [
  { id: "participant-1", organizationId: referenceOrganization.id, experienceId: referenceExperience.id, displayName: "Participant one", participationStatus: "completed", permissionReadiness: "ready", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "participant-2", organizationId: referenceOrganization.id, experienceId: referenceExperience.id, displayName: "Participant two", participationStatus: "completed", permissionReadiness: "ready", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "participant-3", organizationId: referenceOrganization.id, experienceId: referenceExperience.id, displayName: "Participant three", participationStatus: "completed", permissionReadiness: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

function formatDate(value?: string) {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function isCompleted(experience: OrganizationExperience) {
  return ["post_event", "closed", "assets_processing"].includes(experience.status);
}

function bandMessage(band: NetPromoterBand) {
  if (band === "recovery") return "Thank you for telling us. Your feedback is routed for personal follow-up, and referral requests stay paused.";
  if (band === "passive") return "Thank you. We’ll use your feedback to improve the next experience and keep the relationship moving forward.";
  return "Thank you. You can now introduce another organization or plan the next SongKeep experience.";
}

export function OrganizationGrowthSurface() {
  const searchParams = useSearchParams();
  const { user, status, configurationError } = useAuth();
  const isStaticPreview = process.env.NEXT_PUBLIC_HALS_STATIC_PREVIEW === "1";
  const [organizations, setOrganizations] = useState<OrganizationAccount[]>(isStaticPreview ? [referenceOrganization] : []);
  const [experiences, setExperiences] = useState<OrganizationExperience[]>(isStaticPreview ? [referenceExperience] : []);
  const [participants, setParticipants] = useState<ExperienceParticipant[]>(isStaticPreview ? referenceParticipants : []);
  const [invitations, setInvitations] = useState<ExperienceAccessInvitation[]>([]);
  const [feedback, setFeedback] = useState<ExperienceFeedback | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(!isStaticPreview);
  const [busy, setBusy] = useState<"feedback" | "referral" | null>(null);
  const [referralSent, setReferralSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedOrganizationId = searchParams.get("org");
  const requestedExperienceId = searchParams.get("experience");
  const selectedOrganization = organizations.find((item) => item.id === requestedOrganizationId) ?? organizations[0];
  const completedExperiences = useMemo(() => experiences.filter(isCompleted).sort((a, b) => (b.startsAt ?? b.createdAt).localeCompare(a.startsAt ?? a.createdAt)), [experiences]);
  const selectedExperience = completedExperiences.find((item) => item.id === requestedExperienceId) ?? completedExperiences[0];
  const currentScore = feedback?.npsScore ?? selectedScore ?? undefined;
  const band = currentScore === undefined ? undefined : getNetPromoterBand(currentScore);
  const lifecyclePlan = selectedExperience ? deriveLifecyclePlan({
    billingState: selectedExperience.billingStatus === "paid" ? "paid" : selectedExperience.requestedPaymentMethod === "invoice" ? "invoice_requested" : "not_started",
    experienceStatus: selectedExperience.status,
    npsScore: currentScore,
    hasFutureExperience: experiences.some((item) => !isCompleted(item) && item.status !== "cancelled")
  }) : undefined;

  useEffect(() => {
    if (isStaticPreview || !user) {
      setLoading(!isStaticPreview && status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    listUserOrganizations(user.uid)
      .then(async (nextOrganizations) => {
        if (cancelled) return;
        const organization = nextOrganizations.find((item) => item.id === requestedOrganizationId) ?? nextOrganizations[0];
        const nextExperiences = organization ? await listOrganizationExperiences(organization.id) : [];
        if (cancelled) return;
        setOrganizations(nextOrganizations);
        setExperiences(nextExperiences);
      })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open post-experience follow-up."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isStaticPreview, requestedOrganizationId, status, user]);

  useEffect(() => {
    if (isStaticPreview || !user || !selectedOrganization || !selectedExperience) return;
    let cancelled = false;
    Promise.all([
      listExperienceParticipants(selectedOrganization.id, selectedExperience.id),
      listExperienceAccessInvitations(selectedOrganization.id, selectedExperience.id),
      listExperienceFeedback(selectedOrganization.id, selectedExperience.id)
    ]).then(([nextParticipants, nextInvitations, nextFeedback]) => {
      if (cancelled) return;
      setParticipants(nextParticipants);
      setInvitations(nextInvitations);
      const ownFeedback = nextFeedback.find((item) => item.submittedByUserId === user.uid) ?? nextFeedback[0] ?? null;
      setFeedback(ownFeedback);
      setSelectedScore(ownFeedback?.npsScore ?? null);
    }).catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this experience follow-up."); });
    return () => { cancelled = true; };
  }, [isStaticPreview, selectedExperience, selectedOrganization, user]);

  async function handleFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedExperience || !selectedOrganization || selectedScore === null) return;
    const form = new FormData(event.currentTarget);
    setBusy("feedback");
    setError(null);
    try {
      const nextBand = isStaticPreview
        ? getNetPromoterBand(selectedScore)
        : await submitExperienceFeedback({
            organizationId: selectedOrganization.id,
            experienceId: selectedExperience.id,
            submittedByUserId: user?.uid ?? "",
            npsScore: selectedScore,
            satisfactionScore: Number(form.get("satisfactionScore") ?? 5),
            mostMeaningful: String(form.get("mostMeaningful") ?? ""),
            improvement: String(form.get("improvement") ?? "")
          });
      setFeedback({
        id: user?.uid ?? "interactive-feedback",
        organizationId: selectedOrganization.id,
        experienceId: selectedExperience.id,
        submittedByUserId: user?.uid ?? "interactive-user",
        npsScore: selectedScore,
        satisfactionScore: Number(form.get("satisfactionScore") ?? 5),
        mostMeaningful: String(form.get("mostMeaningful") ?? ""),
        improvement: String(form.get("improvement") ?? ""),
        band: nextBand,
        createdAt: new Date().toISOString()
      });
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "We could not save your feedback.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedExperience || !selectedOrganization) return;
    const form = new FormData(event.currentTarget);
    setBusy("referral");
    setError(null);
    try {
      if (!isStaticPreview) {
        await submitOrganizationReferral({
          organizationId: selectedOrganization.id,
          sourceExperienceId: selectedExperience.id,
          advocateUserId: user?.uid ?? "",
          referredOrganizationName: String(form.get("referredOrganizationName") ?? ""),
          referredContactName: String(form.get("referredContactName") ?? ""),
          referredContactEmail: String(form.get("referredContactEmail") ?? ""),
          relationship: String(form.get("relationship") ?? ""),
          message: String(form.get("message") ?? "")
        });
      }
      setReferralSent(true);
      event.currentTarget.reset();
    } catch (referralError) {
      setError(referralError instanceof Error ? referralError.message : "We could not save this introduction.");
    } finally {
      setBusy(null);
    }
  }

  if (!isStaticPreview && (status === "loading" || loading)) return <section className={styles.status}>Opening follow-up…</section>;
  if (!isStaticPreview && status === "unavailable") return <section className={styles.empty}><h2>Follow-up is unavailable.</h2><p>{configurationError}</p></section>;
  if (!isStaticPreview && (status === "signed_out" || !user)) return <section className={styles.empty}><h2>Sign in to continue.</h2><Link className={styles.primaryAction} href="/login?next=%2Forganization%2Fgrowth">Sign in</Link></section>;
  if (!selectedOrganization) return <section className={styles.empty}><h2>Finish organization setup.</h2><Link className={styles.primaryAction} href="/create-account">Continue</Link></section>;
  if (!selectedExperience) return <section className={styles.empty}><p className={styles.eyebrow}>After the experience</p><h2>Your follow-up begins after an experience is completed.</h2><p>Participant access, individual products, feedback, renewal, and referrals remain connected to the original organization experience.</p><Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan an experience</Link></section>;

  const permissionReady = participants.filter((item) => item.permissionReadiness === "ready").length;
  const invitedPeople = new Set(invitations.map((item) => item.participantId)).size;
  const activatedPeople = new Set(invitations.filter((item) => item.status === "accepted").map((item) => item.participantId)).size;

  return <div className={styles.surface}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>After the experience</p>
      <h2>Keep the relationship moving.</h2>
      <p>{selectedExperience.title} · {formatDate(selectedExperience.startsAt)}</p>
      {completedExperiences.length > 1 ? <label className={styles.experiencePicker}><span>Experience</span><select value={selectedExperience.id} onChange={(event) => window.location.assign(`/organization/growth?org=${selectedOrganization.id}&experience=${event.target.value}`)}>{completedExperiences.map((experience) => <option key={experience.id} value={experience.id}>{experience.title} — {formatDate(experience.startsAt)}</option>)}</select></label> : null}
    </header>

    {error ? <p className={styles.error} role="alert">{error}</p> : null}

    <section className={styles.nextAction}>
      <div><p className={styles.eyebrow}>Next action</p><h3>{lifecyclePlan?.nextAction}</h3><p>Follow-up changes with payment, completion, feedback, and future-experience status so the organization receives the right request at the right time.</p></div>
      <Link className={styles.secondaryAction} href={`/begin?organizationId=${selectedOrganization.id}&sourceExperience=${selectedExperience.id}`}>Plan another experience</Link>
    </section>

    <section className={styles.metrics} aria-label="Participant follow-through">
      <article><span>{participants.length}</span><strong>Participants captured</strong><small>Connected to this experience</small></article>
      <article><span>{permissionReady}</span><strong>Permission ready</strong><small>Eligible for approved delivery</small></article>
      <article><span>{invitedPeople}</span><strong>Private invitations</strong><small>Participant or family access sent</small></article>
      <article><span>{activatedPeople}</span><strong>Individual accounts</strong><small>Activated from the organization event</small></article>
    </section>

    <section className={styles.individualCommerce}>
      <div><p className={styles.eyebrow}>Individual follow-through</p><h3>Turn event participation into lasting access.</h3><p>After an approved invitation is claimed, participants and families can open their private collection and request products created from the organization experience. Purchases stay attributed to this experience.</p></div>
      <Link className={styles.primaryAction} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${selectedExperience.id}&view=materials`}>Manage participant access</Link>
    </section>

    {!feedback ? <form className={styles.feedbackForm} onSubmit={handleFeedback}>
      <div><p className={styles.eyebrow}>Your experience</p><h3>How likely are you to recommend SongKeep to another organization?</h3><p>Choose a number from 0, not at all likely, to 10, extremely likely.</p></div>
      <div className={styles.scoreScale} role="group" aria-label="Recommendation score from 0 to 10">{Array.from({ length: 11 }, (_, score) => <button type="button" key={score} aria-pressed={selectedScore === score} onClick={() => setSelectedScore(score)}>{score}</button>)}</div>
      <div className={styles.formGrid}>
        <label><span>Overall satisfaction</span><select name="satisfactionScore" defaultValue="5"><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></label>
        <label><span>What was most meaningful?</span><textarea name="mostMeaningful" rows={4} /></label>
        <label><span>What could we improve?</span><textarea name="improvement" rows={4} /></label>
      </div>
      <button className={styles.primaryAction} type="submit" disabled={selectedScore === null || busy === "feedback"}>{busy === "feedback" ? "Saving…" : "Share feedback"}</button>
    </form> : <section className={styles.feedbackResult}>
      <p className={styles.eyebrow}>Thank you</p><h3>{bandMessage(feedback.band)}</h3><p>Your recommendation score: <strong>{feedback.npsScore}/10</strong></p>
    </section>}

    {band === "promoter" ? <section className={styles.advocacy}>
      <div><p className={styles.eyebrow}>Introduce someone</p><h3>Who else should experience SongKeep?</h3><p>A warm introduction creates a new organization inquiry while preserving this experience as the referral source.</p></div>
      {referralSent ? <p className={styles.success} role="status">Introduction saved. Thank you for helping another organization discover SongKeep.</p> : <form onSubmit={handleReferral} className={styles.referralForm}>
        <label><span>Organization</span><input required name="referredOrganizationName" /></label>
        <label><span>Contact name <small>Optional</small></span><input name="referredContactName" /></label>
        <label><span>Contact email <small>Optional</small></span><input type="email" name="referredContactEmail" /></label>
        <label><span>Your relationship <small>Optional</small></span><input name="relationship" placeholder="Sister community, colleague, partner…" /></label>
        <label className={styles.fullWidth}><span>Introduction note <small>Optional</small></span><textarea name="message" rows={4} /></label>
        <button className={styles.primaryAction} type="submit" disabled={busy === "referral"}>{busy === "referral" ? "Saving…" : "Save introduction"}</button>
      </form>}
    </section> : null}
  </div>;
}
