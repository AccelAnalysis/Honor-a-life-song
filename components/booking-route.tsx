"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  bookingActionIsAvailable,
  bookingSteps,
  formatOfferingPrice,
  getServiceOffering,
  serviceOfferings,
  type BookingStep,
  type ServiceOfferingId
} from "@/domain/booking";
import { normalizeExperienceOfferingId } from "@/domain/experience";
import type { OrganizationAccount } from "@/domain/organization-account";
import { listUserOrganizations } from "@/lib/firebase/organization-account";
import styles from "./booking-route.module.css";

const stepLabels: Record<BookingStep, string> = {
  experience: "Experience",
  organization: "Organization",
  schedule: "Date",
  agreement: "Agreements",
  payment: "Payment",
  setup: "Setup",
  ready: "Ready"
};

const legalDocuments = [
  ["Service agreement", "The scope and terms for the experience your organization is purchasing."],
  ["Cancellation policy", "The cancellation and rescheduling terms that apply to the event."],
  ["Privacy notice", "How organization, participant, story, recording, and file information is handled."],
  ["Electronic records", "Your choices for receiving, retaining, and printing electronic records."]
] as const;

function validOfferingId(value: string | null): ServiceOfferingId | undefined {
  return normalizeExperienceOfferingId(value);
}

export function BookingRoute() {
  const searchParams = useSearchParams();
  const { user, status: authStatus, configurationError } = useAuth();
  const requestedOffering = validOfferingId(searchParams.get("offering") ?? searchParams.get("service"));
  const requestedOrganizationId = searchParams.get("organizationId");
  const sourceExperience = searchParams.get("sourceExperience");
  const requestedStep: BookingStep = searchParams.get("step") === "organization" && requestedOffering ? "organization" : "experience";
  const [activeStep, setActiveStep] = useState<BookingStep>(requestedStep);
  const [furthestStep, setFurthestStep] = useState(bookingSteps.indexOf(requestedStep));
  const [offeringId, setOfferingId] = useState<ServiceOfferingId | undefined>(requestedOffering);
  const [organizations, setOrganizations] = useState<OrganizationAccount[]>([]);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(requestedOrganizationId ?? undefined);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reviewedTerms, setReviewedTerms] = useState(false);

  const offering = useMemo(() => offeringId ? getServiceOffering(offeringId) : undefined, [offeringId]);
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
  const stepIndex = bookingSteps.indexOf(activeStep);

  useEffect(() => {
    if (!user) {
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
      .finally(() => { if (!cancelled) setOrganizationLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  function moveTo(step: BookingStep) {
    const index = bookingSteps.indexOf(step);
    if (index > furthestStep) return;
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    const next = bookingSteps[stepIndex + 1];
    if (!next) return;
    const nextIndex = stepIndex + 1;
    setFurthestStep((current) => Math.max(current, nextIndex));
    setActiveStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function organizationReturnPath() {
    const params = new URLSearchParams();
    params.set("step", "organization");
    if (offeringId) params.set("offering", offeringId);
    if (requestedOrganizationId) params.set("organizationId", requestedOrganizationId);
    if (sourceExperience) params.set("sourceExperience", sourceExperience);
    return `/begin?${params.toString()}`;
  }

  return <main className={styles.shell}>
    <aside className={styles.imagePanel} aria-label="Honor a Life Song">
      <Link className={styles.brand} href="/">Honor a Life Song</Link>
      <div className={styles.imageCopy}>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <p>Bring stories, music, and a lasting shared experience to the people you serve.</p>
      </div>
      <span className={styles.photoCredit}>Photo: Los Muertos Crew / Pexels</span>
    </aside>

    <section className={styles.flow}>
      <header className={styles.flowHeader}>
        <Link className={styles.mobileBrand} href="/">Honor a Life Song</Link>
        <nav className={styles.progress} aria-label="Booking progress">
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
        {activeStep === "experience" ? <section aria-labelledby="booking-title">
          <p className={styles.eyebrow}>Choose an organization experience</p>
          <h1 id="booking-title">What would you like to bring to your community?</h1>
          <p className={styles.lede}>Both experiences are purchased and managed by a facility or organization. Participants and families join through the experience you create.</p>
          <div className={styles.offerings} role="radiogroup" aria-label="Honor a Life Song experiences">
            {serviceOfferings.map((item) => <label key={item.id} className={styles.offering}>
              <input type="radio" name="offering" value={item.id} checked={offeringId === item.id} onChange={() => setOfferingId(item.id)} />
              <span className={styles.choiceMark} aria-hidden="true" />
              <span className={styles.offeringText}><strong>{item.name}</strong><small>{item.description}</small><small>{item.creativeOutput} · {item.presentation}</small></span>
              <b>{formatOfferingPrice(item.priceCents)}</b>
            </label>)}
          </div>
          <button className={styles.primaryButton} type="button" disabled={!offering} onClick={nextStep}>Continue with this experience</button>
        </section> : null}

        {activeStep === "organization" ? <section aria-labelledby="organization-title">
          <p className={styles.eyebrow}>Your organization</p>
          <h1 id="organization-title">Keep every experience in one account.</h1>
          <p className={styles.lede}>The organization is the customer and account owner. Its team, agreements, event history, billing, and approved materials stay connected across future experiences.</p>
          {authStatus === "loading" || organizationLoading ? <p className={styles.serviceNote}>Checking your account…</p> : null}
          {authStatus === "signed_out" ? <>
            <p className={styles.serviceNote}>Create an organization account or sign in. Your selected experience will return with you.</p>
            <div className={styles.participantActions}>
              <Link className={styles.primaryLink} href={`/create-account?next=${encodeURIComponent(organizationReturnPath())}`}>Create organization account</Link>
              <Link className={styles.primaryLink} href={`/login?next=${encodeURIComponent(organizationReturnPath())}`}>Sign in</Link>
            </div>
          </> : null}
          {authStatus === "signed_in" && user && organizations.length > 0 ? <>
            <div className={styles.offerings} role="radiogroup" aria-label="Choose organization">
              {organizations.map((organization) => <label key={organization.id} className={styles.offering}>
                <input type="radio" name="organization" value={organization.id} checked={selectedOrganizationId === organization.id} onChange={() => setSelectedOrganizationId(organization.id)} />
                <span className={styles.choiceMark} aria-hidden="true" />
                <span className={styles.offeringText}><strong>{organization.name}</strong><small>{user.email}</small></span>
              </label>)}
            </div>
            <button className={styles.primaryButton} type="button" disabled={!selectedOrganization} onClick={nextStep}>Continue with this organization</button>
          </> : null}
          {authStatus === "signed_in" && user && !organizationLoading && organizations.length === 0 ? <>
            <p className={styles.serviceNote}>This sign-in is not connected to an organization yet.</p>
            <Link className={styles.primaryLink} href="/create-account?complete=organization">Finish organization setup</Link>
          </> : null}
          {authStatus === "unavailable" ? <p className={styles.serviceNote}>{configurationError ?? "Firebase account access is not configured in this environment."}</p> : null}
        </section> : null}

        {activeStep === "schedule" ? <section aria-labelledby="schedule-title">
          <p className={styles.eyebrow}>Preferred date</p>
          <h1 id="schedule-title">When would your organization like to host the experience?</h1>
          <p className={styles.lede}>Live availability must be confirmed before a date can be reserved.</p>
          <div className={styles.inlineFields}><label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Preferred time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
          <p className={styles.serviceNote}>Scheduling is not connected yet, so the date entered here is not held or saved.</p>
          <button className={styles.primaryButton} type="button" disabled={!date || !time || !bookingActionIsAvailable("scheduling")} onClick={nextStep}>Confirm availability</button>
        </section> : null}

        {activeStep === "agreement" ? <section aria-labelledby="agreement-title">
          <p className={styles.eyebrow}>Scope &amp; agreements</p>
          <h1 id="agreement-title">Review what your organization is purchasing.</h1>
          <p className={styles.lede}>Each final document will be readable, downloadable, and printable. Organization agreements remain separate from every participant&apos;s permission choices.</p>
          <dl className={styles.documentList}>{legalDocuments.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
          <label className={styles.checkLine}><input type="checkbox" checked={reviewedTerms} onChange={(event) => setReviewedTerms(event.target.checked)} /><span>I am authorized to review these documents for the organization.</span></label>
          <p className={styles.serviceNote}>Electronic agreement acceptance is not connected yet. No checkbox on this page creates a legal acceptance record.</p>
          <button className={styles.primaryButton} type="button" disabled={!reviewedTerms || !bookingActionIsAvailable("agreementPersistence")} onClick={nextStep}>Continue to payment</button>
        </section> : null}

        {activeStep === "payment" ? <section aria-labelledby="payment-title">
          <p className={styles.eyebrow}>Organization payment</p>
          <h1 id="payment-title">A clear total for the experience.</h1>
          <div className={styles.orderLine}><div><strong>{offering?.name ?? "Honor a Life Song experience"}</strong><span>{selectedOrganization?.name ?? "Organization"}{date && time ? ` · ${date} · ${time}` : ""}</span></div><b>{offering ? formatOfferingPrice(offering.priceCents) : "—"}</b></div>
          <p className={styles.serviceNote}>Secure checkout is not connected yet, so no card details are collected and no payment success is simulated.</p>
          <button className={styles.primaryButton} type="button" disabled={!bookingActionIsAvailable("payments")} onClick={nextStep}>Pay securely</button>
        </section> : null}

        {activeStep === "setup" ? <section aria-labelledby="setup-title">
          <p className={styles.eyebrow}>Experience setup</p>
          <h1 id="setup-title">Prepare only what this experience needs.</h1>
          {offering?.participantMode === "group" ? <>
            <p className={styles.lede}>The Single-Song Group Event keeps setup light: venue, primary contact, group information, needed permissions, event preparation, and the shared song.</p>
            <div className={styles.readiness}><span>Event details</span><span>Group information</span><span>Needed permissions</span><span>Shared song &amp; materials</span></div>
          </> : <>
            <p className={styles.lede}>The full experience opens the deeper work inside this organization-owned experience, including participant selection, interviews, songs, concert planning, and post-event materials.</p>
            <div className={styles.readiness}><span>Participants</span><span>Interviews</span><span>Songs</span><span>Follow-up concert</span></div>
          </>}
          <p className={styles.serviceNote}>Participants do not need accounts to take part. Their consent records remain separate from the organization&apos;s service agreement.</p>
          <button className={styles.primaryButton} type="button" disabled={!bookingActionIsAvailable("experiencePersistence")} onClick={nextStep}>Create organization experience</button>
        </section> : null}

        {activeStep === "ready" ? <section aria-labelledby="ready-title">
          <p className={styles.eyebrow}>Experience created</p>
          <h1 id="ready-title">Your organization can continue with event setup.</h1>
          <p className={styles.lede}>The experience is now part of the organization&apos;s ongoing history, with the next useful actions shown inside it.</p>
          <Link className={styles.primaryLink} href={selectedOrganizationId ? `/organization/experiences?org=${selectedOrganizationId}` : "/organization"}>Open your experience</Link>
        </section> : null}
      </div>

      <footer className={styles.flowFooter}><span>Need help? We&apos;ll make sure your organization and participants can complete required steps online or on paper.</span><span>Participant permissions are never implied by the organization&apos;s purchase.</span></footer>
    </section>
  </main>;
}
