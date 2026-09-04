"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./auth-provider";
import { SongKeepLockup } from "./brand";
import { AccountRegistrationForm, type AccountRegistrationResult } from "./account-registration-form";
import { SignInForm } from "./sign-in-form";
import { bookingSteps, formatOfferingPrice, getServiceOffering, serviceOfferings, type BookingStep, type ServiceOfferingId } from "@/domain/booking";
import { normalizeExperienceOfferingId } from "@/domain/experience";
import { bookingReturnPath, canPlanExperience, type BookingDraft } from "@/domain/account-onboarding";
import type { OrganizationRelationshipProfile } from "@/domain/customer-lifecycle";
import { createOrganizationExperienceRequest, listOrganizationRelationshipProfiles } from "@/lib/firebase/customer-lifecycle";
import { clearBookingDraft, getBookingDraft, saveBookingDraft } from "@/lib/firebase/booking-draft";
import { nativeCheckoutEnabled } from "@/lib/firebase/native-services";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./booking-route.module.css";

const steps = bookingSteps.filter((step): step is Exclude<BookingStep, "ready"> => step !== "ready");
const labels = { experience: "Experience", organization: "Account", plan: "Event", payment: "Review", ready: "Invoice requested" };
const titles = { experience: "Choose your experience.", organization: "Who should SongKeep work with?", plan: "Tell us about your event.", payment: "Review your experience.", ready: "Your invoice request is in." };

export function BookingRoute() {
  const params = useSearchParams(), router = useRouter();
  const { user, status, signOut } = useAuth();
  const requestedOffering = normalizeExperienceOfferingId(params.get("offering") ?? params.get("service"));
  const requestedOrg = params.get("organizationId") ?? params.get("org") ?? undefined;
  const [step, setStep] = useState<BookingStep>(requestedOffering ? "organization" : "experience");
  const [offeringId, setOfferingId] = useState<ServiceOfferingId | undefined>(requestedOffering);
  const [organizations, setOrganizations] = useState<OrganizationRelationshipProfile[]>([]);
  const [organizationId, setOrganizationId] = useState<string | undefined>(requestedOrg);
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false);
  const [registrationBusy, setRegistrationBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [accountMode, setAccountMode] = useState<"create" | "signin" | "choose">("choose");
  const [plan, setPlan] = useState({ preferredDate: "", preferredTime: "", venue: "", participantEstimate: "", organizationGoal: "" });
  const [authorized, setAuthorized] = useState(false);
  const [payment, setPayment] = useState<"card" | "invoice">(nativeCheckoutEnabled ? "card" : "invoice");
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [sourceExperienceId, setSourceExperienceId] = useState(params.get("sourceExperience") ?? undefined);
  const [replacesRequestId, setReplacesRequestId] = useState(params.get("replacesRequest") ?? undefined);
  const intent = useRef<{ signature: string; key: string } | null>(null);
  const lastUser = useRef<string | null>(null), busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const offering = useMemo(() => offeringId ? getServiceOffering(offeringId) : undefined, [offeringId]);
  const organization = organizations.find(item => item.id === organizationId);
  const accountReady = Boolean(user && organization && canPlanExperience(organization.membershipRole));
  const shownStep = ["plan", "payment", "ready"].includes(step) && !accountReady ? "organization" : step;
  const returnPath = bookingReturnPath({ offeringId, organizationId, sourceExperienceId, replacesRequestId, query: new URLSearchParams(params.toString()) });

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setOrganizations([]);
      if (lastUser.current) {
        setOrganizationId(undefined); setStep(offeringId ? "organization" : "experience");
        setPlan({ preferredDate: "", preferredTime: "", venue: "", participantEstimate: "", organizationGoal: "" });
        setRequestId(null); setAuthorized(false); intent.current = null;
      }
      lastUser.current = null; return;
    }
    if (registrationBusy) { setLoading(false); return; }
    lastUser.current = user.uid;
    setLoading(true);
    listOrganizationRelationshipProfiles(user.uid).then(items => {
      if (cancelled) return;
      setOrganizations(items);
      setOrganizationId(current => items.some(item => item.id === current) ? current : items.length === 1 ? items[0].id : undefined);
    }).catch(cause => { if (!cancelled) setError(customerMessage(cause, "We could not open your account. Please try again.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Choice changes do not reload the signed-in account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, registrationBusy]);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [shownStep]);
  function go(next: BookingStep) {
    if (["plan", "payment"].includes(next) && !accountReady) return;
    if (next === "plan") setReviewed(false);
    setStep(next); setError(null); window.scrollTo({ top: 0, behavior: "auto" });
  }
  function choose(id: ServiceOfferingId) {
    setOfferingId(id); setAuthorized(false); setRequestId(null); setReviewed(false);
    router.replace(bookingReturnPath({ offeringId: id, organizationId, sourceExperienceId, replacesRequestId, query: new URLSearchParams(params.toString()) }), { scroll: false });
  }
  function draft(): BookingDraft {
    if (!organizationId || !offeringId) throw new Error("Choose your organization and experience first.");
    return { organizationId, offeringId, ...plan, sourceExperienceId, replacesRequestId };
  }
  async function openPlan(id = organizationId, accountUser = user) {
    if (!id || !accountUser || !offeringId) return;
    const old = await getBookingDraft(accountUser.uid, id);
    const samePlan = old?.offeringId === offeringId && old.replacesRequestId === replacesRequestId && old.sourceExperienceId === sourceExperienceId;
    if (samePlan && old) {
      setPlan({ preferredDate: old.preferredDate ?? "", preferredTime: old.preferredTime ?? "", venue: old.venue ?? "", participantEstimate: old.participantEstimate ?? "", organizationGoal: old.organizationGoal ?? "" });
      setSourceExperienceId(sourceExperienceId ?? old.sourceExperienceId); setReplacesRequestId(replacesRequestId ?? old.replacesRequestId);
      if (old.requestKey && old.requestSignature) intent.current = { key: old.requestKey, signature: old.requestSignature };
    }
    await saveBookingDraft(accountUser.uid, { ...(samePlan && old ? old : {}), organizationId: id, offeringId, ...(sourceExperienceId ? { sourceExperienceId } : {}), ...(replacesRequestId ? { replacesRequestId } : {}) });
    setStep("plan"); setError(null);
  }
  async function completeAccount(result: AccountRegistrationResult) {
    if (!result.organizationId) return;
    const items = await listOrganizationRelationshipProfiles(result.user.uid);
    setOrganizations(items); setOrganizationId(result.organizationId); setAccountMode("choose");
    router.replace(bookingReturnPath({ offeringId, organizationId: result.organizationId, sourceExperienceId, replacesRequestId, query: new URLSearchParams(params.toString()) }), { scroll: false });
    await openPlan(result.organizationId, result.user);
  }
  async function safeAction(action: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError(null);
    try { await action(); } catch (cause) { setError(customerMessage(cause, "We could not save this yet. Please try again.")); }
    finally { busy.current = false; setSaving(false); }
  }
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user || !accountReady) return;
    await safeAction(async () => { await saveBookingDraft(user.uid, draft()); setReviewed(true); go("payment"); });
  }
  async function submit() {
    if (!accountReady || !user || !offering || !organization || !authorized || !plan.preferredDate || !plan.preferredTime || requestId) return;
    await safeAction(async () => {
      const signature = JSON.stringify({ ...draft(), payment });
      if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() };
      await saveBookingDraft(user.uid, { ...draft(), requestKey: intent.current.key, requestSignature: signature });
      const request = await createOrganizationExperienceRequest({
        idempotencyKey: intent.current.key, organizationId: organization.id, createdByUserId: user.uid,
        offeringId: offering.id, ...plan, participantEstimate: plan.participantEstimate ? Number(plan.participantEstimate) : undefined,
        requestedPaymentMethod: payment, agreementAcknowledged: authorized, sourceExperienceId, replacesRequestId,
        acquisition: { source: params.get("utm_source") ?? undefined, medium: params.get("utm_medium") ?? undefined, campaign: params.get("utm_campaign") ?? undefined, content: params.get("utm_content") ?? undefined, referralCode: params.get("ref") ?? undefined }
      });
      setRequestId(request.id);
      await clearBookingDraft(user.uid, organization.id).catch(() => undefined);
      if (payment === "card") router.push(`/organization/invoices?organization=${encodeURIComponent(organization.id)}&invoice=${encodeURIComponent(request.id)}`);
      else go("ready");
    });
  }

  return <main className={styles.shell}>
    <aside className={styles.storyPanel} aria-label="SongKeep">
      <Link className={styles.brand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div className={styles.storyCopy}><span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span><p>Bring your people together through song.</p><small>A shared moment. A keepsake for years to come.</small></div>
    </aside>
    <section className={styles.flow}>
      <header className={styles.flowHeader}>
        <Link className={styles.mobileBrand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
        {shownStep !== "ready" ? <nav className={styles.progress} aria-label="Booking progress">{steps.map((item, index) => <button key={item} type="button" aria-current={item === shownStep ? "step" : undefined}
          disabled={saving || registrationBusy || (item === "organization" && !offering) || (item === "plan" && !accountReady) || (item === "payment" && (!accountReady || !reviewed))}
          onClick={() => go(item)}><span aria-hidden="true">{index + 1}</span><small>{labels[item]}</small></button>)}</nav> : null}
        {user ? <div className={styles.accountBar}><Link href={organizationId ? `/organization?org=${encodeURIComponent(organizationId)}` : "/organization"}>My account</Link><button type="button" disabled={saving || registrationBusy} onClick={() => void safeAction(signOut)}>Sign out</button></div> : null}
      </header>
      <div className={styles.content}>
        {error ? <div className={styles.alert} role="alert">{error}</div> : null}
        <p className={styles.eyebrow}>{labels[shownStep]}</p><h1 ref={heading} tabIndex={-1}>{titles[shownStep]}</h1>
        {shownStep === "experience" ? <section className={styles.step} aria-label="Choose a SongKeep experience">
          <p className={styles.lede}>Find the right fit for your group.</p>
          <div className={styles.offerings} role="radiogroup" aria-label="SongKeep experiences">{serviceOfferings.map(item => <label key={item.id} className={styles.offering}>
            <input type="radio" name="offering" checked={offeringId === item.id} onChange={() => choose(item.id)} /><span className={styles.choiceMark} aria-hidden="true" />
            <span className={styles.offeringBody}><span className={styles.offeringHeading}><strong>{item.name}</strong><b>{formatOfferingPrice(item.priceCents)}</b></span><small>{item.description}</small><span className={styles.inclusions}><span>{item.creativeOutput}</span><span>{item.presentation}</span></span></span>
          </label>)}</div>
          <button className={styles.primaryButton} disabled={!offering} onClick={() => go("organization")}>Continue</button>
        </section> : null}
        {shownStep === "organization" ? <section className={styles.step} aria-label="Set up your account">
          {offering ? <div className={styles.selectionSummary}><div><span>Your experience</span><strong>{offering.name}</strong><small>{formatOfferingPrice(offering.priceCents)} · {offering.creativeOutput}</small></div><button onClick={() => go("experience")}>Change</button></div> : null}
          {!registrationBusy && (status === "loading" || loading) ? <p role="status">Opening your account…</p> : registrationBusy || accountMode === "create" || !user || !organizations.length ? <>
            <p className={styles.lede}>{user ? "Add your group to continue." : "Create your account before planning the event. You can return to your invoices and experiences anytime."}</p>
            {accountMode === "signin" && !user ? <><SignInForm next={returnPath} onComplete={() => setAccountMode("choose")} /><p><button className={styles.textButton} onClick={() => setAccountMode("create")}>Create a new account instead</button></p></> :
              <AccountRegistrationForm onBusyChange={setRegistrationBusy} offeringId={offeringId} onComplete={completeAccount} onSignIn={() => setAccountMode("signin")} />}
            {user && organizations.length ? <button className={styles.textButton} onClick={() => setAccountMode("choose")}>Use an existing organization</button> : null}
          </> : <>
            <p className={styles.lede}>Welcome back, {user.displayName?.split(" ")[0] || "there"}. Which group is this for?</p>
            <div className={styles.organizationList} role="radiogroup" aria-label="Organization account">{organizations.map(item => <label key={item.id}><input type="radio" name="organization" checked={organizationId === item.id} disabled={!canPlanExperience(item.membershipRole)} onChange={() => setOrganizationId(item.id)} /><span className={styles.choiceMark} aria-hidden="true" /><span><strong>{item.name}</strong><small>{canPlanExperience(item.membershipRole) ? item.contact.displayName : "Ask your administrator to book this experience."}</small></span></label>)}</div>
            <button className={styles.primaryButton} disabled={!accountReady || saving} onClick={() => void safeAction(() => openPlan())}>{saving ? "Opening…" : "Continue to event details"}</button>
            <button className={styles.textButton} onClick={() => setAccountMode("create")}>Add another group</button>
          </>}
        </section> : null}
        {shownStep === "plan" ? <form className={styles.step} onSubmit={review} aria-label="Plan your experience">
          <div className={styles.selectionSummary}><div><span>{organization?.name}</span><strong>{offering?.name}</strong><small>{offering?.creativeOutput}</small></div><button type="button" onClick={() => go("experience")}>Change experience</button></div>
          <div className={styles.twoColumns}><label className={styles.field}><span>Preferred date</span><input required type="date" value={plan.preferredDate} onChange={e => setPlan({ ...plan, preferredDate: e.target.value })} /></label><label className={styles.field}><span>Preferred start time</span><input required type="time" value={plan.preferredTime} onChange={e => setPlan({ ...plan, preferredTime: e.target.value })} /></label></div>
          <label className={styles.field}><span>Location or room <small>Optional</small></span><input maxLength={300} value={plan.venue} onChange={e => setPlan({ ...plan, venue: e.target.value })} /></label>
          <label className={styles.field}><span>Estimated participants <small>Optional</small></span><input type="number" min={1} max={10000} step={1} inputMode="numeric" value={plan.participantEstimate} onChange={e => setPlan({ ...plan, participantEstimate: e.target.value })} /></label>
          <label className={styles.field}><span>What are you celebrating? <small>Optional</small></span><input maxLength={1000} value={plan.organizationGoal} onChange={e => setPlan({ ...plan, organizationGoal: e.target.value })} placeholder="A milestone, a community, a life…" /></label>
          <p className={styles.serviceNote}>We’ll confirm your date and time with you.</p>
          <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "Saving…" : "Review experience"}</button>
          <button className={styles.textButton} type="button" disabled={saving} onClick={() => user && void safeAction(async () => { await saveBookingDraft(user.uid, draft()); router.push(`/organization?org=${organizationId}`); })}>Save and finish later</button>
        </form> : null}
        {shownStep === "payment" ? <section className={styles.step} aria-label="Review and payment">
          <div className={styles.orderSummary}><div><strong>{offering?.name}</strong><span>{organization?.name}</span><span>{offering?.creativeOutput}</span><span>{plan.preferredDate} at {plan.preferredTime} · Awaiting date confirmation</span></div><b>{offering ? formatOfferingPrice(offering.priceCents) : ""}</b></div>
          <button className={styles.textButton} onClick={() => go("plan")}>Edit event details</button>
          <fieldset className={styles.paymentChoices}><legend>How would you like to pay?</legend>
            {nativeCheckoutEnabled ? <label><input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} /><span><strong>Pay now</strong><small>Continue to secure checkout.</small></span></label> : null}
            <label><input type="radio" name="payment" checked={payment === "invoice"} onChange={() => setPayment("invoice")} /><span><strong>Request an invoice</strong><small>Review and pay from your account.</small></span></label>
          </fieldset>
          <label className={styles.authorization}><input type="checkbox" checked={authorized} onChange={e => setAuthorized(e.target.checked)} /><span>I am authorized to book for this group. I understand the date is subject to confirmation and I’ll review the service terms before the experience.</span></label>
          <button className={styles.primaryButton} disabled={!authorized || saving || Boolean(requestId)} onClick={() => void submit()}>{saving ? "Submitting…" : payment === "card" ? "Continue to payment" : "Request invoice"}</button>
        </section> : null}
        {shownStep === "ready" ? <section className={styles.step} aria-label="Invoice requested">
          <div className={styles.completionMark} aria-hidden="true">✓</div>
          <p className={styles.lede}>We’ve received your request. You can check your invoice and next steps in your account.</p>
          <div className={styles.orderSummary}><div><strong>{offering?.name}</strong><span>{organization?.name}</span><span>{offering?.creativeOutput}</span></div><b>{offering ? formatOfferingPrice(offering.priceCents) : ""}</b></div>
          <Link className={styles.primaryLink} href={`/organization?org=${organizationId}&request=${requestId}`}>Go to my account</Link>
          <Link className={styles.secondaryLink} href={`/organization/invoices?organization=${organizationId}&invoice=${requestId}`}>View invoice</Link>
        </section> : null}
      </div>
      <footer className={styles.footer}><span>Made for your people.</span><Link href="/services">Compare experiences</Link></footer>
    </section>
  </main>;
}
