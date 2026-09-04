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
const permissionSource = readFileSync(resolve(process.cwd(), "components/participant-permission-route.tsx"), "utf8");
const organizationCss = readFileSync(resolve(process.cwd(), "components/organization-relationship.module.css"), "utf8");

describe("organization experience catalog", () => {
  it("locks the three organization prices and distinct outputs", () => {
    expect(serviceOfferings).toEqual([
      expect.objectContaining({ id: "single-song-group-event", priceCents: 20_000, buyer: "organization", creativeOutput: "One shared song" }),
      expect.objectContaining({ id: "honor-a-life-song-experience", priceCents: 250_000, buyer: "organization", creativeOutput: "Up to 6 songs" }),
      expect.objectContaining({ id: "songkeep-legacy-album", priceCents: 600_000, buyer: "organization", creativeOutput: "Up to 10 songs" })
    ]);
    expect(formatOfferingPrice(20_000)).toBe("$200");
    expect(formatOfferingPrice(250_000)).toBe("$2,500");
    expect(formatOfferingPrice(600_000)).toBe("$6,000");
  });

  it("uses a focused customer sequence without exposing pipeline stages", () => {
    expect(bookingSteps).toEqual(["experience", "organization", "plan", "payment", "ready"]);
    expect(bookingSource).not.toContain("Stage 1");
    expect(bookingSource).not.toContain("Stage 7");
  });
});

describe("booking truthfulness", () => {
  it("uses connected account/request boundaries while leaving provider delivery separate", () => {
    expect(bookingActionIsAvailable("identity")).toBe(true);
    expect(bookingActionIsAvailable("accountPersistence")).toBe(true);
    expect(bookingActionIsAvailable("requestPersistence")).toBe(true);
    expect(bookingActionIsAvailable("invoiceRequests")).toBe(true);
    expect(bookingActionIsAvailable("authoritativePaymentConfirmation")).toBe(false);
    expect(bookingActionIsAvailable("notifications")).toBe(false);
  });

  it("does not simulate paid status or a confirmed schedule", () => {
    expect(bookingSource).toContain("We’ll confirm your date and time with you.");
    expect(bookingSource).toContain("createOrganizationExperienceRequest");
    expect(bookingSource).toContain("if (!accountReady || !user");
    expect(bookingSource).not.toContain("staticPreview");
    expect(bookingSource).not.toContain("preview-only");
    expect(bookingSource).not.toContain("Payment successful");
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

  it("supports verified digital, assisted, and printable paths without one universal checkbox", () => {
    expect(permissionSource).toContain("participantPermissionScopes.map");
    expect(permissionSource).toContain("window.print()");
    expect(permissionSource).toContain("Organization agreements do not decide this for you.");
    expect(permissionSource).not.toContain("I agree to all");
    expect(organizationCss).toContain("@media print");
  });
});

describe("Apple-style interaction baseline", () => {
  it("provides visible focus, reduced motion, and large controls", () => {
    const bookingCss = readFileSync(resolve(process.cwd(), "components/booking-route.module.css"), "utf8");
    expect(bookingCss).toContain("min-height: 52px");
    expect(bookingCss).toContain(":focus-visible");
    expect(bookingCss).toContain("prefers-reduced-motion");
  });
});
