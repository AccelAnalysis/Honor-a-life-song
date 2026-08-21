import { describe, expect, it } from "vitest";
import {
  authorizationAndConsentAllow,
  consentAllows,
  type AuthorizationDecision,
  type ConsentRecord
} from "../domain/consent";
import { getParticipantParticipations, hasAttendedAtLeastOneTouchpoint } from "../domain/programs";
import type { Participation } from "../domain/types";

const participationRecords: Participation[] = [
  { id: "p-1-t-1", participantId: "participant-1", touchpointId: "touchpoint-1", attendance: "attended" },
  { id: "p-1-t-2", participantId: "participant-1", touchpointId: "touchpoint-2", attendance: "declined" },
  { id: "p-2-t-1", participantId: "participant-2", touchpointId: "touchpoint-1", attendance: "missed" }
];

function consent(state: ConsentRecord["state"], scopes: ConsentRecord["scopes"]): ConsentRecord {
  return {
    id: `consent-${state}`,
    subjectPersonId: "person-1",
    grantedByPersonId: "person-1",
    authorityBasis: "self",
    state,
    scopes,
    restrictions: state === "active_with_restrictions" ? ["manual review required"] : [],
    version: 1
  };
}

describe("Project Ageless flexible participation", () => {
  it("models attendance independently at the participant/touchpoint intersection", () => {
    expect(getParticipantParticipations(participationRecords, "participant-1")).toEqual([
      participationRecords[0],
      participationRecords[1]
    ]);
    expect(hasAttendedAtLeastOneTouchpoint(participationRecords, "participant-1")).toBe(true);
    expect(hasAttendedAtLeastOneTouchpoint(participationRecords, "participant-2")).toBe(false);
  });

  it("does not require a Participation record for every participant/touchpoint combination", () => {
    expect(getParticipantParticipations(participationRecords, "participant-2")).toHaveLength(1);
    expect(getParticipantParticipations(participationRecords, "participant-3")).toEqual([]);
  });
});

describe("Facility authorization and consent", () => {
  const authorized: AuthorizationDecision = { allowed: true };
  const denied: AuthorizationDecision = { allowed: false, reason: "Outside authorized ProgramRun." };

  it("requires authorization and the exact active consent scope", () => {
    const record = consent("active", ["event_photo_video"]);
    expect(authorizationAndConsentAllow(authorized, record, "event_photo_video").allowed).toBe(true);
    expect(authorizationAndConsentAllow(denied, record, "event_photo_video")).toEqual({
      allowed: false,
      reason: "Outside authorized ProgramRun."
    });
    expect(authorizationAndConsentAllow(authorized, record, "public_marketing").allowed).toBe(false);
  });

  it("fails closed when consent is restricted, withdrawn, expired, superseded, pending, or absent", () => {
    for (const state of ["active_with_restrictions", "withdrawn", "expired", "superseded", "pending"] as const) {
      expect(consentAllows(consent(state, ["sponsor_acknowledgment"]), "sponsor_acknowledgment").allowed).toBe(false);
    }
    expect(consentAllows(undefined, "sponsor_acknowledgment").allowed).toBe(false);
  });
});
