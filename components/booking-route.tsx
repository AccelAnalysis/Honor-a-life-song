"use client";

import { nativeCheckoutEnabled } from "@/lib/firebase/native-services";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import {
  bookingSteps,
  formatOfferingPrice,
  getServiceOffering,
  serviceOfferings,
  type BookingStep,
  type ServiceOfferingId
} from "@/domain/booking";
import { normalizeExperienceOfferingId } from "@/domain/experience";
import type { OrganizationRelationshipProfile } from "@/domain/customer-lifecycle";
import {
  createOrganizationExperienceRequest,
  listOrganizationRelationshipProfiles
} from "@/lib/firebase/customer-lifecycle";
import styles from "./booking-route.module.css";

const progressSteps = bookingSteps.filter((step): step is Exclude<BookingStep, "ready"> => step !== "ready");
const stepLabels: Record<Exclude<BookingStep, "ready">, string> = {
  experience: "Experience",
  organization: "Organization",
  plan: "Plan",
  payment: "Complete"
};

const offeringDetails: Record<ServiceOfferingId, readonly string[]> = {
  "single-song-group-event": ["Shared story conversation", "One original group song", "Event presentation"],
  "honor-a-life-song-experience": ["Participant interviews", "Multiple original songs", "Follow-up concert"],
  "songkeep-legacy-album": ["Extended story discovery", "Cohesive multi-track album", "Approved digital release"]
};

function validOfferingId(value: string | null): ServiceOfferingId | undefined {
  return normalizeExperienceOfferingId(value);
}

function titleForStep(step: BookingStep) {
  if (step === "experience") return "Choose the experience that fits.";
  if (step === "organization") return "Who should SongKeep work with?";
  if (step === "plan") return "Tell us what you are planning.";
  if (step === "payment") return "Choose how to complete the request.";
  return "Your request is connected to your account.";
}

export function BookingRoute() {
  const searchParams = useSearchParams();
  const { user, status: authStatus, configurationError } = useAuth();
  const isStaticPreview = process.env.NEXT_PUBLIC_HALS_STATIC_PREVIEW === "1";
  const requestedOffering = validOfferingId(searchParams.get("offering") ?? searchParams.get("service"));
  const requestedOrganizationId = searchParams.get("organizationId") ?? searchParams.get("org");
  const sourceExperienceId = searchParams.get("sourceExperience") ?? undefined;
  const replacesRequestId = searchParams.get("replacesRequest") ?? undefined;
  const initialStep: BookingStep = requestedOffering ? "organization" : "experience";

  const [activeStep, setActiveStep] = useState<BookingStep>(initialStep);
  const [furthestStepIndex, setFurthestStepIndex] = useState(bookingSteps.indexOf(initialStep));
  const [offeringId, setOfferingId] = useState<ServiceOfferingId | undefined>(requestedOffering);
  const [organizations, setOrganizations] = useState<OrganizationRelationshipProfile[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(requestedOrganizationId ?? undefined);
  const [previewOrganizationName, setPreviewOrganizationName] = useState("");
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [venue, setVenue] = useState("");
  const [participantEstimate, setParticipantEstimate] = useState("");
  const [organizationGoal, setOrganizationGoal] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "invoice">(nativeCheckoutEnabled ? "card" : "invoice");
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [submittedMethod, setSubmittedMethod] = useState<"card" | "invoice" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offering = useMemo(() => offeringId ? getServiceOffering(offeringId) : undefined, [offeringId]);
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
  const currentIndex = bookingSteps.indexOf(activeStep);
  const cardAvailable = nativeCheckoutEnabled;
  const intent = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    if (isStaticPreview || !user) {
      setOrganizations([]);
      return;
    }
    let cancelled = false;
    setOrganizationLoading(true);
    listOrganizationRelationshipProfiles(user.uid)
      .then((items) => {
        if (cancelled) return;
        setOrganizations(items);
        setSelectedOrganizationId((current) => items.some((item) => item.id === current) ? current : items[0]?.id);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open your organization account.");
      })
      .finally(() => { if (!cancelled) setOrganizationLoading(false); });
    return () => { cancelled = true; };
  }, [isStaticPreview, user]);

  function moveTo(step: BookingStep) {
    const index = bookingSteps.indexOf(step);
    if (index > furthestStepIndex) return;
    setActiveStep(step);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueTo(step: BookingStep) {
    const index = bookingSteps.indexOf(step);
    setFurthestStepIndex((current) => Math.max(current, index));
    setActiveStep(step);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function accountReturnPath() {
    const params = new URLSearchParams();
    if (offeringId) params.set("offering", offeringId);
    params.set("step", "organization");
    if (sourceExperienceId) params.set("sourceExperience", sourceExperienceId);
    if (replacesRequestId) params.set("replacesRequest", replacesRequestId);
    return `/begin?${params.toString()}`;
  }

  function chooseExperience(id: ServiceOfferingId) {
    setOfferingId(id);
    setRequestId(null);
    setSubmittedMethod(null);
  }

  async function submitRequest() {
    if (!offering || !preferredDate || !preferredTime || !authorized) return;
    if (isStaticPreview) {
      setRequestId("preview-only");
      setSubmittedMethod(paymentMethod);
      continueTo("ready");
      return;
    }
    if (!user || !selectedOrganization) {
      setError("Choose or create an organization account before continuing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const signature = JSON.stringify({ offeringId, selectedOrganizationId, preferredDate, preferredTime, venue, participantEstimate, organizationGoal, paymentMethod, sourceExperienceId, replacesRequestId });
      if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() };
      const request = await createOrganizationExperienceRequest({
        idempotencyKey: intent.current.key,
        organizationId: selectedOrganization.id,
        createdByUserId: user.uid,
        offeringId: offering.id,
        preferredDate,
        preferredTime,
        venue,
        participantEstimate: participantEstimate ? Number(participantEstimate) : undefined,
        organizationGoal,
        requestedPaymentMethod: paymentMethod,
        agreementAcknowledged: authorized,
        sourceExperienceId,
        replacesRequestId,
        acquisition: {
          source: searchParams.get("utm_source") ?? undefined,
          medium: searchParams.get("utm_medium") ?? undefined,
          campaign: searchParams.get("utm_campaign") ?? undefined,
          content: searchParams.get("utm_content") ?? undefined,
          referralCode: searchParams.get("ref") ?? undefined
        }
      });
      setRequestId(request.id);
      setSubmittedMethod(paymentMethod);
      if (paymentMethod === "card") {
        window.location.assign(`/organization/invoices?organization=${encodeURIComponent(selectedOrganization.id)}&invoice=${encodeURIComponent(request.id)}`);
        return;
      }
      continueTo("ready");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not save this request.");
    } finally {
      setSaving(false);
    }
  }

  const organizationName = isStaticPreview ? previewOrganizationName : selectedOrganization?.name;

  return <main className={styles.shell}>
    <aside className={styles.storyPanel} aria-label="SongKeep">
      <Link className={styles.brand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div className={styles.storyCopy}>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <p>One account carries every experience forward.</p>
        <small>Choose, plan, pay, invite, celebrate, and return.</small>
      </div>
    </aside>

    <section className={styles.flow}>
      <header className={styles.flowHeader}>
        <Link className={styles.mobileBrand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
        {activeStep !== "ready" ? <nav className={styles.progress} aria-label="Planning progress">
          {progressSteps.map((step, index) => <button
            key={step}
            type="button"
            aria-current={step === activeStep ? "step" : undefined}
            disabled={bookingSteps.indexOf(step) > furthestStepIndex}
            onClick={() => moveTo(step)}
          ><span aria-hidden="true">{index + 1}</span><small>{stepLabels[step]}</small></button>)}
        </nav> : null}
      </header>

      <div className={styles.content}>
        {error ? <div className={styles.alert} role="alert"><strong>We could not continue.</strong><span>{error}</span></div> : null}
        <p className={styles.eyebrow}>{activeStep === "ready" ? "Saved to your relationship" : stepLabels[activeStep as Exclude<BookingStep, "ready">]}</p>
        <h1>{titleForStep(activeStep)}</h1>

        {activeStep === "experience" ? <section className={styles.step} aria-label="Choose a SongKeep experience">
          <p className={styles.lede}>All three experiences are purchased by an organization. Participants and families enter later through private invitations.</p>
          <div className={styles.offerings} role="radiogroup" aria-label="SongKeep experiences">
            {serviceOfferings.map((item) => <label key={item.id} className={styles.offering}>
              <input type="radio" name="offering" value={item.id} checked={offeringId === item.id} onChange={() => chooseExperience(item.id)} />
              <span className={styles.choiceMark} aria-hidden="true" />
              <span className={styles.offeringBody}>
                <span className={styles.offeringHeading}><strong>{item.name}</strong><b>{formatOfferingPrice(item.priceCents)}</b></span>
                <small>{item.description}</small>
                <span className={styles.inclusions}>{offeringDetails[item.id].map((detail) => <span key={detail}>{detail}</span>)}</span>
              </span>
            </label>)}
          </div>
          <button className={styles.primaryButton} type="button" disabled={!offering} onClick={() => continueTo("organization")}>Continue</button>
        </section> : null}

        {activeStep === "organization" ? <section className={styles.step} aria-label="Choose your organization">
          {offering ? <div className={styles.selectionSummary}><div><span>Selected</span><strong>{offering.name}</strong><small>{formatOfferingPrice(offering.priceCents)}</small></div><button type="button" onClick={() => moveTo("experience")}>Change</button></div> : null}
          {isStaticPreview ? <>
            <label className={styles.field}><span>Organization name</span><input value={previewOrganizationName} onChange={(event) => setPreviewOrganizationName(event.target.value)} placeholder="Your organization" /></label>
            <p className={styles.serviceNote}>Preview mode shows the journey without creating an account or saving information.</p>
            <button className={styles.primaryButton} type="button" disabled={!previewOrganizationName.trim()} onClick={() => continueTo("plan")}>Continue</button>
          </> : <>
            {authStatus === "loading" || organizationLoading ? <p className={styles.statusLine} role="status">Opening your account…</p> : null}
            {authStatus === "signed_out" ? <div className={styles.accountChoice}>
              <p>Create the permanent organization account now. The primary contact remains separate and can be changed later.</p>
              <div><Link className={styles.primaryLink} href={`/create-account?next=${encodeURIComponent(accountReturnPath())}`}>Create organization account</Link><Link className={styles.secondaryLink} href={`/login?next=${encodeURIComponent(accountReturnPath())}`}>Sign in</Link></div>
            </div> : null}
            {authStatus === "signed_in" && user && organizations.length ? <>
              <div className={styles.organizationList} role="radiogroup" aria-label="Organization account">
                {organizations.map((organization) => <label key={organization.id}>
                  <input type="radio" name="organization" checked={selectedOrganizationId === organization.id} onChange={() => setSelectedOrganizationId(organization.id)} />
                  <span className={styles.choiceMark} aria-hidden="true" />
                  <span><strong>{organization.name}</strong><small>{organization.contact.displayName}{organization.contact.title ? ` · ${organization.contact.title}` : ""}</small></span>
                </label>)}
              </div>
              <div className={styles.inlineActions}><Link className={styles.secondaryLink} href={`/create-account?next=${encodeURIComponent(accountReturnPath())}`}>Add another organization</Link></div>
              <button className={styles.primaryButton} type="button" disabled={!selectedOrganization} onClick={() => continueTo("plan")}>Continue</button>
            </> : null}
            {authStatus === "signed_in" && user && !organizationLoading && !organizations.length ? <div className={styles.accountChoice}><p>Add the organization and primary point of contact to continue.</p><Link className={styles.primaryLink} href={`/create-account?next=${encodeURIComponent(accountReturnPath())}`}>Add organization</Link></div> : null}
            {authStatus === "unavailable" ? <div className={styles.alert} role="status"><strong>Account access is unavailable.</strong><span>{configurationError ?? "Please try again from the live SongKeep site."}</span></div> : null}
          </>}
        </section> : null}

        {activeStep === "plan" ? <section className={styles.step} aria-label="Plan your experience">
          <div className={styles.selectionSummary}><div><span>{organizationName}</span><strong>{offering?.name}</strong><small>{offering ? formatOfferingPrice(offering.priceCents) : ""}</small></div><button type="button" onClick={() => moveTo("experience")}>Change experience</button></div>
          <div className={styles.twoColumns}>
            <label className={styles.field}><span>Preferred date</span><input required type="date" value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} /></label>
            <label className={styles.field}><span>Preferred start time</span><input required type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} /></label>
          </div>
          <label className={styles.field}><span>Location or room <small>Optional</small></span><input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Community room or address" /></label>
          <div className={styles.twoColumns}>
            <label className={styles.field}><span>Estimated participants <small>Optional</small></span><input min="1" inputMode="numeric" type="number" value={participantEstimate} onChange={(event) => setParticipantEstimate(event.target.value)} /></label>
            <label className={styles.field}><span>What should this experience accomplish?</span><input value={organizationGoal} onChange={(event) => setOrganizationGoal(event.target.value)} placeholder="Celebrate, preserve, connect…" /></label>
          </div>
          <p className={styles.serviceNote}>This is a preferred time, not a confirmed reservation. SongKeep confirms capacity, scope, and final documents from your account.</p>
          <button className={styles.primaryButton} type="button" disabled={!preferredDate || !preferredTime} onClick={() => continueTo("payment")}>Review & complete</button>
        </section> : null}

        {activeStep === "payment" ? <section className={styles.step} aria-label="Choose payment or invoice">
          <div className={styles.orderSummary}>
            <div><strong>{offering?.name}</strong><span>{organizationName} · {preferredDate} at {preferredTime}</span></div>
            <b>{offering ? formatOfferingPrice(offering.priceCents) : "—"}</b>
          </div>
          <fieldset className={styles.paymentChoices}>
            <legend>How should the organization complete the purchase?</legend>
            <label><input type="radio" name="paymentMethod" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} /><span><strong>Pay now</strong><small>{cardAvailable ? "Continue to secure checkout. Activation follows confirmed payment." : "Available when checkout is configured for this experience."}</small></span></label>
            <label><input type="radio" name="paymentMethod" checked={paymentMethod === "invoice"} onChange={() => setPaymentMethod("invoice")} /><span><strong>Request an invoice</strong><small>The invoice and all payment follow-up stay connected to the organization account.</small></span></label>
          </fieldset>
          {offeringId === "songkeep-legacy-album" ? <div className={styles.contextNote}><strong>Legacy Album release terms</strong><span>Final scope also addresses artist identity, credits, AI disclosure, rights, approved distribution, and release authorization.</span></div> : null}
          <label className={styles.authorization}><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} /><span>I am authorized to plan this experience for the organization and understand that final service, cancellation, privacy, and applicable release documents will be issued through the account.</span></label>
          <button className={styles.primaryButton} type="button" disabled={!authorized || saving || (paymentMethod === "card" && !cardAvailable && !isStaticPreview)} onClick={submitRequest}>{saving ? "Saving…" : paymentMethod === "card" ? "Continue to secure payment" : "Request invoice"}</button>
          {paymentMethod === "card" && !cardAvailable && !isStaticPreview ? <p className={styles.serviceNote}>Card checkout is not configured for this package. Choose invoice to save the request now.</p> : null}
        </section> : null}

        {activeStep === "ready" ? <section className={styles.step} aria-label="Request saved">
          {isStaticPreview ? <div className={styles.previewNotice}><strong>Preview complete</strong><span>No account, invoice, payment, or request was created in this static preview.</span></div> : null}
          <div className={styles.completionMark} aria-hidden="true">✓</div>
          <p className={styles.lede}>{submittedMethod === "invoice"
            ? "The invoice request is now part of the organization relationship. SongKeep can prepare the invoice, follow up on payment, and move directly into onboarding after payment is confirmed."
            : "The request is saved. The experience becomes active only after SongKeep receives authoritative payment confirmation."}</p>
          <div className={styles.nextSteps}>
            <div><span>1</span><p><strong>Commercial follow-up</strong><small>Invoice or payment status stays with the organization account.</small></p></div>
            <div><span>2</span><p><strong>Experience setup</strong><small>Paid experiences open the right participant, story, album, or event workflow.</small></p></div>
            <div><span>3</span><p><strong>People & permissions</strong><small>Participants receive their own private permission links; the organization agreement never replaces individual consent.</small></p></div>
          </div>
          {!isStaticPreview && selectedOrganization ? <Link className={styles.primaryLink} href={`/organization/relationship?org=${selectedOrganization.id}${requestId ? `&request=${requestId}` : ""}`}>Open organization relationship</Link> : <button className={styles.primaryButton} type="button" onClick={() => moveTo("experience")}>Start again</button>}
        </section> : null}
      </div>

      <footer className={styles.footer}><span>Need help? Contact SongKeep.</span><Link href="/services">Compare experiences</Link></footer>
    </section>
  </main>;
}
