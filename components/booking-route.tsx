"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import {
  bookingActionIsAvailable,
  bookingSteps,
  buildOfferingPaymentLink,
  formatOfferingPrice,
  getOfferingPaymentLink,
  getServiceOffering,
  serviceOfferings,
  type BookingStep,
  type ServiceOfferingId
} from "@/domain/booking";
import { normalizeExperienceOfferingId } from "@/domain/experience";
import type { OrganizationAccount } from "@/domain/organization-account";
import { createOrganizationExperienceRequest } from "@/lib/firebase/booking";
import { listUserOrganizations } from "@/lib/firebase/organization-account";
import styles from "./booking-route.module.css";

const stepLabels: Record<BookingStep, string> = {
  experience: "Experience",
  details: "Facility & date",
  checkout: "Agreement & payment",
  ready: "Next steps"
};

const offeringDetails: Record<ServiceOfferingId, readonly string[]> = {
  "single-song-group-event": [
    "Shared group story conversation",
    "One original shared song",
    "Event presentation",
    "Song and approved event materials afterward"
  ],
  "honor-a-life-song-experience": [
    "Several participant interviews",
    "Multiple original participant songs",
    "Follow-up concert",
    "Songs, lyrics, approved video, photos, reports, and keepsakes"
  ]
};

const legalDocuments = [
  ["Service agreement", "Experience scope, responsibilities, and deliverables."],
  ["Cancellation policy", "Cancellation and rescheduling terms."],
  ["Privacy notice", "How organization information and submitted files are handled."],
  ["Electronic records", "Your choice to receive and sign documents electronically."]
] as const;

function validOfferingId(value: string | null): ServiceOfferingId | undefined {
  return normalizeExperienceOfferingId(value);
}

function invoiceHref(input: {
  offeringName: string;
  organizationName: string;
  preferredDate: string;
  preferredTime: string;
  requestId: string;
}) {
  const subject = `Invoice request — ${input.offeringName}`;
  const body = [
    "Please send an invoice for this SongKeep experience.",
    "",
    `Organization: ${input.organizationName}`,
    `Experience: ${input.offeringName}`,
    `Preferred date: ${input.preferredDate}`,
    `Preferred time: ${input.preferredTime}`,
    `Request: ${input.requestId}`
  ].join("\n");
  return `mailto:help@honoralifesong.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function BookingRoute() {
  const searchParams = useSearchParams();
  const { user, status: authStatus, configurationError } = useAuth();
  const isStaticPreview = process.env.NEXT_PUBLIC_HALS_STATIC_PREVIEW === "1";
  const requestedOffering = validOfferingId(searchParams.get("offering") ?? searchParams.get("service"));
  const requestedOrganizationId = searchParams.get("organizationId");
  const sourceExperience = searchParams.get("sourceExperience");
  const requestedStep: BookingStep = requestedOffering ? "details" : "experience";
  const [activeStep, setActiveStep] = useState<BookingStep>(requestedStep);
  const [furthestStep, setFurthestStep] = useState(bookingSteps.indexOf(requestedStep));
  const [offeringId, setOfferingId] = useState<ServiceOfferingId | undefined>(requestedOffering);
  const [organizations, setOrganizations] = useState<OrganizationAccount[]>([]);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(requestedOrganizationId ?? undefined);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [reviewedTerms, setReviewedTerms] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestedPaymentMethod, setRequestedPaymentMethod] = useState<"card" | "invoice" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offering = useMemo(() => offeringId ? getServiceOffering(offeringId) : undefined, [offeringId]);
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
  const organizationName = isStaticPreview ? "Preview Community" : selectedOrganization?.name;
  const paymentLinkAvailable = offeringId ? Boolean(getOfferingPaymentLink(offeringId)) : false;
  const stepIndex = bookingSteps.indexOf(activeStep);

  useEffect(() => {
    if (isStaticPreview || !user) {
      setOrganizations([]);
      return;
    }
    let cancelled = false;
    setOrganizationLoading(true);
    listUserOrganizations(user.uid)
      .then((items) => {
        if (cancelled) return;
        setOrganizations(items);
        setSelectedOrganizationId((current) => items.some((item) => item.id === current) ? current : items[0]?.id);
      })
      .catch(() => { if (!cancelled) setError("We couldn’t load your organization account."); })
      .finally(() => { if (!cancelled) setOrganizationLoading(false); });
    return () => { cancelled = true; };
  }, [isStaticPreview, user]);

  function moveTo(step: BookingStep) {
    const index = bookingSteps.indexOf(step);
    if (index > furthestStep) return;
    setActiveStep(step);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueTo(step: BookingStep) {
    const index = bookingSteps.indexOf(step);
    setFurthestStep((current) => Math.max(current, index));
    setActiveStep(step);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function organizationReturnPath() {
    const params = new URLSearchParams();
    if (offeringId) params.set("offering", offeringId);
    if (requestedOrganizationId) params.set("organizationId", requestedOrganizationId);
    if (sourceExperience) params.set("sourceExperience", sourceExperience);
    return `/begin?${params.toString()}`;
  }

  async function savePlan(paymentMethod: "card" | "invoice") {
    if (!user || !offering || !selectedOrganization || !date || !time || !reviewedTerms) return;
    setSaving(true);
    setError(null);
    try {
      const nextRequestId = requestId ?? await createOrganizationExperienceRequest({
        organizationId: selectedOrganization.id,
        createdByUserId: user.uid,
        offeringId: offering.id,
        preferredDate: date,
        preferredTime: time,
        venue,
        requestedPaymentMethod: paymentMethod
      });
      setRequestId(nextRequestId);
      setRequestedPaymentMethod(paymentMethod);

      if (paymentMethod === "card") {
        const paymentLink = buildOfferingPaymentLink(offering.id, {
          experienceRequestId: nextRequestId,
          customerEmail: user.email ?? undefined
        });
        if (!paymentLink) throw new Error("Card checkout isn’t available here yet. Choose invoice to continue.");
        window.location.assign(paymentLink);
        return;
      }

      continueTo("ready");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn’t save this plan.");
    } finally {
      setSaving(false);
    }
  }

  function previewNextSteps() {
    setRequestId("Preview only");
    setRequestedPaymentMethod(null);
    continueTo("ready");
  }

  const invoiceLink = requestId && offering && selectedOrganization
    ? invoiceHref({
        offeringName: offering.name,
        organizationName: selectedOrganization.name,
        preferredDate: date,
        preferredTime: time,
        requestId
      })
    : undefined;

  return <main className={styles.shell}>
    <aside className={styles.imagePanel} aria-label="SongKeep">
      <Link className={styles.brand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div className={styles.imageCopy}>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <p>Stories become songs worth keeping.</p>
      </div>
      <span className={styles.photoCredit}>Photo: Los Muertos Crew / Pexels</span>
    </aside>

    <section className={styles.flow}>
      <header className={styles.flowHeader}>
        <Link className={styles.mobileBrand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
        <nav className={styles.progress} aria-label="Planning progress">
          {bookingSteps.map((step, index) => <button
            key={step}
            type="button"
            className={index <= stepIndex ? styles.progressActive : undefined}
            aria-current={step === activeStep ? "step" : undefined}
            disabled={index > furthestStep}
            onClick={() => moveTo(step)}
          ><span>{index + 1}</span><small>{stepLabels[step]}</small></button>)}
        </nav>
      </header>

      <div className={styles.content}>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        {activeStep === "experience" ? <section aria-labelledby="booking-title">
          <p className={styles.eyebrow}>Choose an experience</p>
          <h1 id="booking-title">What fits your community?</h1>
          <p className={styles.lede}>Compare the story experience, music, presentation, and materials your organization receives afterward.</p>
          <div className={styles.offerings} role="radiogroup" aria-label="SongKeep experiences">
            {serviceOfferings.map((item) => <label key={item.id} className={styles.offering}>
              <input type="radio" name="offering" value={item.id} checked={offeringId === item.id} onChange={() => setOfferingId(item.id)} />
              <span className={styles.choiceMark} aria-hidden="true" />
              <span className={styles.offeringText}>
                <span className={styles.offeringHeading}><strong>{item.name}</strong><b>{formatOfferingPrice(item.priceCents)}</b></span>
                <small>{item.description}</small>
                <span className={styles.inclusions}>{offeringDetails[item.id].map((detail) => <span key={detail}>{detail}</span>)}</span>
              </span>
            </label>)}
          </div>
          <button className={styles.primaryButton} type="button" disabled={!offering} onClick={() => continueTo("details")}>Continue with this experience</button>
        </section> : null}

        {activeStep === "details" ? <section aria-labelledby="details-title">
          <p className={styles.eyebrow}>Facility &amp; preferred date</p>
          <h1 id="details-title">Where should the music happen?</h1>
          {offering ? <div className={styles.selectedPlan}>
            <div><span>Selected experience</span><strong>{offering.name}</strong><small>{formatOfferingPrice(offering.priceCents)}</small></div>
            <Link href="/services">Change</Link>
          </div> : null}

          {isStaticPreview ? <>
            <div className={styles.previewNotice}><strong>Preview mode</strong><span>Use any date and room to review the rest of the journey. Nothing will be saved, sent, or charged.</span></div>
            <div className={styles.previewOrganization}><span>Facility</span><strong>Preview Community</strong></div>
            <div className={styles.inlineFields}>
              <label><span>Preferred date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label><span>Preferred start time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
            </div>
            <label className={styles.fullField}><span>Venue or room <small>Optional</small></span><input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Community room" /></label>
            <p className={styles.serviceNote}>The live service confirms availability before an experience becomes booked.</p>
            <button className={styles.primaryButton} type="button" disabled={!date || !time} onClick={() => continueTo("checkout")}>Review agreement &amp; payment</button>
          </> : <>
            {authStatus === "loading" || organizationLoading ? <p className={styles.serviceNote}>Checking your account…</p> : null}
            {authStatus === "signed_out" ? <div className={styles.signInPanel}>
              <p>Create or sign in to your organization account. Your selected experience will be waiting when you return.</p>
              <div><Link className={styles.primaryLink} href={`/create-account?next=${encodeURIComponent(organizationReturnPath())}`}>Create organization account</Link><Link className={styles.secondaryLink} href={`/login?next=${encodeURIComponent(organizationReturnPath())}`}>Sign in</Link></div>
            </div> : null}
            {authStatus === "signed_in" && user && organizations.length > 0 ? <>
              <div className={styles.organizationChoices} role="radiogroup" aria-label="Choose organization">
                {organizations.map((organization) => <label key={organization.id} className={styles.organizationChoice}>
                  <input type="radio" name="organization" value={organization.id} checked={selectedOrganizationId === organization.id} onChange={() => setSelectedOrganizationId(organization.id)} />
                  <span><strong>{organization.name}</strong><small>{user.email}</small></span>
                </label>)}
              </div>
              <div className={styles.inlineFields}>
                <label><span>Preferred date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label><span>Preferred start time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
              </div>
              <label className={styles.fullField}><span>Venue or room <small>Optional</small></span><input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Community room" /></label>
              <p className={styles.serviceNote}>This is your preferred time. The Honor a Life Song team will confirm availability before the experience is contracted.</p>
              <button className={styles.primaryButton} type="button" disabled={!selectedOrganization || !date || !time} onClick={() => continueTo("checkout")}>Review agreement &amp; payment</button>
            </> : null}
            {authStatus === "signed_in" && user && !organizationLoading && organizations.length === 0 ? <Link className={styles.primaryLink} href="/create-account?complete=organization">Finish organization setup</Link> : null}
            {authStatus === "unavailable" ? <div className={styles.accountUnavailable}><strong>Account access isn’t available here right now.</strong><span>{configurationError ?? "Please try again later or contact Honor a Life Song for help."}</span></div> : null}
          </>}
        </section> : null}

        {activeStep === "checkout" ? <section aria-labelledby="checkout-title">
          <p className={styles.eyebrow}>Agreement &amp; payment</p>
          <h1 id="checkout-title">Review your plan.</h1>
          <div className={styles.orderLine}>
            <div><strong>{offering?.name ?? "SongKeep experience"}</strong><span>{organizationName ?? "Organization"}{date && time ? ` · ${date} at ${time}` : ""}</span></div>
            <b>{offering ? formatOfferingPrice(offering.priceCents) : "—"}</b>
          </div>
          <dl className={styles.documentList}>{legalDocuments.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
          <label className={styles.checkLine}><input type="checkbox" checked={reviewedTerms} onChange={(event) => setReviewedTerms(event.target.checked)} /><span>I’m authorized to plan this experience for the organization and review the final documents when issued.</span></label>
          <p className={styles.serviceNote}>Reviewing this summary does not replace the final service agreement or participant permission forms.</p>

          {isStaticPreview ? <div className={styles.previewCheckout}>
            <p><strong>Preview only.</strong> In the live service, the facility can pay by card when checkout is configured or request an invoice. This preview does not create a request or payment.</p>
            <button className={styles.primaryButton} type="button" disabled={!reviewedTerms} onClick={previewNextSteps}>Preview next steps</button>
          </div> : <>
            <div className={styles.paymentChoices}>
              <button className={styles.primaryButton} type="button" disabled={!reviewedTerms || saving || !paymentLinkAvailable || !bookingActionIsAvailable("experiencePersistence")} onClick={() => savePlan("card")}>
                {saving && requestedPaymentMethod === "card" ? "Opening secure payment…" : `Pay securely${offering ? ` — ${formatOfferingPrice(offering.priceCents)}` : ""}`}
              </button>
              <button className={styles.secondaryButton} type="button" disabled={!reviewedTerms || saving || !bookingActionIsAvailable("invoiceRequest")} onClick={() => savePlan("invoice")}>
                {saving && requestedPaymentMethod === "invoice" ? "Saving…" : "Save plan & request invoice"}
              </button>
            </div>
            {!paymentLinkAvailable ? <p className={styles.paymentNotice}>Secure checkout isn’t available here yet. Choose invoice to continue.</p> : <p className={styles.paymentNotice}>Card payment opens Stripe’s secure checkout. Payment is confirmed only after Stripe reports it to the Honor a Life Song team.</p>}
          </>}
        </section> : null}

        {activeStep === "ready" ? <section aria-labelledby="ready-title">
          <p className={styles.eyebrow}>{isStaticPreview ? "Preview" : "Plan saved"}</p>
          <h1 id="ready-title">{isStaticPreview ? "This is what happens next." : "Your experience is taking shape."}</h1>
          <p className={styles.lede}>{isStaticPreview
            ? "On the live service, your facility’s plan is saved here. The team confirms availability, issues the final agreement, verifies payment, and then opens the experience for preparation."
            : "Your preferred date and experience are saved. The team will confirm availability, issue the final agreement, and verify payment before marking the event booked."}</p>
          <div className={styles.confirmationCard}>
            <span>Request</span><strong>{isStaticPreview ? "Preview only — not saved" : requestId}</strong>
            <span>Experience</span><strong>{offering?.name}</strong>
            <span>Facility</span><strong>{organizationName ?? "Organization"}</strong>
            <span>Preferred date</span><strong>{date} at {time}</strong>
            <span>Next</span><strong>Confirm date, agreement, and payment</strong>
          </div>
          {isStaticPreview ? <div className={styles.readyActions}>
            <Link className={styles.primaryLink} href="/services">Back to experiences</Link>
            <button className={styles.secondaryButton} type="button" onClick={() => moveTo("details")}>Review facility &amp; date</button>
          </div> : <div className={styles.readyActions}>
            {requestedPaymentMethod === "invoice" && invoiceLink ? <a className={styles.primaryLink} href={invoiceLink}>Email invoice request</a> : null}
            <Link className={styles.secondaryLink} href={selectedOrganizationId ? `/organization/experiences?org=${selectedOrganizationId}` : "/organization"}>Open organization account</Link>
          </div>}
        </section> : null}
      </div>

      <footer className={styles.flowFooter}><span>Need help? <a href="mailto:help@honoralifesong.com">Contact Honor a Life Song</a>.</span></footer>
    </section>
  </main>;
}
