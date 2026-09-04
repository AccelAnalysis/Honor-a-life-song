import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bookingActionIsAvailable,
  bookingSteps,
  formatOfferingPrice,
  participantPermissionScopes,
  serviceOfferings
} from "../domain/booking";

const bookingSource = readFileSync(resolve(process.cwd(), "components/booking-route.tsx"), "utf8");
const bookingRepositorySource = readFileSync(resolve(process.cwd(), "lib/firebase/booking.ts"), "utf8");
const servicesSource = readFileSync(resolve(process.cwd(), "app/(public)/services/page.tsx"), "utf8");
const authSource = readFileSync(resolve(process.cwd(), "components/auth-provider.tsx"), "utf8");
const organizationSource = readFileSync(resolve(process.cwd(), "components/organization-workspace.tsx"), "utf8");
const organizationCss = readFileSync(resolve(process.cwd(), "components/organization-workspace.module.css"), "utf8");

describe("post-engagement catalog", () => {
  it("locks the two current customer prices", () => {
    expect(serviceOfferings).toEqual([
      expect.objectContaining({ id: "single-song-group-event", priceCents: 20_000, buyer: "organization", creativeOutput: "One shared song" }),
      expect.objectContaining({ id: "honor-a-life-song-experience", priceCents: 250_000, buyer: "organization", creativeOutput: "Multiple participant songs" })
    ]);
    expect(formatOfferingPrice(20_000)).toBe("$200");
    expect(formatOfferingPrice(250_000)).toBe("$2,500");
  });

  it("uses the shortened facility planning journey in the intended order", () => {
    expect(bookingSteps).toEqual([
      "experience",
      "details",
      "checkout",
      "ready"
    ]);
  });

  it("does not ask for the package twice after selection", () => {
    expect(servicesSource).toContain('href={`/begin?offering=${experience.id}&step=details`}');
    expect(bookingSource).toContain('const requestedStep: BookingStep = requestedOffering ? "details" : "experience"');
    expect(bookingSource).toContain("Selected experience");
    expect(bookingSource).toContain('<Link href="/services">Change</Link>');
  });
});

describe("booking truthfulness", () => {
  it("uses connected Firebase identity and request persistence without claiming unavailable services", () => {
    expect(bookingActionIsAvailable("identity")).toBe(true);
    expect(bookingActionIsAvailable("invitationResolution")).toBe(false);
    expect(bookingActionIsAvailable("scheduling")).toBe(false);
    expect(bookingActionIsAvailable("agreementPersistence")).toBe(false);
    expect(bookingActionIsAvailable("payments")).toBe(false);
    expect(bookingActionIsAvailable("invoiceRequest")).toBe(true);
    expect(bookingActionIsAvailable("consentPersistence")).toBe(false);
    expect(bookingActionIsAvailable("experiencePersistence")).toBe(true);
  });

  it("records a preferred-date inquiry and never simulates booking or payment confirmation", () => {
    expect(bookingSource).toContain("Your preferred time is confirmed with the Honor a Life Song team before the experience is booked.");
    expect(bookingSource).toContain("Participant permission forms are completed separately");
    expect(bookingSource).toContain("Payment is confirmed before the experience is marked booked.");
    expect(bookingSource).toContain("buildOfferingPaymentLink");
    expect(bookingRepositorySource).toContain('status: "inquiry"');
    expect(bookingRepositorySource).toContain('dateStatus: "requested"');
    expect(bookingSource).not.toContain("Payment successful");
    expect(bookingSource).not.toContain("Your experience is booked");
  });

  it("keeps infrastructure details out of the customer-facing fallback", () => {
    expect(authSource).not.toContain('return error instanceof Error ? error.message');
    expect(authSource).toContain("Account access isn’t available in this preview");
    expect(bookingSource).not.toContain("NEXT_PUBLIC_FIREBASE_API_KEY");
    expect(bookingSource).not.toContain("Firebase client configuration");
    expect(bookingSource).not.toContain(">Preview mode<");
    expect(bookingSource).not.toContain("Preview Community");
    expect(bookingSource).not.toContain("Preview only");
  });
});

describe("participant permissions", () => {
  it("keeps participation, recording, family sharing, media, and public use separate", () => {
    const scopes = participantPermissionScopes.map((item) => item.scope);
    expect(scopes).toContain("participation");
    expect(scopes).toContain("interview_recording");
    expect(scopes).toContain("designated_family_sharing");
    expect(scopes).toContain("event_photo_video");
    expect(scopes).toContain("public_marketing");
  });

  it("supports printable forms without creating a second consent model", () => {
    expect(organizationSource).toContain("participantPermissionScopes.map");
    expect(organizationSource).toContain("window.print()");
    expect(organizationCss).toContain("@media print");
    expect(organizationSource).toContain("Complete digitally, with assistance, or on paper.");
  });
});

describe("consumer presentation", () => {
  it("avoids operations vocabulary and heavy workspace chrome", () => {
    expect(bookingSource).not.toContain("ProgramRun");
    expect(bookingSource).not.toContain("canonical");
    expect(bookingSource).not.toContain("chassis");
    expect(bookingSource).not.toContain("CRM");
    expect(bookingSource).not.toContain("workspace");
  });
});
