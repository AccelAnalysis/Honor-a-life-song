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
  if (!value) return "Date TBD";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPastExperience(experience: OrganizationExperience) {
  if (["closed", "post_event", "assets_processing", "cancelled"].includes(experience.status)) return true;
  return experience.startsAt ? new Date(experience.startsAt).getTime() < Date.now() && experience.status !== "active" : false;
}

function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return <div className={styles.emptyState}><strong>{title}</strong>{body ? <p>{body}</p> : null}{action}</div>;
}

function ExperienceStage({ title, items }: { title: string; items: string[] }) {
  return <section className={styles.stage}><h3>{title}</h3><div>{items.map((item) => <span key={item}>{item}</span>)}</div></section>;
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
  const experienceSections = offering?.sections.filter((view) => canManageExperience || view === "overview" || view === "materials") ?? [];
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
      const detail: [OrganizationExperience[], OrganizationAgreement[], OrganizationMember[], OrganizationSuggestedDate[], OrganizationAsset[]] = organization
        ? await Promise.all([
            listOrganizationExperiences(organization.id),
            listOrganizationAgreements(organization.id),
            listOrganizationMembers(organization.id),
            listOrganizationSuggestedDates(organization.id),
            listOrganizationAssets(organization.id)
          ])
        : [[], [], [], [], []];
      if (cancelled) return;
      setOrganizations(nextOrganizations);
      setExperiences(detail[0]);
      setAgreements(detail[1]);
      setMembers(detail[2]);
      setSuggestedDates(detail[3]);
      setAssets(detail[4]);
    })().catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this account.");
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
      setError(dateError instanceof Error ? dateError.message : "We could not save your interest.");
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
      setError(shareError instanceof Error ? shareError.message : "We could not create private access.");
    } finally {
      setBusyAction(null);
    }
  }

  if (status === "loading" || loading) return <div className={styles.status}>Opening SongKeep…</div>;
  if (status === "unavailable") return <EmptyState title="Account unavailable." body={configurationError ?? "Account access is unavailable here."} />;
  if (status === "signed_out" || !user) return <EmptyState title="Sign in to continue." action={<Link className={styles.primaryAction} href="/login">Sign in</Link>} />;
  if (error && organizations.length === 0) return <EmptyState title="We could not open this account." body={error} />;
  if (!selectedOrganization) return <EmptyState title="Finish your setup." action={<Link className={styles.primaryAction} href="/create-account?complete=organization">Continue</Link>} />;

  const orgQuery = `?org=${selectedOrganization.id}`;

  return <div className={styles.workspace}>
    {organizations.length > 1 ? <div className={styles.orgSwitcher}><span>Organization</span><div>{organizations.map((organization) => <Link className={organization.id === selectedOrganization.id ? styles.activeOrg : ""} href={`/organization${sectionId === "organization-home" ? "" : `/${sectionId.replace("organization-", "")}`}?org=${organization.id}`} key={organization.id}>{organization.name}</Link>)}</div></div> : null}
    {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

    {sectionId === "organization-home" ? <section className={styles.home}>
      <div className={styles.welcome}><h2>{selectedOrganization.name}</h2></div>
      {nextExperience ? <article className={styles.nextExperience}><div><p className={styles.kicker}>Next</p><h3>{nextExperience.title}</h3><p>{formatDate(nextExperience.startsAt)}{nextExperience.venue ? ` · ${nextExperience.venue}` : ""}</p></div><div className={styles.nextMeta}><span>{titleize(nextExperience.status)}</span>{nextExperience.nextAction ? <p><strong>Next:</strong> {nextExperience.nextAction}</p> : null}<Link className={styles.primaryAction} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${nextExperience.id}`}>Open</Link></div></article> : <EmptyState title="No upcoming experiences." body="Ready for another?" action={<Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan one</Link>} />}
      <div className={styles.homeColumns}>
        <section><div className={styles.sectionHeading}><div><h3>To do</h3></div><Link href={`/organization/account${orgQuery}`}>Account</Link></div>{pendingAgreements.length ? pendingAgreements.slice(0, 3).map((agreement) => <div className={styles.lineItem} key={agreement.id}><span>{agreement.title}</span><strong>Sign</strong></div>) : <p className={styles.quiet}>All caught up.</p>}</section>
        <section><div className={styles.sectionHeading}><div><h3>Library</h3></div><Link href={`/organization/library${orgQuery}`}>Open</Link></div>{readyAssets.length ? readyAssets.slice(0, 4).map((asset) => <div className={styles.lineItem} key={asset.id}><span>{asset.title}</span><strong>{titleize(asset.kind)}</strong></div>) : <p className={styles.quiet}>Nothing here yet.</p>}</section>
      </div>
      <section className={styles.planAhead}><div><h3>Dates</h3></div><div className={styles.dateList}>{suggestedDates.length ? suggestedDates.slice(0, 4).map((suggestion) => <button disabled={busyAction === `date-${suggestion.id}` || suggestion.status === "interested"} onClick={() => handleSuggestedDate(suggestion.id)} type="button" key={suggestion.id}><strong>{formatDate(suggestion.startsAt)}</strong><span>{suggestion.status === "interested" ? "Interested" : suggestion.label ?? "I'm interested"}</span></button>) : <span className={styles.quiet}>No suggested dates.</span>}</div></section>
    </section> : null}

    {sectionId === "organization-experiences" ? <section>{selectedExperience && offering ? <div className={styles.experienceDetail}>
      <Link className={styles.backLink} href={`/organization/experiences${orgQuery}`}>← Experiences</Link>
      <p className={styles.kicker}>{formatOfferingPrice(offering.priceCents)} · {titleize(selectedExperience.status)}</p>
      <h2>{selectedExperience.title}</h2>
      <p className={styles.detailDate}>{offering.name} · {formatDate(selectedExperience.startsAt)}{selectedExperience.venue ? ` · ${selectedExperience.venue}` : ""}</p>
      <nav className={styles.experienceNav} aria-label={`${selectedExperience.title} sections`}>{experienceSections.map((view) => <Link aria-current={selectedView === view ? "page" : undefined} className={selectedView === view ? styles.activeView : ""} key={view} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${selectedExperience.id}&view=${view}`}>{experienceSectionLabels[view]}</Link>)}</nav>
      {experienceLoading ? <p className={styles.quiet}>Opening…</p> : null}
      {selectedView === "overview" ? <>
        <div className={styles.detailRows}>
          {selectedExperience.nextAction ? <div><span>Next</span><strong>{selectedExperience.nextAction}</strong></div> : null}
          {selectedExperience.participantMode === "named_roster" ? canManageExperience ? <div><span>Participants</span><strong>{participants.length} · {participants.filter((participant) => participant.permissionReadiness === "ready").length} ready</strong></div> : null : <div><span>Format</span><strong>Group · one song</strong></div>}
          {selectedExperience.billingStatus ? <div><span>Billing</span><strong>{titleize(selectedExperience.billingStatus)}</strong></div> : null}
        </div>
        {selectedExperience.invoiceUrl ? <a className={styles.secondaryAction} href={selectedExperience.invoiceUrl} target="_blank" rel="noreferrer">Invoice</a> : null}
        {isPastExperience(selectedExperience) ? <div className={styles.postEvent}><h3>What’s next?</h3><div><Link href={`/organization/experiences?org=${selectedOrganization.id}&experience=${selectedExperience.id}&view=materials`}>Materials &amp; sharing</Link><Link href={`/begin?organizationId=${selectedOrganization.id}&sourceExperience=${selectedExperience.id}`}>Plan another</Link></div></div> : null}
      </> : null}
      {selectedView === "event_setup" ? <ExperienceStage title="Event setup" items={["Venue & contact", "Group", "Permissions", "Presentation", "Shared song"]} /> : null}
      {selectedView === "participants" ? <section className={styles.participantSection}>
        <div className={styles.sectionHeading}><div><h3>Participants</h3></div></div>
        {participants.length ? <div className={styles.participantList}>{participants.map((participant) => <div key={participant.id}><div><strong>{participant.displayName}</strong><span>{participant.familyContactName ?? "No family contact"}</span></div><span>{titleize(participant.permissionReadiness)}</span></div>)}</div> : <p className={styles.quiet}>No participants yet.</p>}
        {canManageExperience ? <form className={styles.participantForm} onSubmit={handleAddParticipant}><label><span>Name</span><input required name="displayName" /></label><label><span>Family contact</span><input name="familyContactName" /></label><label><span>Email</span><input type="email" name="familyContactEmail" /></label><button disabled={busyAction === "participant"} type="submit">{busyAction === "participant" ? "Adding…" : "Add"}</button></form> : null}
        <details className={styles.permissionGuide}><summary>Participant permission form</summary><p>Complete digitally, with assistance, or on paper.</p><ul>{participantPermissionScopes.map((scope) => <li key={scope.scope}><strong>{scope.label}</strong><span>{scope.description}</span></li>)}</ul><button type="button" onClick={() => window.print()}>Print</button></details>
      </section> : null}
      {selectedView === "interviews" ? <ExperienceStage title="Interviews" items={["Schedule", "Story prep", "Family input", "Accessibility", "Permissions"]} /> : null}
      {selectedView === "songs" ? <ExperienceStage title="Songs" items={["Story ready", "Writing", "Review", "Production", "Delivery"]} /> : null}
      {selectedView === "shared_song" ? <ExperienceStage title="Shared song" items={["Themes", "Writing", "Presentation", "Materials"]} /> : null}
      {selectedView === "concert" ? <ExperienceStage title="Concert" items={["Date & venue", "Run of show", "Accessibility", "Guests", "Photo & video"]} /> : null}
      {selectedView === "materials" ? <section className={styles.materialsSection}>
        <div className={styles.sectionHeading}><div><h3>Materials</h3></div></div>
        {experienceAssets.length ? <div className={styles.assetList}>{experienceAssets.map((asset) => <article key={asset.id}><div><span className={styles.assetKind}>{titleize(asset.kind)}</span><h3>{asset.title}</h3><p>{asset.status === "ready" ? "Ready" : titleize(asset.status)}</p></div>{asset.status === "ready" && asset.downloadUrl ? <a href={asset.downloadUrl} target="_blank" rel="noreferrer">Open</a> : <span>{asset.status === "processing" ? "Preparing" : "Restricted"}</span>}</article>)}</div> : <p className={styles.quiet}>Nothing released yet.</p>}
        {canManageExperience ? <div className={styles.shareSection}><h3>Share access</h3><p>Only approved items can be shared.</p>{participants.length ? <div className={styles.shareList}>{participants.map((participant) => {
          const participantEntitlements = entitlements.filter((item) => item.participantId === participant.id && item.status === "active");
          const latestInvite = accessInvitations.find((item) => item.participantId === participant.id);
          return <article key={participant.id}><div><strong>{participant.displayName}</strong><span>{participantEntitlements.length ? `${participantEntitlements.length} items ready` : "Nothing ready"}</span>{latestInvite ? <small>{titleize(latestInvite.status)}</small> : null}</div><details><summary>Share</summary><form onSubmit={handleShareAccess}><input type="hidden" name="participantId" value={participant.id} /><label><span>Recipient</span><select name="recipient" defaultValue={participant.familyContactEmail ? "designated_family" : "participant"}><option value="participant">Participant</option><option value="designated_family">Family</option></select></label><label><span>Email</span><input required type="email" name="recipientEmail" defaultValue={participant.familyContactEmail ?? ""} /></label><label><span>Name</span><input name="recipientName" defaultValue={participant.familyContactName ?? ""} /></label><button type="submit" disabled={!participantEntitlements.length || busyAction === `share-${participant.id}`}>{busyAction === `share-${participant.id}` ? "Creating…" : "Create link"}</button></form></details></article>;
        })}</div> : <p className={styles.quiet}>Add participants first.</p>}{accessLink ? <div className={styles.inviteResult}><strong>Private link ready</strong><code>{accessLink}</code><button type="button" onClick={() => window.print()}>Print</button></div> : null}</div> : null}
      </section> : null}
    </div> : <>
      <div className={styles.sectionHeading}><div><h2>Upcoming</h2></div><Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan</Link></div>
      <div className={styles.experienceList}>{upcoming.length ? upcoming.map((experience) => <Link className={styles.experienceRow} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${experience.id}`} key={experience.id}><div><strong>{experience.title}</strong><span>{getExperienceOffering(experience.offeringId)?.name} · {formatDate(experience.startsAt)}</span></div><span>{titleize(experience.status)} →</span></Link>) : <p className={styles.quiet}>Nothing scheduled.</p>}</div>
      <div className={styles.sectionHeading}><div><h2>Past</h2></div></div>
      <div className={styles.experienceList}>{past.length ? past.map((experience) => <Link className={styles.experienceRow} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${experience.id}`} key={experience.id}><div><strong>{experience.title}</strong><span>{getExperienceOffering(experience.offeringId)?.name} · {formatDate(experience.startsAt)}</span></div><span>Open →</span></Link>) : <p className={styles.quiet}>No past experiences.</p>}</div>
    </>}</section> : null}

    {sectionId === "organization-library" ? <section>
      <div className={styles.sectionHeading}><div><h2>Library</h2></div></div>
      {assets.length ? <div className={styles.assetList}>{assets.map((asset) => <article key={asset.id}><div><span className={styles.assetKind}>{titleize(asset.kind)}</span><h3>{asset.title}</h3><p>{asset.status === "ready" ? "Ready" : titleize(asset.status)}</p></div>{asset.status === "ready" && asset.downloadUrl ? <a href={asset.downloadUrl} target="_blank" rel="noreferrer">Open</a> : <span>{asset.status === "processing" ? "Preparing" : "Restricted"}</span>}</article>)}</div> : <EmptyState title="Nothing here yet." />}
      <div className={styles.postEventActions}><h3>Plan another</h3><div><Link href={`/begin?organizationId=${selectedOrganization.id}&offering=single-song-group-event`}>Group event</Link><Link href={`/begin?organizationId=${selectedOrganization.id}&offering=honor-a-life-song-experience`}>Full experience</Link></div></div>
    </section> : null}

    {sectionId === "organization-account" ? <section>
      <div className={styles.accountHeader}><div><h2>{selectedOrganization.name}</h2><p>{titleize(selectedOrganization.kind)}</p></div></div>
      <section className={styles.accountSection}><div className={styles.sectionHeading}><div><h3>Team</h3></div></div><div className={styles.memberList}>{members.map((member) => <div className={styles.memberRow} key={member.userId}><div><strong>{member.displayName}</strong><span>{member.email}</span></div><span>{titleize(member.role)}</span></div>)}</div>{canManageAccount ? <form className={styles.inviteForm} onSubmit={handleInvite}><label><span>Email</span><input required type="email" name="email" placeholder="colleague@example.com" /></label><label><span>Role</span><select name="role" defaultValue="program_coordinator"><option value="organization_admin">Account admin</option><option value="program_coordinator">Program coordinator</option><option value="billing_contact">Billing</option><option value="event_contact">Event contact</option><option value="viewer">View only</option></select></label><button disabled={busyAction === "invite"} type="submit">{busyAction === "invite" ? "Creating…" : "Invite"}</button></form> : null}{inviteLink ? <div className={styles.inviteResult}><strong>Invite ready</strong><code>{inviteLink}</code></div> : null}</section>
      <section className={styles.accountSection}><div className={styles.sectionHeading}><div><h3>Agreements</h3></div></div>{agreements.length ? <div className={styles.agreementList}>{agreements.map((agreement) => <article key={agreement.id}><div><strong>{agreement.title}</strong><span>v{agreement.documentVersion} · {titleize(agreement.status)}</span>{agreement.signedAt ? <small>Signed {formatDate(agreement.signedAt)}</small> : null}</div><div className={styles.agreementActions}>{agreement.documentUrl ? <a href={agreement.documentUrl} target="_blank" rel="noreferrer">View</a> : null}{agreement.status === "requested" && canManageAccount ? <button type="button" onClick={() => setSigningAgreementId(signingAgreementId === agreement.id ? null : agreement.id)}>Sign</button> : null}</div>{signingAgreementId === agreement.id ? <form className={styles.signatureForm} onSubmit={(event) => handleAgreementSignature(event, agreement.id)}><label><span>Legal name</span><input required name="signedByName" defaultValue={user.displayName ?? ""} /></label><label><span>Title</span><input required name="signedByTitle" /></label><label className={styles.checkbox}><input required type="checkbox" name="electronicRecordsAccepted" /><span>Use electronic records and signatures.</span></label><button disabled={busyAction === `agreement-${agreement.id}`} type="submit">{busyAction === `agreement-${agreement.id}` ? "Signing…" : "Sign"}</button></form> : null}</article>)}</div> : <p className={styles.quiet}>No agreements.</p>}</section>
      <section className={styles.accountSection}><div className={styles.sectionHeading}><div><h3>Billing</h3></div></div>{experiences.filter((experience) => experience.billingStatus || experience.invoiceUrl).length ? <div className={styles.billingList}>{experiences.filter((experience) => experience.billingStatus || experience.invoiceUrl).map((experience) => <div key={experience.id}><div><strong>{experience.title}</strong><span>{experience.billingStatus ? titleize(experience.billingStatus) : "Invoice"}</span></div>{experience.invoiceUrl ? <a href={experience.invoiceUrl} target="_blank" rel="noreferrer">View</a> : null}</div>)}</div> : <p className={styles.quiet}>No billing activity.</p>}</section>
    </section> : null}

    {sectionId === "organization-help" ? <section className={styles.help}><h2>How can we help?</h2><div><a href="mailto:help@honoralifesong.com?subject=SongKeep%20account%20help">Account</a><a href="mailto:help@honoralifesong.com?subject=Upcoming%20experience%20help">Experience</a><a href="mailto:help@honoralifesong.com?subject=Completed%20event%20materials">Songs &amp; materials</a></div></section> : null}
  </div>;
}
