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
  experience: "Plan",
  organization: "Account",
  schedule: "Date",
  agreement: "Review",
  payment: "Pay",
  setup: "Setup",
  ready: "Done"
};

const legalDocuments = [
  ["Service agreement", "Experience scope and terms."],
  ["Cancellation policy", "Cancellation and rescheduling terms."],
  ["Privacy notice", "How information and files are handled."],
  ["Electronic records", "Electronic document choices."]
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
    <aside className={styles.imagePanel} aria-label="SongKeep">
      <Link className={styles.brand} href="/">SongKeep</Link>
      <div className={styles.imageCopy}>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <p>Stories become songs worth keeping.</p>
      </div>
      <span className={styles.photoCredit}>Photo: Los Muertos Crew / Pexels</span>
    </aside>

    <section className={styles.flow}>
      <header className={styles.flowHeader}>
        <Link className={styles.mobileBrand} href="/">SongKeep</Link>
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
          <p className={styles.eyebrow}>Choose</p>
          <h1 id="booking-title">Pick your experience.</h1>
          <div className={styles.offerings} role="radiogroup" aria-label="SongKeep experiences">
            {serviceOfferings.map((item) => <label key={item.id} className={styles.offering}>
              <input type="radio" name="offering" value={item.id} checked={offeringId === item.id} onChange={() => setOfferingId(item.id)} />
              <span className={styles.choiceMark} aria-hidden="true" />
              <span className={styles.offeringText}><strong>{item.name}</strong><small>{item.creativeOutput} · {item.presentation}</small></span>
              <b>{formatOfferingPrice(item.priceCents)}</b>
            </label>)}
          </div>
          <button className={styles.primaryButton} type="button" disabled={!offering} onClick={nextStep}>Continue</button>
        </section> : null}

        {activeStep === "organization" ? <section aria-labelledby="organization-title">
          <p className={styles.eyebrow}>Account</p>
          <h1 id="organization-title">Choose your organization.</h1>
          {authStatus === "loading" || organizationLoading ? <p className={styles.serviceNote}>Checking account…</p> : null}
          {authStatus === "signed_out" ? <div className={styles.participantActions}>
            <Link className={styles.primaryLink} href={`/create-account?next=${encodeURIComponent(organizationReturnPath())}`}>Create account</Link>
            <Link className={styles.primaryLink} href={`/login?next=${encodeURIComponent(organizationReturnPath())}`}>Sign in</Link>
          </div> : null}
          {authStatus === "signed_in" && user && organizations.length > 0 ? <>
            <div className={styles.offerings} role="radiogroup" aria-label="Choose organization">
              {organizations.map((organization) => <label key={organization.id} className={styles.offering}>
                <input type="radio" name="organization" value={organization.id} checked={selectedOrganizationId === organization.id} onChange={() => setSelectedOrganizationId(organization.id)} />
                <span className={styles.choiceMark} aria-hidden="true" />
                <span className={styles.offeringText}><strong>{organization.name}</strong><small>{user.email}</small></span>
              </label>)}
            </div>
            <button className={styles.primaryButton} type="button" disabled={!selectedOrganization} onClick={nextStep}>Continue</button>
          </> : null}
          {authStatus === "signed_in" && user && !organizationLoading && organizations.length === 0 ? <Link className={styles.primaryLink} href="/create-account?complete=organization">Finish setup</Link> : null}
          {authStatus === "unavailable" ? <p className={styles.serviceNote}>{configurationError ?? "Account access is unavailable here."}</p> : null}
        </section> : null}

        {activeStep === "schedule" ? <section aria-labelledby="schedule-title">
          <p className={styles.eyebrow}>Date</p>
          <h1 id="schedule-title">Choose a date.</h1>
          <div className={styles.inlineFields}><label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
          <p className={styles.serviceNote}>Live scheduling isn’t connected yet.</p>
          <button className={styles.primaryButton} type="button" disabled={!date || !time || !bookingActionIsAvailable("scheduling")} onClick={nextStep}>Check availability</button>
        </section> : null}

        {activeStep === "agreement" ? <section aria-labelledby="agreement-title">
          <p className={styles.eyebrow}>Review</p>
          <h1 id="agreement-title">Review &amp; sign.</h1>
          <dl className={styles.documentList}>{legalDocuments.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
          <label className={styles.checkLine}><input type="checkbox" checked={reviewedTerms} onChange={(event) => setReviewedTerms(event.target.checked)} /><span>I’m authorized to review these documents.</span></label>
          <p className={styles.serviceNote}>Electronic signing isn’t connected yet.</p>
          <button className={styles.primaryButton} type="button" disabled={!reviewedTerms || !bookingActionIsAvailable("agreementPersistence")} onClick={nextStep}>Continue</button>
        </section> : null}

        {activeStep === "payment" ? <section aria-labelledby="payment-title">
          <p className={styles.eyebrow}>Payment</p>
          <h1 id="payment-title">Complete payment.</h1>
          <div className={styles.orderLine}><div><strong>{offering?.name ?? "SongKeep experience"}</strong><span>{selectedOrganization?.name ?? "Organization"}{date && time ? ` · ${date} · ${time}` : ""}</span></div><b>{offering ? formatOfferingPrice(offering.priceCents) : "—"}</b></div>
          <p className={styles.serviceNote}>Secure checkout isn’t connected yet.</p>
          <button className={styles.primaryButton} type="button" disabled={!bookingActionIsAvailable("payments")} onClick={nextStep}>Pay securely</button>
        </section> : null}

        {activeStep === "setup" ? <section aria-labelledby="setup-title">
          <p className={styles.eyebrow}>Setup</p>
          <h1 id="setup-title">Get ready.</h1>
          {offering?.participantMode === "group" ? <>
            <p className={styles.lede}>A simple event with one shared song.</p>
            <div className={styles.readiness}><span>Event details</span><span>Group</span><span>Permissions</span><span>Song</span></div>
          </> : <>
            <p className={styles.lede}>Participants, interviews, songs, and a follow-up concert.</p>
            <div className={styles.readiness}><span>Participants</span><span>Interviews</span><span>Songs</span><span>Concert</span></div>
          </>}
          <p className={styles.serviceNote}>Participants don’t need SongKeep accounts.</p>
          <button className={styles.primaryButton} type="button" disabled={!bookingActionIsAvailable("experiencePersistence")} onClick={nextStep}>Create experience</button>
        </section> : null}

        {activeStep === "ready" ? <section aria-labelledby="ready-title">
          <p className={styles.eyebrow}>Done</p>
          <h1 id="ready-title">You’re ready.</h1>
          <Link className={styles.primaryLink} href={selectedOrganizationId ? `/organization/experiences?org=${selectedOrganizationId}` : "/organization"}>Open experience</Link>
        </section> : null}
      </div>

      <footer className={styles.flowFooter}><span>Need help? Contact us.</span></footer>
    </section>
  </main>;
}
