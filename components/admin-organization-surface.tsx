"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  OrganizationAccount,
  OrganizationAgreement,
  OrganizationAgreementKind,
  OrganizationAsset,
  OrganizationAssetKind,
  OrganizationExperience,
  OrganizationExperienceStatus,
  OrganizationMember,
  OrganizationSuggestedDate
} from "@/domain/organization-account";
import {
  createAdminAgreement,
  createAdminAsset,
  createAdminExperience,
  createAdminSuggestedDate,
  getOrganization,
  listAdminOrganizations,
  listOrganizationAgreements,
  listOrganizationAssets,
  listOrganizationExperiences,
  listOrganizationMembers,
  listOrganizationSuggestedDates
} from "@/lib/firebase/organization-account";
import { buildAdminHref } from "@/lib/admin-navigation";
import styles from "./admin-organization-surface.module.css";

type AdminOrganizationSurfaceProps = {
  organizationId?: string;
};

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AdminOrganizationSurface({ organizationId }: AdminOrganizationSurfaceProps) {
  const [organizations, setOrganizations] = useState<OrganizationAccount[]>([]);
  const [organization, setOrganization] = useState<OrganizationAccount | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [agreements, setAgreements] = useState<OrganizationAgreement[]>([]);
  const [experiences, setExperiences] = useState<OrganizationExperience[]>([]);
  const [suggestedDates, setSuggestedDates] = useState<OrganizationSuggestedDate[]>([]);
  const [assets, setAssets] = useState<OrganizationAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (id: string) => {
    const [nextOrganization, nextMembers, nextAgreements, nextExperiences, nextDates, nextAssets] = await Promise.all([
      getOrganization(id),
      listOrganizationMembers(id),
      listOrganizationAgreements(id),
      listOrganizationExperiences(id),
      listOrganizationSuggestedDates(id),
      listOrganizationAssets(id)
    ]);
    setOrganization(nextOrganization);
    setMembers(nextMembers);
    setAgreements(nextAgreements);
    setExperiences(nextExperiences);
    setSuggestedDates(nextDates);
    setAssets(nextAssets);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (organizationId ? loadDetail(organizationId) : listAdminOrganizations().then((items) => { if (!cancelled) setOrganizations(items); }))
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load organization accounts."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadDetail, organizationId]);

  async function refreshDetail() {
    if (organizationId) await loadDetail(organizationId);
  }

  async function handleCreateExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    const form = new FormData(event.currentTarget);
    setBusy("experience");
    setError(null);
    try {
      await createAdminExperience({
        organizationId,
        title: String(form.get("title") ?? ""),
        experienceType: String(form.get("experienceType") ?? "program"),
        status: String(form.get("status") ?? "proposed") as OrganizationExperienceStatus,
        startsAt: String(form.get("startsAt") ?? "") || undefined,
        venue: String(form.get("venue") ?? "") || undefined
      });
      event.currentTarget.reset();
      await refreshDetail();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to create the experience.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    const form = new FormData(event.currentTarget);
    setBusy("agreement");
    setError(null);
    try {
      await createAdminAgreement({
        organizationId,
        title: String(form.get("title") ?? ""),
        kind: String(form.get("kind") ?? "service_agreement") as OrganizationAgreementKind,
        documentVersion: String(form.get("documentVersion") ?? "1"),
        documentUrl: String(form.get("documentUrl") ?? "") || undefined,
        relatedExperienceId: String(form.get("relatedExperienceId") ?? "") || undefined
      });
      event.currentTarget.reset();
      await refreshDetail();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to create the agreement request.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSuggestDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    const form = new FormData(event.currentTarget);
    setBusy("date");
    setError(null);
    try {
      await createAdminSuggestedDate({
        organizationId,
        startsAt: String(form.get("startsAt") ?? ""),
        label: String(form.get("label") ?? "") || undefined
      });
      event.currentTarget.reset();
      await refreshDetail();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to suggest the date.");
    } finally {
      setBusy(null);
    }
  }

  async function handleAddAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    const form = new FormData(event.currentTarget);
    setBusy("asset");
    setError(null);
    try {
      await createAdminAsset({
        organizationId,
        experienceId: String(form.get("experienceId") ?? ""),
        title: String(form.get("title") ?? ""),
        kind: String(form.get("kind") ?? "other") as OrganizationAssetKind,
        downloadUrl: String(form.get("downloadUrl") ?? "") || undefined,
        storagePath: String(form.get("storagePath") ?? "") || undefined
      });
      event.currentTarget.reset();
      await refreshDetail();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to add the event material.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className={styles.status}>Loading organization accounts…</div>;
  if (error && !organization && organizations.length === 0) return <div className={styles.error} role="alert">{error}</div>;

  if (!organizationId) {
    return <section className={styles.shell} aria-label="Organization accounts">
      <div className={styles.heading}><div><h2>Organization accounts</h2><p>Open an organization to manage its team, agreements, experiences, future dates, billing context, and post-event materials from the same records the organization sees.</p></div></div>
      {organizations.length ? <div className={styles.organizationList}>{organizations.map((item) => <Link href={buildAdminHref({ parentId: "people", childId: "people-facilities", recordId: item.id })} key={item.id}><div><strong>{item.name}</strong><span>{titleize(item.kind)}</span></div><span>Open →</span></Link>)}</div> : <p className={styles.quiet}>No organization accounts have been created yet.</p>}
    </section>;
  }

  if (!organization) return <div className={styles.error}>This organization could not be found.</div>;

  return <section className={styles.shell} aria-label={`${organization.name} administration`}>
    <Link className={styles.back} href={buildAdminHref({ parentId: "people", childId: "people-facilities" })}>← All organizations</Link>
    <div className={styles.heading}><div><p className={styles.kicker}>Organization account</p><h2>{organization.name}</h2><p>{titleize(organization.kind)}</p></div><Link className={styles.customerView} href={`/organization?org=${organization.id}`}>Open customer view</Link></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h3>Team</h3><p>These are the people currently authorized within this organization account.</p></div></div>
      <div className={styles.rows}>{members.length ? members.map((member) => <div className={styles.row} key={member.userId}><div><strong>{member.displayName}</strong><span>{member.email}</span></div><span>{titleize(member.role)}</span></div>) : <p className={styles.quiet}>No organization members found.</p>}</div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h3>Experiences</h3><p>Upcoming and completed events remain attached to this organization over time.</p></div></div>
      <div className={styles.rows}>{experiences.map((experience) => <div className={styles.row} key={experience.id}><div><strong>{experience.title}</strong><span>{formatDate(experience.startsAt)}{experience.venue ? ` · ${experience.venue}` : ""}</span></div><span>{titleize(experience.status)}</span></div>)}</div>
      <details className={styles.actionPanel}><summary>Add experience</summary><form onSubmit={handleCreateExperience}>
        <label><span>Name</span><input required name="title" placeholder="Fall Community Celebration" /></label>
        <label><span>Type</span><input required name="experienceType" defaultValue="Honor a Life Song" /></label>
        <label><span>Status</span><select name="status" defaultValue="proposed"><option value="inquiry">Inquiry</option><option value="proposed">Proposed</option><option value="contracted">Contracted</option><option value="preparing">Preparing</option><option value="active">Active</option><option value="assets_processing">Assets processing</option><option value="post_event">Post-event</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option></select></label>
        <label><span>Date/time</span><input type="datetime-local" name="startsAt" /></label>
        <label><span>Venue</span><input name="venue" /></label>
        <button disabled={busy === "experience"} type="submit">{busy === "experience" ? "Saving…" : "Add experience"}</button>
      </form></details>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h3>Agreements</h3><p>Request organization-level agreements here. Participant consent remains a separate Consent & Compliance record.</p></div></div>
      <div className={styles.rows}>{agreements.map((agreement) => <div className={styles.row} key={agreement.id}><div><strong>{agreement.title}</strong><span>Version {agreement.documentVersion}{agreement.signedAt ? ` · Signed ${formatDate(agreement.signedAt)}` : ""}</span></div><span>{titleize(agreement.status)}</span></div>)}</div>
      <details className={styles.actionPanel}><summary>Request agreement</summary><form onSubmit={handleCreateAgreement}>
        <label><span>Agreement title</span><input required name="title" placeholder="Honor a Life Song Service Agreement" /></label>
        <label><span>Type</span><select name="kind" defaultValue="service_agreement"><option value="terms">Terms</option><option value="privacy">Privacy</option><option value="service_agreement">Service agreement</option><option value="event_scope">Event scope</option><option value="payment_cancellation">Payment & cancellation</option><option value="media">Organization media agreement</option><option value="other">Other</option></select></label>
        <label><span>Version</span><input required name="documentVersion" defaultValue="1" /></label>
        <label><span>Document URL</span><input type="url" name="documentUrl" placeholder="https://…" /></label>
        <label><span>Related experience</span><select name="relatedExperienceId" defaultValue=""><option value="">Organization-wide</option>{experiences.map((experience) => <option key={experience.id} value={experience.id}>{experience.title}</option>)}</select></label>
        <button disabled={busy === "agreement"} type="submit">{busy === "agreement" ? "Saving…" : "Request agreement"}</button>
      </form></details>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h3>Suggested future dates</h3><p>Suggest dates the organization can express interest in. A response does not become a confirmed booking automatically.</p></div></div>
      <div className={styles.rows}>{suggestedDates.map((suggestion) => <div className={styles.row} key={suggestion.id}><div><strong>{formatDate(suggestion.startsAt)}</strong><span>{suggestion.label ?? "Future experience"}</span></div><span>{titleize(suggestion.status)}</span></div>)}</div>
      <details className={styles.actionPanel}><summary>Suggest date</summary><form onSubmit={handleSuggestDate}>
        <label><span>Date/time</span><input required type="datetime-local" name="startsAt" /></label>
        <label><span>Note</span><input name="label" placeholder="Holiday experience" /></label>
        <button disabled={busy === "date"} type="submit">{busy === "date" ? "Saving…" : "Suggest date"}</button>
      </form></details>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h3>Post-event materials</h3><p>Release songs, lyrics, event video, approved photos, reports, and keepsakes into the organization's permanent archive.</p></div></div>
      <div className={styles.rows}>{assets.map((asset) => <div className={styles.row} key={asset.id}><div><strong>{asset.title}</strong><span>{titleize(asset.kind)}</span></div><span>{titleize(asset.status)}</span></div>)}</div>
      <details className={styles.actionPanel}><summary>Add event material</summary><form onSubmit={handleAddAsset}>
        <label><span>Experience</span><select required name="experienceId" defaultValue=""><option disabled value="">Choose experience</option>{experiences.map((experience) => <option key={experience.id} value={experience.id}>{experience.title}</option>)}</select></label>
        <label><span>Title</span><input required name="title" /></label>
        <label><span>Type</span><select name="kind" defaultValue="song"><option value="song">Song</option><option value="lyrics">Lyrics</option><option value="event_video">Event video</option><option value="photo">Photo</option><option value="report">Report</option><option value="keepsake">Keepsake</option><option value="other">Other</option></select></label>
        <label><span>Secure/download URL</span><input type="url" name="downloadUrl" /></label>
        <label><span>Storage path</span><input name="storagePath" placeholder="organizations/…" /></label>
        <button disabled={busy === "asset"} type="submit">{busy === "asset" ? "Saving…" : "Add material"}</button>
      </form></details>
    </section>
  </section>;
}
