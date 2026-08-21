import type { EntityId, Participation } from "./types";

export function getParticipantParticipations(records: readonly Participation[], participantId: EntityId) {
  return records.filter((record) => record.participantId === participantId);
}

export function hasAttendedAtLeastOneTouchpoint(records: readonly Participation[], participantId: EntityId) {
  return records.some((record) => record.participantId === participantId && record.attendance === "attended");
}
