"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  formatLifecycleMoney,
  type ExperienceFeedback,
  type IndividualPurchaseRequest,
  type OrganizationExperienceRequest,
  type OrganizationReferral,
  type ParticipantPermissionInvitation,
  type PostExperienceProduct,
  type PostExperienceProductKind
} from "@/domain/customer-lifecycle";
import {
  adminAdvanceExperienceRequest,
  adminUpdateIndividualPurchaseRequest,
  approveParticipantPermissionResponse,
  createPostExperienceProduct,
  listAdminExperienceRequests,
  listAdminFeedback,
  listAdminIndividualPurchaseRequests,
  listAdminPermissionInvitations,
  listAdminReferrals,
  listPostExperienceProducts
} from "@/lib/firebase/customer-lifecycle";
import styles from "./admin-lifecycle-surface.module.css";

export type AdminLifecycleArea = "requests" | "catalog" | "communications" | "consent" | "reports";

type AdminLifecycleSurfaceProps = { area: AdminLifecycleArea };

const areas: Array<{ id: AdminLifecycleArea; label: string }> = [
  { id: "requests", label: "Requests" },
  { id: "catalog", label: "Individual products" },
  { id: "communications", label: "Nurture queue" },
  { id: "consent", label: "Permission responses" },
  { id: "reports", label: "Growth results" }
];

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function AdminLifecycleSurface({ area }: AdminLifecycleSurfaceProps) {
  const [requests, setRequests] = useState<OrganizationExperienceRequest[]>([]);
  const [products, setProducts] = useState<PostExperienceProduct[]>([]);
  const [permissionInvitations, setPermissionInvitations] = useState<ParticipantPermissionInvitation[]>([]);
  const [feedback, setFeedback] = useState<ExperienceFeedback[]>([]);
  const [referrals, setReferrals] = useState<OrganizationReferral[]>([]);
  const [purchases, setPurchases] = useState<IndividualPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [nextRequests, nextProducts, nextInvitations, nextFeedback, nextReferrals, nextPurchases] = await Promise.all([
      listAdminExperienceRequests(),
      listPostExperienceProducts({ includeInactive: true }),
      listAdminPermissionInvitations(),
      listAdminFeedback(),
      listAdminReferrals(),
      listAdminIndividualPurchaseRequests()
    ]);
    setRequests(nextRequests);
    setProducts(nextProducts);
    setPermissionInvitations(nextInvitations);
    setFeedback(nextFeedback);
    setReferrals(nextReferrals);
    setPurchases(nextPurchases);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load lifecycle records."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load]);

  const metrics = useMemo(() => ({
    openRequests: requests.filter((request) => !["converted", "cancelled"].includes(request.status)).length,
    invoiceFollowUps: requests.filter((request) => ["invoice_requested", "invoice_open"].includes(request.financialStatus)).length,
    paidExperiences: requests.filter((request) => request.financialStatus === "paid").length,
    promoters: feedback.filter((item) => item.branch === "promoter").length,
    recovery: feedback.filter((item) => item.branch === "service_recovery" && item.followUpStatus !== "resolved").length,
    referrals: referrals.length,
    individualOrders: purchases.length
  }), [feedback, purchases, referrals.length, requests]);

  async function runRequestAction(request: OrganizationExperienceRequest, action: "invoice_sent" | "payment_confirmed" | "cancel" | "refund", form?: HTMLFormElement) {
    const data = form ? new FormData(form) : undefined;
    setBusy(`${request.id}-${action}`);
    setError(null);
    setNotice(null);
    try {
      const experienceId = await adminAdvanceExperienceRequest({
        organizationId: request.organizationId,
        requestId: request.id,
        action,
        invoiceUrl: data ? String(data.get("invoiceUrl") ?? "") : undefined,
        invoiceDueAt: data ? String(data.get("invoiceDueAt") ?? "") : undefined
      });
      setNotice(action === "payment_confirmed"
        ? `Payment confirmed. ${experienceId ? "The organization experience is ready for onboarding." : "The request was updated."}`
        : action === "invoice_sent"
          ? "Invoice connected to the organization account and payment follow-up queue."
          : `Request ${action === "cancel" ? "cancelled" : "refunded"}.`);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The request could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  async function handleInvoice(event: FormEvent<HTMLFormElement>, request: OrganizationExperienceRequest) {
    event.preventDefault();
    await runRequestAction(request, "invoice_sent", event.currentTarget);
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const price = String(form.get("price") ?? "").trim();
    setBusy("product");
    setError(null);
    setNotice(null);
    try {
      await createPostExperienceProduct({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        kind: String(form.get("kind") ?? "other") as PostExperienceProductKind,
        priceCents: price ? Math.round(Number(price) * 100) : undefined,
        checkoutUrl: String(form.get("checkoutUrl") ?? "") || undefined,
        audiences: form.getAll("audiences").map(String) as Array<"participant" | "designated_family">
      });
      formElement.reset();
      setNotice("Individual product published to eligible post-experience accounts.");
      await load();
    } catch (productError) {
      setError(productError instanceof Error ? productError.message : "The product could not be created.");
    } finally {
      setBusy(null);
    }
  }

  async function handleApprovePermission(invitation: ParticipantPermissionInvitation) {
    setBusy(`permission-${invitation.id}`);
    setError(null);
    setNotice(null);
    try {
      await approveParticipantPermissionResponse({ invitation });
      setNotice(`${invitation.participantName}'s permission response is now an active consent record.`);
      await load();
    } catch (permissionError) {
      setError(permissionError instanceof Error ? permissionError.message : "The response could not be approved.");
    } finally {
      setBusy(null);
    }
  }

  async function handlePurchaseStatus(event: FormEvent<HTMLFormElement>, purchase: IndividualPurchaseRequest) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(`purchase-${purchase.id}`);
    setError(null);
    setNotice(null);
    try {
      await adminUpdateIndividualPurchaseRequest({
        userId: purchase.userId,
        requestId: purchase.id,
        status: String(form.get("status") ?? purchase.status) as IndividualPurchaseRequest["status"]
      });
      setNotice("Individual purchase status updated.");
      await load();
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "The purchase could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <main className={styles.centered}><p role="status">Loading SongKeep operations…</p></main>;

  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link href="/admin">← Operations</Link>
      <div><p>SongKeep</p><strong>Customer lifecycle</strong></div>
    </header>
    <nav className={styles.areaNav} aria-label="Lifecycle operations">{areas.map((item) => <Link key={item.id} aria-current={area === item.id ? "page" : undefined} href={`/admin/${item.id}`}>{item.label}</Link>)}</nav>
    <div className={styles.content}>
      {error ? <div className={styles.alert} role="alert"><strong>Action required</strong><span>{error}</span></div> : null}
      {notice ? <div className={styles.notice} role="status"><strong>Saved</strong><span>{notice}</span></div> : null}

      {area === "requests" ? <>
        <section className={styles.pageHeading}><p className={styles.eyebrow}>Organization commerce</p><h1>Requests become experiences only after valid payment.</h1><p>Package selection, invoice requests, payment reconciliation, and experience creation remain one auditable commercial record.</p></section>
        <section className={styles.records}>{requests.length ? requests.map((request) => <article key={request.id}>
          <div className={styles.recordHeading}><div><span className={styles.status}>{titleize(request.financialStatus)}</span><h2>{request.organizationName}</h2><p>{request.offeringName} · {formatLifecycleMoney(request.amountCents)} · {formatDate(request.preferredStartsAt)}</p></div><Link href={`/admin/people/facilities/${request.organizationId}`}>Organization</Link></div>
          <p className={styles.nextAction}>{request.nextAction}</p>
          {request.financialStatus === "invoice_requested" ? <form className={styles.inlineForm} onSubmit={(event) => handleInvoice(event, request)}><label><span>Invoice link</span><input required type="url" name="invoiceUrl" /></label><label><span>Due date</span><input type="date" name="invoiceDueAt" /></label><button disabled={busy === `${request.id}-invoice_sent`} type="submit">{busy === `${request.id}-invoice_sent` ? "Saving…" : "Connect invoice"}</button></form> : null}
          {request.financialStatus === "invoice_open" && request.invoiceUrl ? <a className={styles.invoiceLink} href={request.invoiceUrl} target="_blank" rel="noreferrer">Open invoice</a> : null}
          {!["paid", "refunded", "cancelled"].includes(request.financialStatus) ? <div className={styles.recordActions}><button disabled={busy === `${request.id}-payment_confirmed`} type="button" onClick={() => runRequestAction(request, "payment_confirmed")}>Confirm payment &amp; create experience</button><details><summary>More</summary><button className={styles.destructive} type="button" onClick={() => runRequestAction(request, "cancel")}>Cancel request</button></details></div> : null}
        </article>) : <p className={styles.empty}>No organization purchase requests yet.</p>}</section>
      </> : null}

      {area === "catalog" ? <>
        <section className={styles.pageHeading}><p className={styles.eyebrow}>Post-experience commerce</p><h1>Publish products created from organization experiences.</h1><p>Eligible participants and designated family members see these products only after claiming private access to the source experience.</p></section>
        <section className={styles.split}>
          <form className={styles.form} onSubmit={handleCreateProduct}>
            <h2>Add individual product</h2>
            <label><span>Name</span><input required name="name" placeholder="Printed lyric keepsake" /></label>
            <label><span>Description</span><textarea required name="description" rows={4} /></label>
            <label><span>Type</span><select name="kind" defaultValue="printed_lyrics"><option value="digital_song">Digital song</option><option value="printed_lyrics">Printed lyrics</option><option value="song_card">Song card</option><option value="event_video">Event video</option><option value="photo_music_package">Photo + music package</option><option value="additional_copy">Additional copy</option><option value="personalized_follow_on">Personalized follow-on</option><option value="other">Other</option></select></label>
            <label><span>Price in dollars <small>Leave blank for invoice/quote</small></span><input min="0" step="0.01" inputMode="decimal" name="price" /></label>
            <label><span>Secure checkout link <small>Optional</small></span><input type="url" name="checkoutUrl" /></label>
            <fieldset><legend>Eligible audience</legend><label className={styles.check}><input type="checkbox" name="audiences" value="participant" defaultChecked /><span>Participant</span></label><label className={styles.check}><input type="checkbox" name="audiences" value="designated_family" defaultChecked /><span>Designated family</span></label></fieldset>
            <button disabled={busy === "product"} type="submit">{busy === "product" ? "Publishing…" : "Publish product"}</button>
          </form>
          <section className={styles.productCatalog}><h2>Current catalog</h2>{products.length ? products.map((product) => <article key={product.id}><div><span>{titleize(product.kind)}</span><strong>{product.name}</strong><p>{product.description}</p></div><b>{formatLifecycleMoney(product.priceCents)}</b></article>) : <p className={styles.empty}>No individual products published.</p>}</section>
        </section>
      </> : null}

      {area === "communications" ? <>
        <section className={styles.pageHeading}><p className={styles.eyebrow}>State-driven nurture</p><h1>Follow the relationship state, not a generic mailing list.</h1><p>Notification delivery is kept separate from the authoritative payment and experience records. This queue shows what should happen next.</p></section>
        <section className={styles.queue}>{requests.filter((request) => !["cancelled"].includes(request.status)).map((request) => <article key={request.id}><span>{titleize(request.nurtureTrack)}</span><div><strong>{request.organizationName}</strong><p>{request.nextAction}</p></div><small>{request.offeringName}</small></article>)}</section>
      </> : null}

      {area === "consent" ? <>
        <section className={styles.pageHeading}><p className={styles.eyebrow}>Individual permissions</p><h1>Review each person’s choices before activating consent.</h1><p>Organization payment and service agreements never create participant permission.</p></section>
        <section className={styles.records}>{permissionInvitations.length ? permissionInvitations.map((invitation) => <article key={invitation.id}>
          <div className={styles.recordHeading}><div><span className={styles.status}>{titleize(invitation.status)}</span><h2>{invitation.participantName}</h2><p>{invitation.organizationName} · {invitation.experienceTitle}</p></div><span>{invitation.recipientEmail}</span></div>
          {invitation.scopes ? <div className={styles.scopeList}>{invitation.scopes.map((scope) => <span key={scope}>{titleize(scope)}</span>)}</div> : <p className={styles.nextAction}>Waiting for the invited person to respond.</p>}
          {invitation.restrictions?.length ? <p className={styles.restrictions}><strong>Restrictions:</strong> {invitation.restrictions.join("; ")}</p> : null}
          {invitation.status === "submitted" ? <button className={styles.primaryButton} disabled={busy === `permission-${invitation.id}`} type="button" onClick={() => handleApprovePermission(invitation)}>{busy === `permission-${invitation.id}` ? "Approving…" : "Approve as active consent"}</button> : null}
        </article>) : <p className={styles.empty}>No participant permission invitations yet.</p>}</section>
      </> : null}

      {area === "reports" ? <>
        <section className={styles.pageHeading}><p className={styles.eyebrow}>Relationship growth</p><h1>Measure revenue and advocacy beyond the first organization purchase.</h1></section>
        <section className={styles.metricGrid}>
          <article><strong>{metrics.openRequests}</strong><span>Open organization requests</span></article>
          <article><strong>{metrics.invoiceFollowUps}</strong><span>Invoice follow-ups</span></article>
          <article><strong>{metrics.paidExperiences}</strong><span>Paid experiences</span></article>
          <article><strong>{metrics.promoters}</strong><span>Promoters</span></article>
          <article><strong>{metrics.recovery}</strong><span>Recovery follow-ups</span></article>
          <article><strong>{metrics.referrals}</strong><span>Introductions</span></article>
          <article><strong>{metrics.individualOrders}</strong><span>Individual purchase requests</span></article>
        </section>
        <section className={styles.records}>
          <h2>Individual commerce</h2>
          {purchases.length ? purchases.map((purchase) => <article key={purchase.id}>
            <div className={styles.recordHeading}><div><span className={styles.status}>{titleize(purchase.status)}</span><h2>{purchase.productName}</h2><p>{purchase.participantName} · {purchase.experienceTitle} · {purchase.organizationName}</p></div><b>{formatLifecycleMoney(purchase.priceCents)}</b></div>
            <form className={styles.statusForm} onSubmit={(event) => handlePurchaseStatus(event, purchase)}><select name="status" defaultValue={purchase.status}><option value="invoice_requested">Invoice requested</option><option value="payment_pending">Payment pending</option><option value="paid">Paid</option><option value="in_fulfillment">In fulfillment</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select><button disabled={busy === `purchase-${purchase.id}`} type="submit">Update</button></form>
          </article>) : <p className={styles.empty}>No individual purchase requests yet.</p>}
        </section>
      </> : null}
    </div>
  </main>;
}
