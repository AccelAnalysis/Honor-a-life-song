"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import { displayInvoiceStatus, invoiceLabels, invoiceMoney, type BillingProfile, type InvoiceSettings, type NativeInvoice } from "@/domain/invoice";
import type { OrganizationAccount } from "@/domain/organization-account";
import { listUserOrganizations } from "@/lib/firebase/organization-account";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { invoicePdf, listNativeInvoices, nativeAction, nativeCheckoutEnabled, normalizeRecord, openInvoiceCheckout } from "@/lib/firebase/native-services";
import styles from "./invoice-surface.module.css";

type InvoiceActivity = { id: string; kind: string; status: string; recipient: string; amountCents?: number; reference?: string; createdAt: string };
const date = (value?: string) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value)) : "—";
const blankBilling: BillingProfile = { name: "", contactName: "", email: "", address: "", purchaseOrder: "" };
const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const valueDollars = (data: FormData, name: string) => Math.round(Number(field(data, name)) * 100);

export function InvoiceSurface({ admin = false }: { admin?: boolean }) {
  const { user, status: authStatus } = useAuth();
  const query = useSearchParams();
  const [organizations, setOrganizations] = useState<OrganizationAccount[]>([]);
  const [organizationId, setOrganizationId] = useState(query.get("organization") ?? "");
  const [invoices, setInvoices] = useState<NativeInvoice[]>([]);
  const [selectedId, setSelectedId] = useState(query.get("invoice") ?? "");
  const [invoice, setInvoice] = useState<NativeInvoice | null>(null);
  const [profile, setProfile] = useState<BillingProfile>(blankBilling);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [activity, setActivity] = useState<InvoiceActivity[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    let orgId = organizationId;
    if (!admin) {
      const accounts = await listUserOrganizations(user.uid);
      setOrganizations(accounts);
      if (!orgId) { orgId = accounts[0]?.id ?? ""; setOrganizationId(orgId); }
      if (!orgId) { setInvoices([]); return; }
    }
    const items = await listNativeInvoices(admin ? undefined : orgId);
    setInvoices(items);
    if (!selectedId && items.length) { setSelectedId(items[0].id); setOrganizationId(items[0].organizationId); }
    if (orgId) {
      const [organization, member] = await Promise.all([getDoc(doc(getFirebaseFirestore(), "organizations", orgId)), getDoc(doc(getFirebaseFirestore(), "organizations", orgId, "members", user.uid))]);
      const stored = organization.data();
      setProfile({ ...blankBilling, name: stored?.name ?? "", email: stored?.billingEmail ?? user.email ?? "", contactName: member.data()?.displayName ?? user.displayName ?? "", address: stored?.address ?? "", ...stored?.billingProfile });
    }
    if (admin) setSettings(await nativeAction<InvoiceSettings | null>("getSettings"));
  }, [admin, organizationId, selectedId, user]);

  useEffect(() => {
    if (authStatus !== "signed_in" || !user) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    load().catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Unable to open billing."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authStatus, user, load]);

  useEffect(() => {
    if (!user || !organizationId || !selectedId) { setInvoice(null); return; }
    const invoiceRef = doc(getFirebaseFirestore(), "organizations", organizationId, "invoices", selectedId);
    return onSnapshot(invoiceRef, snapshot => {
      if (!snapshot.exists()) { setInvoice(null); return; }
      const current = { ...normalizeRecord(snapshot.data()) as NativeInvoice, id: snapshot.id };
      setInvoice(current);
      if (current.commercial && !current.viewedAt && !admin) nativeAction("viewed", { organizationId, invoiceId: selectedId }).catch(() => undefined);

    }, reason => setError(reason.message));
  }, [admin, organizationId, selectedId, user]);

  useEffect(() => {
    setActivity([]);
    if (!user || !organizationId || !selectedId) return;
    return onSnapshot(collection(getFirebaseFirestore(), "organizations", organizationId, "invoices", selectedId, "invoiceMessages"), messages => {
      setActivity(messages.docs.map(item => ({ ...normalizeRecord(item.data()) as InvoiceActivity, id: item.id })).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
    }, reason => setError(reason.message));
  }, [organizationId, selectedId, user]);

  async function run(work: () => Promise<unknown>, success?: string) {
    setBusy(true); setError(""); setNotice("");
    try { await work(); if (success) setNotice(success); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The action could not be completed."); }
    finally { setBusy(false); }
  }
  function choose(item: NativeInvoice) { setOrganizationId(item.organizationId); setSelectedId(item.id); setError(""); setNotice(""); }
  const context = { organizationId, invoiceId: selectedId };
  async function handleBilling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await run(async () => {
      await nativeAction("saveBilling", { organizationId, ...Object.fromEntries(Object.keys(blankBilling).map(key => [key, field(data, key)])) });
      if (!invoice && selectedId) await nativeAction("prepare", { ...context, requestId: selectedId });
    }, "Billing details saved. Issued invoices retain their original details.");
  }
  async function handleSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await run(() => nativeAction("configure", {
      ...Object.fromEntries(["legalName", "dba", "address", "email", "phone", "paymentInstructions", "terms", "taxNote", "appUrl"].map(key => [key, field(data, key)])),
      dueDays: Number(field(data, "dueDays")), taxBasisPoints: Math.round(Number(field(data, "taxRate")) * 100), taxReviewed: data.has("taxReviewed"), autoIssue: data.has("autoIssue")
    }), "Invoice settings saved. These apply to newly issued invoices only.");
  }
  async function handleIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await run(() => nativeAction("issue", { ...context, discountCents: admin ? valueDollars(data, "discount") : 0 }), "Your invoice is ready. Email delivery is tracked below.");
  }
  async function handleDownload(print = false) {
    const tab = print ? window.open("", "_blank") : null;
    await run(async () => {
      try {
        const file = await invoicePdf(organizationId, selectedId);
        if (print && tab) { tab.location.href = file.url; tab.onload = () => { try { tab.print(); } catch { /* Browser PDF viewer retains its Print action. */ } }; }
        else { const link = document.createElement("a"); link.href = file.url; link.download = file.fileName; link.click(); }
        window.setTimeout(() => URL.revokeObjectURL(file.url), 120000);
      } catch (reason) { tab?.close(); throw reason; }
    }, print ? "The original invoice PDF is open. Use its Print control to print a copy." : undefined);
  }
  async function handlePayment(event: FormEvent<HTMLFormElement>, refund = false) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await run(() => nativeAction(refund ? "recordRefund" : "recordPayment", { ...context, amountCents: valueDollars(data, "amount"), method: field(data, "method"), reference: field(data, "reference"), reason: field(data, "reason"), confirmed: data.has("confirmed") }), refund ? "Confirmed refund recorded. Payment reminders are paused." : "Confirmed payment recorded. A fully paid experience is now ready for preparation.");
  }
  const currentStatus = invoice ? displayInvoiceStatus(invoice) : "draft";
  const payable = invoice?.commercial && !["paid", "void", "refunded", "uncollectible"].includes(currentStatus);

  if (authStatus === "loading" || loading) return <main className={styles.shell}><p role="status">Opening your invoices…</p></main>;
  if (authStatus !== "signed_in" || !user) return <main className={styles.shell}><SongKeepLockup variant="app" /><h1>Your invoices, in one place.</h1><p>Sign in to your organization account to view and pay an invoice.</p><Link className={styles.primary} href={`/login?next=${encodeURIComponent(`/organization/invoices?${query.toString()}`)}`}>Sign in</Link></main>;

  return <main className={styles.shell}>
    <header className={styles.header}><Link href={admin ? "/admin/requests" : "/organization"}>← {admin ? "Operations" : "Your organization"}</Link><SongKeepLockup variant="app" /></header>
    <div className={styles.heading}><div><p className={styles.eyebrow}>SongKeep</p><h1>{admin ? "Invoices & payments" : "Your invoices"}</h1><p>Every invoice stays connected to your experience.</p></div><button className={styles.secondary} disabled={busy} onClick={() => run(load)}>Refresh</button></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    {query.get("payment") === "returned" ? <p className={styles.notice} role="status">Your payment is being checked. This page updates when confirmation arrives; returning from checkout does not itself confirm payment.</p> : null}
    {!admin && organizations.length > 1 ? <label className={styles.selector}>Organization<select value={organizationId} onChange={event => { setSelectedId(""); setOrganizationId(event.target.value); }}>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label> : null}
    <div className={styles.layout}>
      <nav className={styles.list} aria-label="Invoices">
        {invoices.map(item => <button key={`${item.organizationId}-${item.id}`} aria-current={selectedId === item.id && organizationId === item.organizationId ? "page" : undefined} onClick={() => choose(item)}><strong>{item.invoiceNumber ?? "Invoice being prepared"}</strong><span>{item.commercial?.buyer.name ?? item.offeringId.replaceAll("-", " ")}</span><span>{invoiceLabels[displayInvoiceStatus(item)]} · {invoiceMoney(item.amountDueCents)}</span></button>)}
        {!invoices.length ? <p>No invoices yet. Your invoice appears here after you request an experience.</p> : null}
      </nav>
      <section className={styles.detail} aria-label="Invoice details" aria-busy={busy}>
        {selectedId && !invoice ? <><h2>Prepare this invoice</h2><p>Your earlier request can be connected to native SongKeep billing. An existing external invoice must first be reconciled.</p><button disabled={busy} className={styles.primary} onClick={() => run(() => nativeAction("prepare", { ...context, requestId: selectedId }), "Invoice prepared. Review your billing details before issuance.")}>Prepare invoice</button></> : null}
        {invoice ? <>
          <div className={styles.title}><div><p className={styles.status}>{invoiceLabels[currentStatus]}</p><h2>{invoice.invoiceNumber ?? "Your invoice is being prepared"}</h2></div><strong>{invoiceMoney(invoice.amountDueCents)}<small>Balance due</small></strong></div>
          {invoice.commercial ? <>
            <dl className={styles.facts}><div><dt>Billed to</dt><dd>{invoice.commercial.buyer.name}<br />{invoice.commercial.buyer.contactName}</dd></div><div><dt>Issued</dt><dd>{date(invoice.commercial.issuedAt)}</dd></div><div><dt>Due</dt><dd>{date(invoice.commercial.dueAt)}</dd></div></dl>
            {invoice.commercial.lineItems.map((line, index) => <div className={styles.line} key={index}><p>{line.quantity} × {line.description}</p><strong>{invoiceMoney(line.amountCents)}</strong></div>)}
            <dl className={styles.totals}>{[["Subtotal", invoice.commercial.subtotalCents], ["Discount / credit", -invoice.commercial.discountCents], ["Tax", invoice.commercial.taxCents], ["Invoice total", invoice.commercial.totalCents], ["Payments received", invoice.amountPaidCents], ["Refunds recorded", invoice.amountRefundedCents]].map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{invoiceMoney(Number(amount))}</dd></div>)}</dl>
            <div className={styles.actions}>
              {payable && nativeCheckoutEnabled ? <button className={styles.primary} disabled={busy} onClick={() => run(async () => { const result = await openInvoiceCheckout(organizationId, selectedId); if (result.url) window.location.assign(result.url); else if (result.paid) setNotice("Your payment is confirmed."); })}>{invoice.checkout ? "Resume / check payment" : "Pay invoice"}</button> : null}
              {invoice.checkout && nativeCheckoutEnabled ? <button disabled={busy} onClick={() => run(() => openInvoiceCheckout(organizationId, selectedId, true), "Online checkout checked. A cancelled checkout does not cancel the invoice.")}>Cancel online checkout</button> : null}
              <button disabled={busy} onClick={() => handleDownload(false)}>Download PDF</button><button disabled={busy} onClick={() => handleDownload(true)}>Print</button>
              <a href={`mailto:${invoice.commercial.seller.email}?subject=${encodeURIComponent(`Question about ${invoice.invoiceNumber}`)}`}>Ask a question</a>
            </div>
            {invoice.experienceId ? <Link className={styles.primary} href={`/organization?org=${organizationId}&experience=${invoice.experienceId}`}>Open your experience</Link> : null}
            <details open={Boolean(payable && !nativeCheckoutEnabled)}><summary>Payment instructions</summary><p className={styles.preserve}>{invoice.commercial.paymentInstructions}</p><p>{invoice.commercial.paymentTerms}</p></details>
            <details><summary>Send a copy to a billing contact</summary><form className={styles.form} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(() => nativeAction("send", { ...context, email: field(data, "email"), idempotencyKey: crypto.randomUUID() }), "Copy requested. See delivery status below."); }}><label>Email<input required type="email" name="email" defaultValue={invoice.commercial.buyer.email} /></label><p>Additional billing contacts need an invitation to your organization account to open the invoice.</p><button disabled={busy} type="submit">Send copy</button></form></details>
            <details><summary>Scope, terms & original details</summary><p>{invoice.commercial.buyer.address}</p><p>{invoice.commercial.buyer.purchaseOrder ? `Purchase order: ${invoice.commercial.buyer.purchaseOrder}` : ""}</p><p>Preferred service date: {date(invoice.commercial.serviceDate)}. Subject to confirmation.</p><p className={styles.preserve}>{invoice.commercial.terms}</p><p>{invoice.commercial.taxNote}</p><p>The issued PDF is preserved unchanged. Payments and refunds are recorded separately.</p></details>
          </> : <p>{invoice.preparationNotice ?? "Confirm the billing details below. SongKeep will issue your invoice after reviewing its commercial details."}</p>}
          {invoice.status === "draft" ? <form className={styles.form} onSubmit={handleIssue}>{admin ? <label>Approved discount, in dollars<input type="number" min="0" step="0.01" name="discount" defaultValue="0" /></label> : null}<p>Issuing an invoice freezes its scope, price, tax treatment, and billing details. It does not confirm payment or reserve a date.</p><button className={styles.primary} disabled={busy} type="submit">{admin ? "Issue invoice & generate PDF" : "Prepare my invoice"}</button></form> : null}
          {admin && invoice.commercial ? <>
            <details><summary>Record a confirmed payment</summary><form className={styles.form} onSubmit={event => handlePayment(event)}><p>Record money already received. This action does not charge a card or initiate a transfer.</p><label>Amount received, in dollars<input required type="number" min="0.01" step="0.01" max={invoice.amountDueCents / 100} name="amount" /></label><label>Method<select name="method"><option value="check">Cleared check</option><option value="bank_transfer">Confirmed bank transfer</option><option value="cash">Cash</option></select></label><label>Unique payment reference<input required name="reference" maxLength={200} /></label><label className={styles.check}><input required type="checkbox" name="confirmed" />I verified that these funds were received.</label><button disabled={busy || !payable} type="submit">Record payment</button></form></details>
            <details><summary>Record a confirmed refund</summary><form className={styles.form} onSubmit={event => handlePayment(event, true)}><p>Record a refund already completed through your payment provider or bank. This does not move money.</p><label>Amount refunded, in dollars<input required type="number" min="0.01" step="0.01" max={(invoice.amountPaidCents - invoice.amountRefundedCents) / 100} name="amount" /></label><label>Refund transaction reference<input required name="reference" maxLength={200} /></label><label>Reason<textarea required name="reason" maxLength={1000} /></label><label className={styles.check}><input required type="checkbox" name="confirmed" />I verified the refund transaction.</label><button disabled={busy || !invoice.amountPaidCents} type="submit">Record refund</button></form></details>
          </> : null}
          {admin && !["paid", "refunded", "void", "uncollectible"].includes(currentStatus) ? <details><summary>Close this invoice</summary><form className={styles.form} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(() => nativeAction("close", { ...context, action: field(data, "closeAction"), reason: field(data, "reason") }), "Invoice closed. Its history is retained and reminders are stopped."); }}><label>Action<select name="closeAction"><option value="void">Void an unpaid invoice</option><option value="uncollectible">Mark uncollectible</option></select></label><label>Reason<textarea required name="reason" maxLength={1000} /></label><label className={styles.check}><input type="checkbox" required />Close this invoice and stop payment reminders.</label><button className={styles.danger} type="submit" disabled={busy}>Close invoice</button></form></details> : null}
          <details><summary>Payment receipts & delivery activity</summary>{activity.length ? activity.map(item => <div className={styles.activity} key={item.id}><strong>{item.kind.replaceAll("_", " ")}{item.amountCents ? ` · ${invoiceMoney(item.amountCents)}` : ""}</strong><span>{item.status} · {date(item.createdAt)}</span>{item.reference ? <small>Reference: {item.reference}</small> : null}<small>{item.recipient}</small></div>) : <p>No delivery activity yet.</p>}<p>Queued messages are not marked sent until the email service accepts them.</p></details>
        </> : null}
        {organizationId ? <details open={!invoice?.commercial}><summary>Organization billing details</summary><form className={styles.form} onSubmit={handleBilling} key={organizationId + profile.email}><label>Organization billing name<input name="name" required defaultValue={profile.name} /></label><label>Billing contact<input name="contactName" required defaultValue={profile.contactName} /></label><label>Billing email<input name="email" type="email" required defaultValue={profile.email} /></label><label>Billing address<textarea name="address" required defaultValue={profile.address} /></label><label>Purchase-order number <small>Optional</small><input name="purchaseOrder" defaultValue={profile.purchaseOrder} /></label><button type="submit" disabled={busy}>Save billing details</button></form></details> : null}
      </section>
    </div>
    {admin ? <details className={styles.configuration}><summary>Seller details, tax treatment & payment terms</summary><form className={styles.form} onSubmit={handleSettings} key={settings ? JSON.stringify(settings) : "empty"}>
      <p>Enter the approved legal business and remittance details. A tax rate is never inferred from the package price. Changes apply only to new invoices.</p>
      {([['legalName', 'Legal business name'], ['dba', 'Doing-business-as name (optional)'], ['address', 'Business address'], ['email', 'Business email / verified sender'], ['phone', 'Business phone'], ['appUrl', 'Live SongKeep account URL']] as const).map(([name, label]) => <label key={name}>{label}<input name={name} required={name !== "dba"} type={name === "email" ? "email" : name === "appUrl" ? "url" : "text"} defaultValue={settings?.[name] ?? ""} /></label>)}
      <label>Payment due in days<input required type="number" name="dueDays" min="1" max="90" defaultValue={settings?.dueDays ?? 14} /></label><label>Approved sales-tax rate, percent<input required type="number" min="0" max="100" step="0.01" name="taxRate" defaultValue={(settings?.taxBasisPoints ?? 0) / 100} /></label>
      <label>Tax treatment / review note<textarea required name="taxNote" defaultValue={settings?.taxNote ?? ""} /></label><label>Payment and remittance instructions<textarea required name="paymentInstructions" rows={4} defaultValue={settings?.paymentInstructions ?? ""} /></label><label>Service and cancellation terms<textarea required name="terms" rows={5} defaultValue={settings?.terms ?? ""} /></label>
      <label className={styles.check}><input required type="checkbox" name="taxReviewed" />I confirm this tax treatment has been reviewed for these services.</label><label className={styles.check}><input type="checkbox" name="autoIssue" defaultChecked={settings?.autoIssue ?? false} />Allow automatic issuance when billing details are complete.</label><button className={styles.primary} type="submit" disabled={busy}>Save invoice settings</button>
    </form></details> : null}
  </main>;
}
