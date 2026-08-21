import { describe, expect, it } from "vitest";
import {
  canTransition,
  projectAgelessJourney,
  projectAgelessTransitions,
  songTransitions
} from "../domain/workflows";
import { consentAllows, type ConsentRecord } from "../domain/consent";

describe("workflow contracts", () => {
  it("permits governed adjacent song transitions", () => {
    expect(canTransition(songTransitions, "Story Capture", "Story Development")).toBe(true);
    expect(canTransition(songTransitions, "Story Capture", "Delivered")).toBe(false);
  });

  it("preserves the source-defined Project Ageless program lifecycle", () => {
    expect(projectAgelessJourney).toEqual([
      "Lead",
      "Consultation",
      "Scope & Funding",
      "Contracted",
      "Facility Onboarding",
      "Participant Enrollment",
      "Consent Readiness",
      "Active Program Touches",
      "Story and Song Development",
      "Event Readiness",
      "Concert / Presentation",
      "Keepsake Delivery",
      "Outcome Measurement",
      "Program Closeout"
    ]);
    expect(canTransition(projectAgelessTransitions, "Event Readiness", "Concert / Presentation")).toBe(true);
    expect(canTransition(projectAgelessTransitions, "Participant Enrollment", "Concert / Presentation")).toBe(false);
  });
});

describe("consent contract", () => {
  it("requires both active state and explicit scope", () => {
    const record: ConsentRecord = {
      id: "consent-1",
      subjectPersonId: "person-1",
      grantedByPersonId: "person-1",
      authorityBasis: "self",
      state: "active",
      scopes: ["internal_creative_use"],
      restrictions: [],
      version: 1
    };
    expect(consentAllows(record, "internal_creative_use").allowed).toBe(true);
    expect(consentAllows(record, "public_marketing").allowed).toBe(false);
  });

  it("fails closed when active consent carries unresolved restrictions", () => {
    const record: ConsentRecord = {
      id: "consent-restricted",
      subjectPersonId: "person-1",
      grantedByPersonId: "representative-1",
      authorityBasis: "authorized_representative",
      state: "active_with_restrictions",
      scopes: ["event_photo_video"],
      restrictions: ["Private family use only"],
      version: 2
    };
    expect(consentAllows(record, "event_photo_video").allowed).toBe(false);
  });
});
