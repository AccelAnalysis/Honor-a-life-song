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
const bookingCss = readFileSync(resolve(process.cwd(), "components/booking-route.module.css"), "utf8");

describe("post-engagement catalog", () => {
  it("locks the two current customer prices", () => {
    expect(serviceOfferings).toEqual([
      expect.objectContaining({ id: "individual-legacy-song", priceCents: 20_000 }),
      expect.objectContaining({ id: "complete-honor-a-life-song-experience", priceCents: 250_000 })
    ]);
    expect(formatOfferingPrice(20_000)).toBe("$200");
    expect(formatOfferingPrice(250_000)).toBe("$2,500");
  });

  it("uses the customer journey in the intended order", () => {
    expect(bookingSteps).toEqual([
      "welcome",
      "account",
      "schedule",
      "agreement",
      "payment",
      "participants",
      "permissions",
      "ready"
    ]);
  });
});

describe("booking truthfulness", () => {
  it("uses connected Firebase identity while failing closed for unconnected services", () => {
    expect(bookingActionIsAvailable("identity")).toBe(true);
    expect(bookingActionIsAvailable("invitationResolution")).toBe(true);
    expect(bookingActionIsAvailable("scheduling")).toBe(false);
    expect(bookingActionIsAvailable("agreementPersistence")).toBe(false);
    expect(bookingActionIsAvailable("payments")).toBe(false);
    expect(bookingActionIsAvailable("consentPersistence")).toBe(false);
  });

  it("does not simulate live transactional success", () => {
    expect(bookingSource).toContain("Continue with this account");
    expect(bookingSource).toContain("date entered here is not held or saved");
    expect(bookingSource).toContain("no payment success is simulated");
    expect(bookingSource).toContain("No checkbox on this page creates a legal acceptance record");
    expect(bookingSource).toContain("Nothing entered on this page is saved yet");
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
    expect(bookingSource).toContain("window.print()");
    expect(bookingCss).toContain("@media print");
    expect(bookingSource).toContain("same permission choices");
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
