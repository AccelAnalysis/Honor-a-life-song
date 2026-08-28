"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import type {
  OrganizationAccount,
  OrganizationAgreement,
  OrganizationAsset,
  OrganizationExperience,
  OrganizationMember,
  OrganizationMemberRole,
  OrganizationSuggestedDate
} from "@/domain/organization-account";
import {
  createOrganizationInvitation,
  expressInterestInSuggestedDate,
  listOrganizationAgreements,
  listOrganizationAssets,
  listOrganizationExperiences,
  listOrganizationMembers,
  listOrganizationSuggestedDates,
  listUserOrganizations,
  signOrganizationAgreement
} from "@/lib/firebase/organization-account";
import styles from "./organization-workspace.module.css";

type OrganizationWorkspaceProps = {
  sectionId: string;
};

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

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <div className={styles.emptyState}><strong>{title}</strong><p>{body}</p>{action}</div>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [signingAgreementId, setSigningAgreementId] = useState<string | null>(null);

  const requestedOrganizationId = searchParams.get("org");
  const selectedExperienceId = searchParams.get("experience");
  const selectedOrganization = organizations.find((organization) => organization.id === requestedOrganizationId) ?? organizations[0] ?? null;
  const selectedExperience = experiences.find((experience) => experience.id === selectedExperienceId) ?? null;
  const currentMember = members.find((member) => member.userId === user?.uid);
  const canManageAccount = currentMember?.role === "organization_admin";

  const loadOrganizationData = useCallback(async (organizationId: string) => {
    const [nextExperiences, nextAgreements, nextMembers, nextDates, nextAssets] = await Promise.all([
      listOrganizationExperiences(organizationId),
      listOrganizationAgreements(organizationId),
      listOrganizationMembers(organizationId),
      listOrganizationSuggestedDates(organizationId),
      listOrganizationAssets(organizationId)
    ]);
    setExperiences(nextExperiences);
    setAgreements(nextAgreements);
    setMembers(nextMembers);
    setSuggestedDates(nextDates);
    setAssets(nextAssets);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listUserOrganizations(user.uid)
      .then(async (nextOrganizations) => {
        if (cancelled) return;
        setOrganizations(nextOrganizations);
        const organization = nextOrganizations.find((item) => item.id === requestedOrganizationId) ?? nextOrganizations[0];
        if (organization) await loadOrganizationData(organization.id);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this organization account.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadOrganizationData, requestedOrganizationId, status, user]);

  const upcoming = useMemo(() => experiences.filter((experience) => !isPastExperience(experience)), [experiences]);
  const past = useMemo(() => experiences.filter(isPastExperience).reverse(), [experiences]);
  const nextExperience = [...upcoming].sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999"))[0];
  const pendingAgreements = agreements.filter((agreement) => agreement.status === "requested");
  const readyAssets = assets.filter((asset) => asset.status === "ready");

  async function refresh() {
    if (!selectedOrganization) return;
    await loadOrganizationData(selectedOrganization.id);
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrganization || !user) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const role = String(form.get("role") ?? "viewer") as OrganizationMemberRole;
    setBusyAction("invite");
    setError(null);
    try {
      const invitation = await createOrganizationInvitation({ organizationId: selectedOrganization.id, email, role, invitedBy: user.uid });
      const base = typeof window === "undefined" ? "" : window.location.origin;
      setInviteLink(`${base}/accept-invitation?org=${selectedOrganization.id}&id=${invitation.id}`);
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
      await refresh();
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
      await refresh();
    } catch (dateError) {
      setError(dateError instanceof Error ? dateError.message : "We could not save your interest in this date.");
    } finally {
      setBusyAction(null);
    }
  }

  if (status === "loading" || loading) return <div className={styles.status}>Opening your organization account…</div>;
  if (status === "unavailable") return <EmptyState title="Account connection is not configured here." body={configurationError ?? "Add the Firebase web configuration to the local environment before using account features."} />;
  if (status === "signed_out" || !user) return <EmptyState title="Sign in to continue." body="Organization experiences, agreements, and event materials are private to authorized team members." action={<Link className={styles.primaryAction} href="/login">Sign in</Link>} />;
  if (error && organizations.length === 0) return <EmptyState title="We could not open this account." body={error} />;
  if (!selectedOrganization) return <EmptyState title="No organization is connected to this account yet." body="Create an organization account or accept an invitation to join an existing organization." action={<Link className={styles.primaryAction} href="/create-account">Create an organization account</Link>} />;

  const orgQuery = `?org=${selectedOrganization.id}`;

  return <div className={styles.workspace}>
    {organizations.length > 1 ? <div className={styles.orgSwitcher}>
      <span>Organization</span>
      <div>{organizations.map((organization) => <Link className={organization.id === selectedOrganization.id ? styles.activeOrg : ""} href={`/organization${sectionId === "organization-home" ? "" : `/${sectionId.replace("organization-", "")}` }?org=${organization.id}`} key={organization.id}>{organization.name}</Link>)}</div>
    </div> : null}
    {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

    {sectionId === "organization-home" ? <section className={styles.home}>
      <div className={styles.welcome}><p>Welcome back</p><h2>{selectedOrganization.name}</h2></div>

      {nextExperience ? <article className={styles.nextExperience}>
        <div>
          <p className={styles.kicker}>Your next experience</p>
          <h3>{nextExperience.title}</h3>
          <p>{formatDate(nextExperience.startsAt)}{nextExperience.venue ? ` · ${nextExperience.venue}` : ""}</p>
        </div>
        <div className={styles.nextMeta}>
          <span>{titleize(nextExperience.status)}</span>
          {nextExperience.nextAction ? <p><strong>Next:</strong> {nextExperience.nextAction}</p> : null}
          <Link className={styles.primaryAction} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${nextExperience.id}`}>Open experience</Link>
        </div>
      </article> : <EmptyState title="No upcoming experience is scheduled." body="Plan your next Honor a Life Song experience when your organization is ready." action={<Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan an experience</Link>} />}

      <div className={styles.homeColumns}>
        <section>
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>Needs attention</p><h3>Agreements</h3></div><Link href={`/organization/account${orgQuery}`}>View account</Link></div>
          {pendingAgreements.length ? pendingAgreements.slice(0, 3).map((agreement) => <div className={styles.lineItem} key={agreement.id}><span>{agreement.title}</span><strong>Signature needed</strong></div>) : <p className={styles.quiet}>Nothing needs a signature right now.</p>}
        </section>
        <section>
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>From your experiences</p><h3>Songs & memories</h3></div><Link href={`/organization/library${orgQuery}`}>Open library</Link></div>
          {readyAssets.length ? readyAssets.slice(0, 4).map((asset) => <div className={styles.lineItem} key={asset.id}><span>{asset.title}</span><strong>{titleize(asset.kind)}</strong></div>) : <p className={styles.quiet}>Completed songs, lyrics, videos, photos, and reports will appear here.</p>}
        </section>
      </div>

      <section className={styles.planAhead}>
        <div><p className={styles.kicker}>Plan ahead</p><h3>Suggested dates</h3><p>Dates suggested by the Honor a Life Song team are invitations to discuss availability, not automatic reservations.</p></div>
        <div className={styles.dateList}>{suggestedDates.length ? suggestedDates.slice(0, 4).map((suggestion) => <button disabled={busyAction === `date-${suggestion.id}` || suggestion.status === "interested"} onClick={() => handleSuggestedDate(suggestion.id)} type="button" key={suggestion.id}><strong>{formatDate(suggestion.startsAt)}</strong><span>{suggestion.status === "interested" ? "Interest sent" : suggestion.label ?? "I'm interested"}</span></button>) : <span className={styles.quiet}>No future dates have been suggested yet.</span>}</div>
      </section>
    </section> : null}

    {sectionId === "organization-experiences" ? <section>
      {selectedExperience ? <div className={styles.experienceDetail}>
        <Link className={styles.backLink} href={`/organization/experiences${orgQuery}`}>← All experiences</Link>
        <p className={styles.kicker}>{titleize(selectedExperience.status)}</p>
        <h2>{selectedExperience.title}</h2>
        <p className={styles.detailDate}>{formatDate(selectedExperience.startsAt)}{selectedExperience.venue ? ` · ${selectedExperience.venue}` : ""}</p>
        <div className={styles.detailRows}>
          {selectedExperience.nextAction ? <div><span>Your next step</span><strong>{selectedExperience.nextAction}</strong></div> : null}
          {selectedExperience.participantExpectedCount !== undefined ? <div><span>Participants ready</span><strong>{selectedExperience.participantReadyCount ?? 0} of {selectedExperience.participantExpectedCount}</strong></div> : null}
          {selectedExperience.billingStatus ? <div><span>Billing</span><strong>{titleize(selectedExperience.billingStatus)}</strong></div> : null}
        </div>
        {selectedExperience.invoiceUrl ? <a className={styles.secondaryAction} href={selectedExperience.invoiceUrl} target="_blank" rel="noreferrer">View invoice</a> : null}
        {isPastExperience(selectedExperience) ? <div className={styles.postEvent}>
          <h3>Continue from this experience</h3>
          <p>Return to available songs and media, or begin another song using this experience as the relationship context.</p>
          <div><Link href={`/organization/library?org=${selectedOrganization.id}`}>Songs & event materials</Link><Link href={`/begin?organizationId=${selectedOrganization.id}&sourceExperience=${selectedExperience.id}`}>Purchase a song</Link><Link href={`/begin?organizationId=${selectedOrganization.id}`}>Plan another experience</Link></div>
        </div> : null}
      </div> : <>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>Experiences</p><h2>Upcoming</h2></div><Link className={styles.primaryAction} href={`/begin?organizationId=${selectedOrganization.id}`}>Plan an experience</Link></div>
        <div className={styles.experienceList}>{upcoming.length ? upcoming.map((experience) => <Link className={styles.experienceRow} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${experience.id}`} key={experience.id}><div><strong>{experience.title}</strong><span>{formatDate(experience.startsAt)}</span></div><span>{titleize(experience.status)} →</span></Link>) : <p className={styles.quiet}>No upcoming experiences are scheduled.</p>}</div>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>Your history</p><h2>Past experiences</h2></div></div>
        <div className={styles.experienceList}>{past.length ? past.map((experience) => <Link className={styles.experienceRow} href={`/organization/experiences?org=${selectedOrganization.id}&experience=${experience.id}`} key={experience.id}><div><strong>{experience.title}</strong><span>{formatDate(experience.startsAt)}</span></div><span>Revisit →</span></Link>) : <p className={styles.quiet}>Completed experiences will remain here as part of your organization's history.</p>}</div>
      </>}
    </section> : null}

    {sectionId === "organization-library" ? <section>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>Your archive</p><h2>Songs & memories</h2><p>Only materials released to this organization appear here. Participant permissions continue to control what can be viewed or shared.</p></div></div>
      {assets.length ? <div className={styles.assetList}>{assets.map((asset) => <article key={asset.id}>
        <div><span className={styles.assetKind}>{titleize(asset.kind)}</span><h3>{asset.title}</h3><p>{asset.status === "ready" ? "Ready" : titleize(asset.status)}</p></div>
        {asset.status === "ready" && asset.downloadUrl ? <a href={asset.downloadUrl} target="_blank" rel="noreferrer">Open</a> : <span>{asset.status === "processing" ? "Being prepared" : "Restricted"}</span>}
      </article>)}</div> : <EmptyState title="Your archive is ready for the first delivery." body="Songs, lyrics, event videos, photos, reports, and keepsakes released to your organization will stay connected to the experience that created them." />}
      <div className={styles.postEventActions}><h3>More from an experience</h3><div><Link href={`/begin?organizationId=${selectedOrganization.id}&service=individual-song`}>Purchase an individual song</Link><Link href={`/begin?organizationId=${selectedOrganization.id}`}>Plan another experience</Link></div></div>
    </section> : null}

    {sectionId === "organization-account" ? <section>
      <div className={styles.accountHeader}><div><p className={styles.kicker}>Organization account</p><h2>{selectedOrganization.name}</h2><p>{titleize(selectedOrganization.kind)}</p></div></div>

      <section className={styles.accountSection}>
        <div className={styles.sectionHeading}><div><h3>Team</h3><p>Each person signs in with their own account. Removing a person does not remove your organization's event history.</p></div></div>
        <div className={styles.memberList}>{members.map((member) => <div className={styles.memberRow} key={member.userId}><div><strong>{member.displayName}</strong><span>{member.email}</span></div><span>{titleize(member.role)}</span></div>)}</div>
        {canManageAccount ? <form className={styles.inviteForm} onSubmit={handleInvite}>
          <label><span>Invite by email</span><input required type="email" name="email" placeholder="colleague@example.com" /></label>
          <label><span>They can</span><select name="role" defaultValue="program_coordinator"><option value="organization_admin">Manage our account</option><option value="program_coordinator">Manage programs and events</option><option value="billing_contact">Handle billing</option><option value="event_contact">Help with events</option><option value="viewer">View only</option></select></label>
          <button disabled={busyAction === "invite"} type="submit">{busyAction === "invite" ? "Creating invitation…" : "Create invitation"}</button>
        </form> : null}
        {inviteLink ? <div className={styles.inviteResult}><strong>Invitation created</strong><p>The invitation record is active. Until transactional email is connected, copy this secure join link to the intended recipient:</p><code>{inviteLink}</code></div> : null}
      </section>

      <section className={styles.accountSection}>
        <div className={styles.sectionHeading}><div><h3>Agreements</h3><p>Organization agreements are separate from participant consent and media permissions.</p></div></div>
        {agreements.length ? <div className={styles.agreementList}>{agreements.map((agreement) => <article key={agreement.id}>
          <div><strong>{agreement.title}</strong><span>Version {agreement.documentVersion} · {titleize(agreement.status)}</span>{agreement.signedAt ? <small>Signed {formatDate(agreement.signedAt)} by {agreement.signedByName}</small> : null}</div>
          <div className={styles.agreementActions}>{agreement.documentUrl ? <a href={agreement.documentUrl} target="_blank" rel="noreferrer">View / print</a> : null}{agreement.status === "requested" && canManageAccount ? <button type="button" onClick={() => setSigningAgreementId(signingAgreementId === agreement.id ? null : agreement.id)}>Sign online</button> : null}</div>
          {signingAgreementId === agreement.id ? <form className={styles.signatureForm} onSubmit={(event) => handleAgreementSignature(event, agreement.id)}>
            <label><span>Your legal name</span><input required name="signedByName" defaultValue={user.displayName ?? ""} /></label>
            <label><span>Title / authority</span><input required name="signedByTitle" placeholder="Executive Director" /></label>
            <label className={styles.checkbox}><input required type="checkbox" name="electronicRecordsAccepted" /><span>I agree to use electronic records and signatures for this agreement.</span></label>
            <button disabled={busyAction === `agreement-${agreement.id}`} type="submit">{busyAction === `agreement-${agreement.id}` ? "Signing…" : "Sign agreement"}</button>
          </form> : null}
        </article>)}</div> : <p className={styles.quiet}>No organization agreements have been requested yet.</p>}
      </section>

      <section className={styles.accountSection}>
        <div className={styles.sectionHeading}><div><h3>Billing</h3><p>Invoices and payment status stay attached to the experience they belong to.</p></div></div>
        {experiences.filter((experience) => experience.billingStatus || experience.invoiceUrl).length ? <div className={styles.billingList}>{experiences.filter((experience) => experience.billingStatus || experience.invoiceUrl).map((experience) => <div key={experience.id}><div><strong>{experience.title}</strong><span>{experience.billingStatus ? titleize(experience.billingStatus) : "Invoice available"}</span></div>{experience.invoiceUrl ? <a href={experience.invoiceUrl} target="_blank" rel="noreferrer">View invoice</a> : null}</div>)}</div> : <p className={styles.quiet}>Billing information will appear here when an experience has an invoice or payment record.</p>}
      </section>
    </section> : null}

    {sectionId === "organization-help" ? <section className={styles.help}>
      <p className={styles.kicker}>Help</p><h2>What do you need help with?</h2>
      <div><a href="mailto:help@honoralifesong.com?subject=Organization%20account%20help">Account or agreement</a><a href="mailto:help@honoralifesong.com?subject=Upcoming%20experience%20help">Upcoming experience</a><a href="mailto:help@honoralifesong.com?subject=Completed%20event%20materials">Songs or event materials</a></div>
    </section> : null}
  </div>;
}
