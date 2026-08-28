"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  bookingActionIsAvailable,
  bookingSteps,
  formatOfferingPrice,
  getServiceOffering,
  participantPermissionScopes,
  serviceOfferings,
  type BookingStep,
  type ServiceOfferingId
} from "@/domain/booking";
import type { ConsentScope } from "@/domain/consent";
import styles from "./booking-route.module.css";

const stepLabels: Record<BookingStep, string> = {
  welcome: "Experience",
  schedule: "Date",
  agreement: "Review",
  payment: "Payment",
  participants: "People",
  permissions: "Permissions",
  ready: "Ready"
};

const legalDocuments = [
  ["Service terms", "The terms for the experience you are purchasing."],
  ["Cancellation policy", "The cancellation and rescheduling terms that apply to your booking."],
  ["Privacy notice", "How personal information, stories, recordings, and files are handled."],
  ["Electronic records", "Your choices for receiving, retaining, and printing electronic records."]
] as const;

export function BookingRoute() {
  const [activeStep, setActiveStep] = useState<BookingStep>("welcome");
  const [offeringId, setOfferingId] = useState<ServiceOfferingId | undefined>();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reviewedTerms, setReviewedTerms] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [completedBy, setCompletedBy] = useState<"self" | "representative">("self");
  const [representativeName, setRepresentativeName] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [permissions, setPermissions] = useState<ConsentScope[]>([]);

  const offering = useMemo(() => offeringId ? getServiceOffering(offeringId) : undefined, [offeringId]);
  const stepIndex = bookingSteps.indexOf(activeStep);

  function moveTo(step: BookingStep) {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    const next = bookingSteps[stepIndex + 1];
    if (next) moveTo(next);
  }

  function togglePermission(scope: ConsentScope) {
    setPermissions((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.imagePanel} aria-label="Honor a Life Song">
        <Link className={styles.brand} href="/">Honor a Life Song</Link>
        <div className={styles.imageCopy}>
          <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <p>One simple path from a meaningful conversation to the song you keep.</p>
        </div>
        <span className={styles.photoCredit}>Reference image: Los Muertos Crew / Pexels</span>
      </aside>

      <section className={styles.flow}>
        <header className={styles.flowHeader}>
          <Link className={styles.mobileBrand} href="/">Honor a Life Song</Link>
          <nav className={styles.progress} aria-label="Booking progress">
            {bookingSteps.map((step, index) => (
              <button
                key={step}
                type="button"
                className={index <= stepIndex ? styles.progressActive : undefined}
                aria-current={step === activeStep ? "step" : undefined}
                onClick={() => moveTo(step)}
              >
                <span>{index + 1}</span>
                <small>{stepLabels[step]}</small>
              </button>
            ))}
          </nav>
        </header>

        <div className={styles.content}>
          {activeStep === "welcome" ? (
            <section aria-labelledby="booking-title">
              <p className={styles.eyebrow}>Let&apos;s get your experience ready</p>
              <h1 id="booking-title">Choose what you discussed with us.</h1>
              <p className={styles.lede}>Your selection carries forward into scheduling, agreements, payment, and participant forms.</p>

              <div className={styles.offerings} role="radiogroup" aria-label="Honor a Life Song services">
                {serviceOfferings.map((item) => (
                  <label key={item.id} className={styles.offering}>
                    <input
                      type="radio"
                      name="offering"
                      value={item.id}
                      checked={offeringId === item.id}
                      onChange={() => setOfferingId(item.id)}
                    />
                    <span className={styles.choiceMark} aria-hidden="true" />
                    <span className={styles.offeringText}>
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                    </span>
                    <b>{formatOfferingPrice(item.priceCents)}</b>
                  </label>
                ))}
              </div>

              <button className={styles.primaryButton} type="button" disabled={!offering} onClick={nextStep}>Choose a date</button>
            </section>
          ) : null}

          {activeStep === "schedule" ? (
            <section aria-labelledby="schedule-title">
              <p className={styles.eyebrow}>Choose your date</p>
              <h1 id="schedule-title">When would you like to begin?</h1>
              <p className={styles.lede}>Only confirmed availability will be offered once live scheduling is connected.</p>
              <div className={styles.inlineFields}>
                <label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label><span>Preferred time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
              </div>
              <p className={styles.serviceNote}>This page is not reserving live appointments yet, so the date entered here is not held or saved.</p>
              <button className={styles.primaryButton} type="button" disabled={!date || !time} onClick={nextStep}>Review your booking</button>
            </section>
          ) : null}

          {activeStep === "agreement" ? (
            <section aria-labelledby="agreement-title">
              <p className={styles.eyebrow}>Review before payment</p>
              <h1 id="agreement-title">Know exactly what you&apos;re agreeing to.</h1>
              <p className={styles.lede}>Each final document will be readable, downloadable, and printable before you agree. Legal copy is not hard-coded into the booking interface.</p>
              <dl className={styles.documentList}>
                {legalDocuments.map(([title, description]) => (
                  <div key={title}><dt>{title}</dt><dd>{description}</dd></div>
                ))}
              </dl>
              <label className={styles.checkLine}>
                <input type="checkbox" checked={reviewedTerms} onChange={(event) => setReviewedTerms(event.target.checked)} />
                <span>I have reviewed the documents presented for this booking.</span>
              </label>
              <p className={styles.serviceNote}>Electronic agreement acceptance is not being recorded yet. No checkbox on this page creates a legal acceptance record.</p>
              <button className={styles.primaryButton} type="button" disabled={!reviewedTerms || !bookingActionIsAvailable("agreementPersistence")}>Continue to payment</button>
            </section>
          ) : null}

          {activeStep === "payment" ? (
            <section aria-labelledby="payment-title">
              <p className={styles.eyebrow}>Complete your booking</p>
              <h1 id="payment-title">A clear total. Nothing hidden.</h1>
              <div className={styles.orderLine}>
                <div><strong>{offering?.name ?? "Your Honor a Life Song experience"}</strong><span>{date && time ? `${date} · ${time}` : "Date selected during scheduling"}</span></div>
                <b>{offering ? formatOfferingPrice(offering.priceCents) : "—"}</b>
              </div>
              <p className={styles.serviceNote}>Secure checkout is not connected in this repository yet, so no card details are collected and no payment success is simulated.</p>
              <button className={styles.primaryButton} type="button" disabled={!bookingActionIsAvailable("payments")}>Pay securely</button>
            </section>
          ) : null}

          {activeStep === "participants" ? (
            <section aria-labelledby="participants-title">
              <p className={styles.eyebrow}>Who will take part?</p>
              <h1 id="participants-title">Add people without making them create accounts.</h1>
              <p className={styles.lede}>Participants can complete a private electronic form, use an assisted device, or sign a printed copy.</p>
              <div className={styles.participantActions}>
                <button type="button" onClick={nextStep}>Add a participant</button>
                <button type="button" disabled={!bookingActionIsAvailable("notifications")}>Send private form</button>
                <button type="button" onClick={() => window.print()}>Print participant form</button>
              </div>
            </section>
          ) : null}

          {activeStep === "permissions" ? (
            <section className={styles.permissionSheet} aria-labelledby="permissions-title">
              <p className={styles.eyebrow}>Participant permissions</p>
              <h1 id="permissions-title">Your choices stay separate.</h1>
              <p className={styles.lede}>Taking part does not automatically mean agreeing to recording, family sharing, photos, public use, or testimonials.</p>

              <div className={styles.inlineFields}>
                <label><span>Participant name</span><input value={participantName} onChange={(event) => setParticipantName(event.target.value)} /></label>
                <label><span>Completed by</span><select value={completedBy} onChange={(event) => setCompletedBy(event.target.value as "self" | "representative")}><option value="self">Participant</option><option value="representative">Authorized representative</option></select></label>
              </div>
              {completedBy === "representative" ? <label className={styles.fullField}><span>Representative name</span><input value={representativeName} onChange={(event) => setRepresentativeName(event.target.value)} /></label> : null}

              <fieldset className={styles.permissions}>
                <legend>Choose each permission individually</legend>
                {participantPermissionScopes.map((item) => (
                  <label key={item.scope}>
                    <input type="checkbox" checked={permissions.includes(item.scope)} onChange={() => togglePermission(item.scope)} />
                    <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  </label>
                ))}
              </fieldset>

              <label className={styles.fullField}><span>Signature name</span><input value={signatureName} onChange={(event) => setSignatureName(event.target.value)} /></label>
              <div className={styles.participantActions}>
                <button type="button" onClick={() => window.print()}>Print this form</button>
                <button type="button" disabled={!bookingActionIsAvailable("consentPersistence") || !participantName || !signatureName}>Save participant form</button>
              </div>
              <p className={styles.serviceNote}>Nothing entered on this page is saved yet. Paper forms will use the same permission choices and can later be attached to the participant&apos;s consent record.</p>
            </section>
          ) : null}

          {activeStep === "ready" ? (
            <section aria-labelledby="ready-title">
              <p className={styles.eyebrow}>When everything is complete</p>
              <h1 id="ready-title">You&apos;re ready to begin.</h1>
              <p className={styles.lede}>The live page will reduce the booking to the next useful action: your confirmed date, payment receipt, participant forms still needed, and preparation for the experience.</p>
              <div className={styles.readiness}>
                <span>Booking confirmed</span>
                <span>Payment received</span>
                <span>Agreements complete</span>
                <span>Participant forms complete</span>
              </div>
              <Link className={styles.primaryLink} href="/customer/dashboard">Continue to your song</Link>
            </section>
          ) : null}
        </div>

        <footer className={styles.flowFooter}>
          <span>Need help? We&apos;ll make sure you can complete this online or on paper.</span>
          <div><Link href="/">Privacy</Link><Link href="/">Terms</Link><Link href="/">Accessibility</Link></div>
        </footer>
      </section>
    </main>
  );
}
