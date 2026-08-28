"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { formatOfferingPrice, participantPermissionScopes } from "@/domain/booking";
import { experienceSectionLabels, getExperienceOffering, type ExperienceSectionId } from "@/domain/experience";
import type {
  ExperienceAccessInvitation,
  ExperienceAccessRecipient,
  ExperienceAssetEntitlement,
  ExperienceParticipant,
  OrganizationAccount,
  OrganizationAgreement,
  OrganizationAsset,
  OrganizationExperience,
  OrganizationMember,
  OrganizationMemberRole,
  OrganizationSuggestedDate
} from "@/domain/organization-account";
import {
  createExperienceAccessInvitation,
  createExperienceParticipant,
  createOrganizationInvitation,
  expressInterestInSuggestedDate,
  listExperienceAccessInvitations,
  listExperienceEntitlements,
  listExperienceParticipants,
  listOrganizationAgreements,
  listOrganizationAssets,
  listOrganizationExperiences,
  listOrganizationMembers,
  listOrganizationSuggestedDates,
  listUserOrganizations,
  signOrganizationAgreement
} from "@/lib/firebase/organization-account";
import styles from "./organization-workspace.module.css";

type OrganizationWorkspaceProps = { sectionId: string };

function formatDate(value?: string) {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPastExperience(experience: OrganizationExperience) {
  if (["closed", "post_event", "assets_processing", "cancelled"].includes(experience.status)) return true;
  return experience.startsAt ? new Date(experience.startsAt).getTime() < Date.now() && experience.status !== "active" : false;
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className={styles.emptyState}><strong>{title}</strong><p>{body}</p>{action}</div>;
}

function ExperienceStage({ title, body, items }: { title: string; body: string; items: string[] }) {
  return <section className={styles.stage}><h3>{title}</h3><p>{body}</p><div>{items.map((item) => <span key={item}>{item}</span>)}</div></section>;
}

export function OrganizationWorkspace({ sectionId }: OrganizationWorkspaceProps) {
  const searchParams = useSearchParams();
  const { user, status, configurationError } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationAccount[]>([]);
  const [experiences, setExperiences] = useState<OrganizationExperience[]>([]);
  const [agreements, setAgreements] = useState<OrganizationAgreement[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [suggestedDates, setSuggestedDates] = useState<OrganizationSuggestedDate[]>([]);
  const [assets, setAssets] = useState<OrganizationAsset[]>([]);
  const [participants, setParticipants] = useState<ExperienceParticipant[]>([]);
  const [entitlements, setEntitlements] = useState<ExperienceAssetEntitlement[]>([]);
  const [accessInvitations, setAccessInvitations] = useState<ExperienceAccessInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [signingAgreementId, setSigningAgreementId] = useState<string | null>(null);

  const requestedOrganizationId = searchParams.get("org");
  const selectedExperienceId = searchParams.get("experience");
  const requestedView = searchParams.get("view") as ExperienceSectionId | null;
  const selectedOrganization = organizations.find((organization) => organization.id === requestedOrganizationId) ?? organizations[0] ?? null;
  const selectedExperience = experiences.find((experience) => experience.id === selectedExperienceId) ?? null;
  const offering = selectedExperience ? getExperienceOffering(selectedExperience.offeringId) : undefined;
  const currentMember = members.find((member) => member.userId === user?.uid);
  const canManageAccount = currentMember?.role === "organization_admin";
  const canManageExperience = ["organization_admin", "program_coordinator", "event_contact"].includes(currentMember?.role ?? "");
  const experienceSections = offering?.sections.filter((view) => (
    canManageExperience || view === "overview" || view === "materials"
  )) ?? [];
  const selectedView = experienceSections.includes(requestedView as ExperienceSectionId)
    ? requestedView as ExperienceSectionId
    : experienceSections[0] ?? "overview";

  useEffect(() => {
    if (!user) {
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const nextOrganizations = await listUserOrganizations(user.uid);
      if (cancelled) return;
      const organization = nextOrganizations.find((item) => item.id === requestedOrganizationId) ?? nextOrganizations[0];
      const detail: [
        OrganizationExperience[],
        OrganizationAgreement[],
        OrganizationMember[],
        OrganizationSuggestedDate[],
        OrganizationAsset[]
      ] = organization ? await Promise.all([
        listOrganizationExperiences(organization.id),
        listOrganizationAgreements(organization.id),
        listOrganizationMembers(organization.id),
        listOrganizationSuggestedDates(organization.id),
        listOrganizationAssets(organization.id)
      ]) : [[], [], [], [], []];
      if (cancelled) return;
      setOrganizations(nextOrganizations);
      setExperiences(detail[0]);
      setAgreements(detail[1]);
      setMembers(detail[2]);
      setSuggestedDates(detail[3]);
      setAssets(detail[4]);
    })().catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this organization account.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [requestedOrganizationId, status, user]);

  useEffect(() => {
    if (!selectedOrganization || !selectedExperience || !canManageExperience) {
      setParticipants([]);
      setEntitlements([]);
      setAccessInvitations([]);
      return;
    }
    let cancelled = false;
    setExperienceLoading(true);
    Promise.all([
      listExperienceParticipants(selectedOrganization.id, selectedExperience.id),
      listExperienceEntitlements(selectedOrganization.id, selectedExperience.id),
      listExperienceAccessInvitations(selectedOrganization.id, selectedExperience.id)
    ]).then(([nextParticipants, nextEntitlements, nextInvitations]) => {
      if (cancelled) return;
      setParticipants(nextParticipants);
      setEntitlements(nextEntitlements);
      setAccessInvitations(nextInvitations);
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this experience.");
    }).finally(() => { if (!cancelled) setExperienceLoading(false); });
    return () => { cancelled = true; };
  }, [canManageExperience, selectedExperience, selectedOrganization]);

  const upcoming = useMemo(() => experiences.filter((experience) => !isPastExperience(experience)), [experiences]);
  const past = useMemo(() => experiences.filter(isPastExperience).reverse(), [experiences]);
  const nextExperience = [...upcoming].sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999"))[0];
  const pendingAgreements = agreements.filter((agreement) => agreement.status === "requested");
  const readyAssets = assets.filter((asset) => asset.status === "ready");
  const experienceAssets = selectedExperience ? assets.filter((asset) => asset.experienceId === selectedExperience.id) : [];

  async function refreshOrganization() {
    if (!selectedOrganization) return;
    const [nextExperiences, nextAgreements, nextMembers, nextDates, nextAssets] = await Promise.all([
      listOrganizationExperiences(selectedOrganization.id),
      listOrganizationAgreements(selectedOrganization.id),
      listOrganizationMembers(selectedOrganization.id),
      listOrganizationSuggestedDates(selectedOrganization.id),
      listOrganizationAssets(selectedOrganization.id)
    ]);
    setExperiences(nextExperiences);
    setAgreements(nextAgreements);
    setMembers(nextMembers);
    setSuggestedDates(nextDates);
    setAssets(nextAssets);
  }

  async function refreshExperience() {
    if (!selectedOrganization || !selectedExperience) return;
    const [nextParticipants, nextEntitlements, nextInvitations] = await Promise.all([
      listExperienceParticipants(selectedOrganization.id, selectedExperience.id),
      listExperienceEntitlements(selectedOrganization.id, selectedExperience.id),
      listExperienceAccessInvitations(selectedOrganization.id, selectedExperience.id)
    ]);
    setParticipants(nextParticipants);
    setEntitlements(nextEntitlements);
    setAccessInvitations(nextInvitations);
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrganization || !user) return;
    const form = new FormData(event.currentTarget);
    setBusyAction("invite");
    setError(null);
    try {
      const invitation = await createOrganizationInvitation({
        organizationId: selectedOrganization.id,
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? "viewer") as OrganizationMemberRole,
        invitedBy: user.uid
      });
      setInviteLink(`${window.location.origin}/accept-invitation?org=${selectedOrganization.id}&id=${invitation.id}`);
      event.currentTarget.reset();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "We could not create the invitation.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAgreementSignature(event: FormEvent<HTMLFormElement>, agreementId: string) {
    event.preventDefault();
    if (!selectedOrganization || !user) return;
    const form = new FormData(event.currentTarget);
    setBusyAction(`agreement-${agreementId}`);
    setError(null);
    try {
      await signOrganizationAgreement({
        organizationId: selectedOrganization.id,
        agreementId,
        userId: user.uid,
        signedByName: String(form.get("signedByName") ?? ""),
        signedByTitle: String(form.get("signedByTitle") ?? ""),
        electronicRecordsAccepted: form.get("electronicRecordsAccepted") === "on"
      });
      setSigningAgreementId(null);
      await refreshOrganization();
    } catch (signatureError) {
      setError(signatureError instanceof Error ? signatureError.message : "We could not save this signature.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSuggestedDate(suggestionId: string) {
    if (!selectedOrganization) return;
    setBusyAction(`date-${suggestionId}`);
    setError(null);
    try {
      await expressInterestInSuggestedDate(selectedOrganization.id, suggestionId);
      await refreshOrganization();
    } catch (dateError) {
      setError(dateError instanceof Error ? dateError.message : "We could not save your interest in this date.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrganization || !selectedExperience) return;
    const form = new FormData(event.currentTarget);
    setBusyAction("participant");
    setError(null);
    try {
      await createExperienceParticipant({
        organizationId: selectedOrganization.id,
        experienceId: selectedExperience.id,
        displayName: String(form.get("displayName") ?? ""),
        familyContactName: String(form.get("familyContactName") ?? "") || undefined,
        familyContactEmail: String(form.get("familyContactEmail") ?? "") || undefined
      });
      event.currentTarget.reset();
      await refreshExperience();
    } catch (participantError) {
      setError(participantError instanceof Error ? participantError.message : "We could not add the participant.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleShareAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrganization || !selectedExperience || !user) return;
    const form = new FormData(event.currentTarget);
    const participant = participants.find((item) => item.id === String(form.get("participantId") ?? ""));
    if (!participant) return;
    setBusyAction(`share-${participant.id}`);
    setError(null);
    try {
      const invitation = await createExperienceAccessInvitation({
        organization: selectedOrganization,
        experience: selectedExperience,
        participant,
        recipient: String(form.get("recipient") ?? "participant") as ExperienceAccessRecipient,
        recipientEmail: String(form.get("recipientEmail") ?? ""),
        recipientName: String(form.get("recipientName") ?? "") || undefined,
        invitedBy: user.uid
      });
      setAccessLink(`${window.location.origin}/claim?org=${selectedOrganization.id}&experience=${selectedExperience.id}&id=${invitation.id}`);
      await refreshExperience();
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "We could not create participant access.");
    } finally {
      setBusyAction(null);
    }
  }

  if (status === "loading" || loading) return <div className={styles.status}>Opening your organization account…</div>;
  if (status === "unavailable") return <EmptyState title="Account connection is not configured here." body={configurationError ?? "Add the Firebase web configuration before using account features."} />;
  if (status === "signed_out" || !user) return <EmptyState title="Sign in to continue." body="Organization experiences, agreements, and event materials are private to authorized team members." action={<Link className={styles.primaryAction} href="/login">Sign in</Link>} />;
  if (error && organizations.length === 0) return <EmptyState title="We could not open this account." body={error} />;
  if (!selectedOrganization) return <EmptyState title="No organization is connected to this account yet." body="Finish your organization account or accept a team invitation." action={<Link className={styles.primaryAction} href="/create-account?complete=organization">Finish organization account</Link>} />;

  const orgQuery = `?org=${selectedOrganization.id}`;

  return <div className={styles.workspace}>
    {organizations.length > 1 ? <div className={styles.orgSwitcher}><span>Organization</span><div>{organizations.map((organization) => <Link className={organization.id === selectedOrganization.id ? styles.activeOrg : ""} href={`/organization${sectionId === "organization-home" ? "" : `/${sectionId.replace("organization-", "")}`}?org=${organization.id}`} key={organization.id}>{organization.name}</Link>)}</div></div> : null}
    {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

    {sectionId === "organization-home" ? <section className={styles.home}>
      <div className={styles.welcome}><p>Welcome back</p><h2>{selectedOrganization.name}</h2></div>
      {nextExperience ? <article className={styles.nextExperience}><div><p className={styles.kicker}>Your next experience</p><h3>{nextExperience.title}</h3><p>{formatDate(nextExperience.startsAt)}{nextExperience.venue ? ` · ${nextExperience.venue}` : ""}</p></div><div className={styles.nextMeta}><span>{titleize(nextExperience.status)}</span>{nextExperience.nextAction ? <p><strong>Next:</strong> {nextExperience.nextAction}</p> : null}<Link className={styles.primaryAction} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${nextExperience.id}`}>Open experience</Link></div></article> : <EmptyState title="No upcoming experience is scheduled." body="Plan the next Honor a Life Song experience when your organization is ready." action={<Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan an experience</Link>} />}
      <div className={styles.homeColumns}><section><div className={styles.sectionHeading}><div><p className={styles.kicker}>Needs attention</p><h3>Agreements</h3></div><Link href={`/organization/account${orgQuery}`}>View account</Link></div>{pendingAgreements.length ? pendingAgreements.slice(0, 3).map((agreement) => <div className={styles.lineItem} key={agreement.id}><span>{agreement.title}</span><strong>Signature needed</strong></div>) : <p className={styles.quiet}>Nothing needs a signature right now.</p>}</section><section><div className={styles.sectionHeading}><div><p className={styles.kicker}>From your experiences</p><h3>Songs &amp; memories</h3></div><Link href={`/organization/library${orgQuery}`}>Open library</Link></div>{readyAssets.length ? readyAssets.slice(0, 4).map((asset) => <div className={styles.lineItem} key={asset.id}><span>{asset.title}</span><strong>{titleize(asset.kind)}</strong></div>) : <p className={styles.quiet}>Approved organization materials will appear here.</p>}</section></div>
      <section className={styles.planAhead}><div><p className={styles.kicker}>Plan ahead</p><h3>Suggested dates</h3><p>Suggested dates are invitations to discuss availability, not automatic reservations.</p></div><div className={styles.dateList}>{suggestedDates.length ? suggestedDates.slice(0, 4).map((suggestion) => <button disabled={busyAction === `date-${suggestion.id}` || suggestion.status === "interested"} onClick={() => handleSuggestedDate(suggestion.id)} type="button" key={suggestion.id}><strong>{formatDate(suggestion.startsAt)}</strong><span>{suggestion.status === "interested" ? "Interest sent" : suggestion.label ?? "I'm interested"}</span></button>) : <span className={styles.quiet}>No future dates have been suggested yet.</span>}</div></section>
    </section> : null}

    {sectionId === "organization-experiences" ? <section>{selectedExperience && offering ? <div className={styles.experienceDetail}>
      <Link className={styles.backLink} href={`/organization/experiences${orgQuery}`}>← All experiences</Link>
      <p className={styles.kicker}>{formatOfferingPrice(offering.priceCents)} · {titleize(selectedExperience.status)}</p><h2>{selectedExperience.title}</h2><p className={styles.detailDate}>{offering.name} · {formatDate(selectedExperience.startsAt)}{selectedExperience.venue ? ` · ${selectedExperience.venue}` : ""}</p>
      <nav className={styles.experienceNav} aria-label={`${selectedExperience.title} sections`}>{experienceSections.map((view) => <Link aria-current={selectedView === view ? "page" : undefined} className={selectedView === view ? styles.activeView : ""} key={view} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${selectedExperience.id}&view=${view}`}>{experienceSectionLabels[view]}</Link>)}</nav>
      {experienceLoading ? <p className={styles.quiet}>Opening experience details…</p> : null}
      {selectedView === "overview" ? <>
        <div className={styles.detailRows}>{selectedExperience.nextAction ? <div><span>Your next step</span><strong>{selectedExperience.nextAction}</strong></div> : null}<div><span>Experience</span><strong>{offering.name}</strong></div>{selectedExperience.participantMode === "named_roster" ? canManageExperience ? <div><span>Participants</span><strong>{participants.length} enrolled · {participants.filter((participant) => participant.permissionReadiness === "ready").length} permission ready</strong></div> : null : <div><span>Format</span><strong>Group event · one shared song</strong></div>}{selectedExperience.billingStatus ? <div><span>Billing</span><strong>{titleize(selectedExperience.billingStatus)}</strong></div> : null}</div>
        {selectedExperience.invoiceUrl ? <a className={styles.secondaryAction} href={selectedExperience.invoiceUrl} target="_blank" rel="noreferrer">View invoice</a> : null}
        {isPastExperience(selectedExperience) ? <div className={styles.postEvent}><h3>Continue from this experience</h3><p>Return to approved event materials, share permissioned participant access, or plan another organization experience.</p><div><Link href={`/organization/experiences?org=${selectedOrganization.id}&experience=${selectedExperience.id}&view=materials`}>Event materials &amp; sharing</Link><Link href={`/begin?organizationId=${selectedOrganization.id}&sourceExperience=${selectedExperience.id}`}>Plan another experience</Link></div></div> : null}
      </> : null}
      {selectedView === "event_setup" ? <ExperienceStage title="A light group-event setup" body="The $200 event does not pretend to be the full multi-touch program." items={["Venue and primary contact", "Group information", "Needed permissions", "Event presentation", "Shared song and approved materials"]} /> : null}
      {selectedView === "participants" ? <section className={styles.participantSection}><div className={styles.sectionHeading}><div><h3>Participants</h3><p>Participants belong to this experience. They do not need accounts simply to take part.</p></div></div>{participants.length ? <div className={styles.participantList}>{participants.map((participant) => <div key={participant.id}><div><strong>{participant.displayName}</strong><span>{participant.familyContactName ? `Family contact: ${participant.familyContactName}` : "No family contact added"}</span></div><span>{titleize(participant.permissionReadiness)}</span></div>)}</div> : <p className={styles.quiet}>No participants have been added yet.</p>}{canManageExperience ? <form className={styles.participantForm} onSubmit={handleAddParticipant}><label><span>Participant name</span><input required name="displayName" /></label><label><span>Family contact name</span><input name="familyContactName" /></label><label><span>Family contact email</span><input type="email" name="familyContactEmail" /></label><button disabled={busyAction === "participant"} type="submit">{busyAction === "participant" ? "Adding…" : "Add participant"}</button></form> : null}<details className={styles.permissionGuide}><summary>Printable participant permission form</summary><p>Each choice remains separate. A participant or authorized representative can complete the form electronically, with assistance, or on paper.</p><ul>{participantPermissionScopes.map((scope) => <li key={scope.scope}><strong>{scope.label}</strong><span>{scope.description}</span></li>)}</ul><button type="button" onClick={() => window.print()}>Print permission form</button></details></section> : null}
      {selectedView === "interviews" ? <ExperienceStage title="Flexible story conversations" body="Participants can join individual, group, or family-supported conversations without following one rigid path." items={["Interview schedule", "Story preparation", "Family contributions when invited", "Accessibility and comfort", "Consent readiness"]} /> : null}
      {selectedView === "songs" ? <ExperienceStage title="Participant songs" body="Multiple songs remain connected to this experience while participant permissions control review, performance, and delivery." items={["Story readiness", "Song development", "Review", "Production", "Private delivery"]} /> : null}
      {selectedView === "shared_song" ? <ExperienceStage title="One shared song" body="The group event centers on shared story capture and one song for the event, without exposing the full-program workflow." items={["Shared themes", "Song development", "Presentation readiness", "Approved organization materials"]} /> : null}
      {selectedView === "concert" ? <ExperienceStage title="Follow-up concert" body="The full experience returns participants, families, and the organization to a shared celebration." items={["Date and venue", "Run of show", "Accessibility", "Participant and family attendance", "Photo and video choices"]} /> : null}
      {selectedView === "materials" ? <section className={styles.materialsSection}><div className={styles.sectionHeading}><div><h3>Event materials</h3><p>The organization sees only assets released to it. Participant songs and family access remain separately entitled.</p></div></div>{experienceAssets.length ? <div className={styles.assetList}>{experienceAssets.map((asset) => <article key={asset.id}><div><span className={styles.assetKind}>{titleize(asset.kind)}</span><h3>{asset.title}</h3><p>{asset.status === "ready" ? "Ready for the organization" : titleize(asset.status)}</p></div>{asset.status === "ready" && asset.downloadUrl ? <a href={asset.downloadUrl} target="_blank" rel="noreferrer">Open</a> : <span>{asset.status === "processing" ? "Being prepared" : "Restricted"}</span>}</article>)}</div> : <p className={styles.quiet}>No organization materials have been released for this experience yet.</p>}
        {canManageExperience ? <div className={styles.shareSection}><p className={styles.kicker}>Participant &amp; family sharing</p><h3>Share only what each person is entitled to receive.</h3><p>Creating access never grants a new permission. It uses active asset entitlements already established from the participant&apos;s consent record.</p>{participants.length ? <div className={styles.shareList}>{participants.map((participant) => {
          const participantEntitlements = entitlements.filter((item) => item.participantId === participant.id && item.status === "active");
          const latestInvite = accessInvitations.find((item) => item.participantId === participant.id);
          return <article key={participant.id}><div><strong>{participant.displayName}</strong><span>{participantEntitlements.length ? `${participantEntitlements.length} permissioned items ready` : "No permissioned materials ready"}</span>{latestInvite ? <small>Latest access: {titleize(latestInvite.status)}</small> : null}</div>{canManageExperience ? <form onSubmit={handleShareAccess}><input type="hidden" name="participantId" value={participant.id} /><label><span>Recipient</span><select name="recipient" defaultValue={participant.familyContactEmail ? "designated_family" : "participant"}><option value="participant">Participant</option><option value="designated_family">Designated family</option></select></label><label><span>Email</span><input required type="email" name="recipientEmail" defaultValue={participant.familyContactEmail ?? ""} /></label><label><span>Name</span><input name="recipientName" defaultValue={participant.familyContactName ?? ""} /></label><button type="submit" disabled={!participantEntitlements.length || busyAction === `share-${participant.id}`}>{busyAction === `share-${participant.id}` ? "Creating…" : "Create private access"}</button></form> : null}</article>;
        })}</div> : <p className={styles.quiet}>Add participants before preparing participant or family access.</p>}{accessLink ? <div className={styles.inviteResult}><strong>Private access created</strong><p>Transactional email is not connected yet. Copy this link for the intended recipient or print it as an access card.</p><code>{accessLink}</code><button type="button" onClick={() => window.print()}>Print access card</button></div> : null}</div> : null}
      </section> : null}
    </div> : <><div className={styles.sectionHeading}><div><p className={styles.kicker}>Experiences</p><h2>Upcoming</h2></div><Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan an experience</Link></div><div className={styles.experienceList}>{upcoming.length ? upcoming.map((experience) => <Link className={styles.experienceRow} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${experience.id}`} key={experience.id}><div><strong>{experience.title}</strong><span>{getExperienceOffering(experience.offeringId)?.name} · {formatDate(experience.startsAt)}</span></div><span>{titleize(experience.status)} →</span></Link>) : <p className={styles.quiet}>No upcoming experiences are scheduled.</p>}</div><div className={styles.sectionHeading}><div><p className={styles.kicker}>Your history</p><h2>Past experiences</h2></div></div><div className={styles.experienceList}>{past.length ? past.map((experience) => <Link className={styles.experienceRow} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${experience.id}`} key={experience.id}><div><strong>{experience.title}</strong><span>{getExperienceOffering(experience.offeringId)?.name} · {formatDate(experience.startsAt)}</span></div><span>Revisit →</span></Link>) : <p className={styles.quiet}>Completed experiences will remain here as part of your organization&apos;s history.</p>}</div></>}</section> : null}

    {sectionId === "organization-library" ? <section><div className={styles.sectionHeading}><div><p className={styles.kicker}>Your archive</p><h2>Songs &amp; memories</h2><p>Only materials released to this organization appear here. Participant and family materials use separate permissioned access.</p></div></div>{assets.length ? <div className={styles.assetList}>{assets.map((asset) => <article key={asset.id}><div><span className={styles.assetKind}>{titleize(asset.kind)}</span><h3>{asset.title}</h3><p>{asset.status === "ready" ? "Ready" : titleize(asset.status)}</p></div>{asset.status === "ready" && asset.downloadUrl ? <a href={asset.downloadUrl} target="_blank" rel="noreferrer">Open</a> : <span>{asset.status === "processing" ? "Being prepared" : "Restricted"}</span>}</article>)}</div> : <EmptyState title="Your archive is ready for the first delivery." body="Approved event videos, photos, reports, shared songs, and other organization materials will stay connected to the experience that created them." />}<div className={styles.postEventActions}><h3>Bring the experience back</h3><div><Link href={`/begin?organizationId=${selectedOrganization.id}&offering=single-song-group-event`}>Plan a group event</Link><Link href={`/begin?organizationId=${selectedOrganization.id}&offering=honor-a-life-song-experience`}>Plan a full experience</Link></div></div></section> : null}

    {sectionId === "organization-account" ? <section><div className={styles.accountHeader}><div><p className={styles.kicker}>Organization account</p><h2>{selectedOrganization.name}</h2><p>{titleize(selectedOrganization.kind)}</p></div></div><section className={styles.accountSection}><div className={styles.sectionHeading}><div><h3>Team</h3><p>Each person signs in with their own verified account. Removing someone does not remove the organization&apos;s event history.</p></div></div><div className={styles.memberList}>{members.map((member) => <div className={styles.memberRow} key={member.userId}><div><strong>{member.displayName}</strong><span>{member.email}</span></div><span>{titleize(member.role)}</span></div>)}</div>{canManageAccount ? <form className={styles.inviteForm} onSubmit={handleInvite}><label><span>Invite by email</span><input required type="email" name="email" placeholder="colleague@example.com" /></label><label><span>They can</span><select name="role" defaultValue="program_coordinator"><option value="organization_admin">Manage our account</option><option value="program_coordinator">Manage programs and events</option><option value="billing_contact">Handle billing</option><option value="event_contact">Help with events</option><option value="viewer">View only</option></select></label><button disabled={busyAction === "invite"} type="submit">{busyAction === "invite" ? "Creating invitation…" : "Create invitation"}</button></form> : null}{inviteLink ? <div className={styles.inviteResult}><strong>Invitation created</strong><p>The recipient must sign in with and verify the invited email address. Until transactional email is connected, deliver this join link directly to that person:</p><code>{inviteLink}</code></div> : null}</section><section className={styles.accountSection}><div className={styles.sectionHeading}><div><h3>Agreements</h3><p>Organization agreements are separate from participant consent and media permissions.</p></div></div>{agreements.length ? <div className={styles.agreementList}>{agreements.map((agreement) => <article key={agreement.id}><div><strong>{agreement.title}</strong><span>Version {agreement.documentVersion} · {titleize(agreement.status)}</span>{agreement.signedAt ? <small>Signed {formatDate(agreement.signedAt)} by {agreement.signedByName}</small> : null}</div><div className={styles.agreementActions}>{agreement.documentUrl ? <a href={agreement.documentUrl} target="_blank" rel="noreferrer">View / print</a> : null}{agreement.status === "requested" && canManageAccount ? <button type="button" onClick={() => setSigningAgreementId(signingAgreementId === agreement.id ? null : agreement.id)}>Sign online</button> : null}</div>{signingAgreementId === agreement.id ? <form className={styles.signatureForm} onSubmit={(event) => handleAgreementSignature(event, agreement.id)}><label><span>Your legal name</span><input required name="signedByName" defaultValue={user.displayName ?? ""} /></label><label><span>Title / authority</span><input required name="signedByTitle" placeholder="Executive Director" /></label><label className={styles.checkbox}><input required type="checkbox" name="electronicRecordsAccepted" /><span>I agree to use electronic records and signatures for this agreement.</span></label><button disabled={busyAction === `agreement-${agreement.id}`} type="submit">{busyAction === `agreement-${agreement.id}` ? "Signing…" : "Sign agreement"}</button></form> : null}</article>)}</div> : <p className={styles.quiet}>No organization agreements have been requested yet.</p>}</section><section className={styles.accountSection}><div className={styles.sectionHeading}><div><h3>Billing</h3><p>Invoices and payment status stay attached to the experience they belong to.</p></div></div>{experiences.filter((experience) => experience.billingStatus || experience.invoiceUrl).length ? <div className={styles.billingList}>{experiences.filter((experience) => experience.billingStatus || experience.invoiceUrl).map((experience) => <div key={experience.id}><div><strong>{experience.title}</strong><span>{experience.billingStatus ? titleize(experience.billingStatus) : "Invoice available"}</span></div>{experience.invoiceUrl ? <a href={experience.invoiceUrl} target="_blank" rel="noreferrer">View invoice</a> : null}</div>)}</div> : <p className={styles.quiet}>Billing information will appear here when an experience has an invoice or payment record.</p>}</section></section> : null}

    {sectionId === "organization-help" ? <section className={styles.help}><p className={styles.kicker}>Help</p><h2>What do you need help with?</h2><div><a href="mailto:help@honoralifesong.com?subject=Organization%20account%20help">Account or agreement</a><a href="mailto:help@honoralifesong.com?subject=Upcoming%20experience%20help">Upcoming experience</a><a href="mailto:help@honoralifesong.com?subject=Completed%20event%20materials">Songs or event materials</a></div></section> : null}
  </div>;
}
