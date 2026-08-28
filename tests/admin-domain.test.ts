import { describe, expect, it } from "vitest";
import {
  canGenerateSensitiveExport,
  clientMayAssertPaymentSuccess,
  clinicalOutcomeClaimsAreSupportedByProgramExperienceMetrics,
  evaluateAdminProtectedAction,
  isActiveOrderJourneyState,
  isActiveProgramJourneyState,
  sponsorFundingGrantsParticipantAccess
} from "../domain/admin";

describe("Admin workflow authority", () => {
  it("keeps Admin authorization separate from consent", () => {
    expect(evaluateAdminProtectedAction({
      authorized: true,
      requiredConsentScope: "public_marketing",
      consentSatisfied: false
    }).allowed).toBe(false);

    expect(evaluateAdminProtectedAction({
      authorized: true,
      requiredConsentScope: "public_marketing",
      consentSatisfied: true
    }).allowed).toBe(true);
  });

  it("requires server authority for protected financial or workflow state", () => {
    expect(evaluateAdminProtectedAction({
      authorized: true,
      requiresServerAuthority: true,
      serverAuthorityConfirmed: false
    }).allowed).toBe(false);
    expect(clientMayAssertPaymentSuccess()).toBe(false);
  });

  it("does not grant participant access from sponsorship alone", () => {
    expect(sponsorFundingGrantsParticipantAccess()).toBe(false);
  });
});

describe("Admin operational derivation", () => {
  it("derives active organization order work from the governed journey range", () => {
    expect(isActiveOrderJourneyState("Qualified")).toBe(true);
    expect(isActiveOrderJourneyState("Production")).toBe(true);
    expect(isActiveOrderJourneyState("Final Approval")).toBe(true);
    expect(isActiveOrderJourneyState("Inquiry")).toBe(false);
    expect(isActiveOrderJourneyState("Delivered")).toBe(false);
    expect(isActiveOrderJourneyState("Closed")).toBe(false);
  });

  it("derives active programs from contracted through outcome measurement", () => {
    expect(isActiveProgramJourneyState("Contracted")).toBe(true);
    expect(isActiveProgramJourneyState("Active Program Touches")).toBe(true);
    expect(isActiveProgramJourneyState("Outcome Measurement")).toBe(true);
    expect(isActiveProgramJourneyState("Lead")).toBe(false);
    expect(isActiveProgramJourneyState("Program Closeout")).toBe(false);
  });
});

describe("Admin reporting and exports", () => {
  it("does not infer clinical outcomes from Project Ageless experience measures", () => {
    expect(clinicalOutcomeClaimsAreSupportedByProgramExperienceMetrics()).toBe(false);
  });

  it("requires both authorization and consent for sensitive exports", () => {
    expect(canGenerateSensitiveExport({ authorized: true, consentSatisfied: false })).toBe(false);
    expect(canGenerateSensitiveExport({ authorized: false, consentSatisfied: true })).toBe(false);
    expect(canGenerateSensitiveExport({ authorized: true, consentSatisfied: true })).toBe(true);
  });
});
