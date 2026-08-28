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

  it("uses the customer journey in the intended order", () => {
    expect(bookingSteps).toEqual([
      "experience",
      "organization",
      "schedule",
      "agreement",
      "payment",
      "setup",
      "ready"
    ]);
  });
});

describe("booking truthfulness", () => {
  it("uses connected Firebase identity while failing closed for unconnected services", () => {
    expect(bookingActionIsAvailable("identity")).toBe(true);
    expect(bookingActionIsAvailable("invitationResolution")).toBe(false);
    expect(bookingActionIsAvailable("scheduling")).toBe(false);
    expect(bookingActionIsAvailable("agreementPersistence")).toBe(false);
    expect(bookingActionIsAvailable("payments")).toBe(false);
    expect(bookingActionIsAvailable("consentPersistence")).toBe(false);
    expect(bookingActionIsAvailable("experiencePersistence")).toBe(false);
  });

  it("does not simulate live transactional success", () => {
    expect(bookingSource).toContain("Continue with this organization");
    expect(bookingSource).toContain("date entered here is not held or saved");
    expect(bookingSource).toContain("no payment success is simulated");
    expect(bookingSource).toContain("No checkbox on this page creates a legal acceptance record");
    expect(bookingSource).toContain('disabled={!bookingActionIsAvailable("experiencePersistence")}');
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
    expect(organizationSource).toContain("window.print()");
    expect(organizationCss).toContain("@media print");
    expect(organizationSource).toContain("Each choice remains separate");
    expect(organizationSource).toContain("electronically, with assistance, or on paper");
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
