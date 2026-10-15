import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const customer = readFileSync(resolve(process.cwd(), "components/prepared-booking-route.tsx"), "utf8");
const customerCss = readFileSync(resolve(process.cwd(), "components/prepared-booking-route.module.css"), "utf8");
const admin = readFileSync(resolve(process.cwd(), "components/prepared-booking-admin.tsx"), "utf8");
const backend = readFileSync(resolve(process.cwd(), "functions/prepared-booking.js"), "utf8");
const adapter = readFileSync(resolve(process.cwd(), "lib/firebase/prepared-booking.ts"), "utf8");
const adminGate = readFileSync(resolve(process.cwd(), "components/admin-access-gate.tsx"), "utf8");

describe("prepared booking sales handoff", () => {
  it("starts from the prepared experience instead of making the customer shop again", () => {
    expect(customer).toContain("Your SongKeep experience is ready.");
    expect(customer).toContain("Does this look right?");
    expect(customer).not.toContain("Choose your experience");
    expect(customer).not.toContain("Compare experiences");
  });

  it("keeps the customer sequence task focused", () => {
    expect(customer).toContain('type Screen = "offer" | "account" | "confirm" | "agreement" | "payment" | "done" | "change"');
    expect(customer).toContain("Everything looks right");
    expect(customer).toContain("Invoice my organization");
    expect(customer).toContain("Continue to secure payment");
    expect(customer).not.toContain("pipeline");
    expect(customer).not.toContain("CRM");
  });

  it("uses Apple-style touch targets, focus treatment and reduced motion", () => {
    expect(customerCss).toContain("min-height: 50px");
    expect(customerCss).toContain(":focus-visible");
    expect(customerCss).toContain("prefers-reduced-motion");
    expect(customerCss).toContain("max-width: 12ch");
  });

  it("lets staff prepare and revise the handoff without browser-controlled pricing", () => {
    expect(admin).toContain("Create secure booking link");
    expect(admin).toContain("Revise booking");
    expect(backend).toContain("amountCents:offering.priceCents");
    expect(backend).toContain("currentVersion:version");
    expect(backend).toContain("tokenHash:sha256(rawToken)");
  });


  it("provides a browser-local bypass for the static PR preview without weakening production auth", () => {
    expect(adapter).toContain("isStaticPreview");
    expect(adapter).toContain("localStorage");
    expect(adapter).toContain("preview-songkeep-booking");
    expect(adminGate).toContain("previewAllowed && isStaticPreview");
    expect(customer).toContain("Continue with preview account");
    expect(customer).toContain("Preview · Complete booking");
  });

  it("binds acceptance to the prepared version before using native billing", () => {
    expect(backend).toContain("commercialSnapshotHash");
    expect(backend).toContain("billing.createRequest");
    expect(backend).toContain("billing.issue");
    expect(backend).toContain("activateApprovedReceivable");
  });
});
