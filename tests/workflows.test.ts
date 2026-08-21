import { describe, expect, it } from "vitest";
import { canTransition, projectAgelessTransitions, songTransitions } from "../domain/workflows";
import { consentAllows, type ConsentRecord } from "../domain/consent";

describe("workflow contracts", () => {
  it("permits governed adjacent song transitions", () => {
    expect(canTransition(songTransitions, "Story Capture", "Story Development")).toBe(true);
    expect(canTransition(songTransitions, "Story Capture", "Delivered")).toBe(false);
  });

  it("preserves Project Ageless program ordering", () => {
    expect(canTransition(projectAgelessTransitions, "Event Readiness", "Concert")).toBe(true);
  });
});

describe("consent contract", () => {
  it("requires both active state and explicit scope", () => {
    const record: ConsentRecord = { id: "consent-1", subjectPersonId: "person-1", grantedByPersonId: "person-1", authorityBasis: "self", state: "active", scopes: ["internal_creative_use"], restrictions: [], version: 1 };
    expect(consentAllows(record, "internal_creative_use").allowed).toBe(true);
    expect(consentAllows(record, "public_marketing").allowed).toBe(false);
  });
});
