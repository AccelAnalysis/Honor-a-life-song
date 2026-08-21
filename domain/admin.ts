import type { ConsentScope } from "./consent";
import { projectAgelessJourney, songJourney, type ProgramJourneyState, type SongJourneyState } from "./workflows";

export type AdminProtectedAction = {
  authorized: boolean;
  requiredConsentScope?: ConsentScope;
  consentSatisfied?: boolean;
  requiresServerAuthority?: boolean;
  serverAuthorityConfirmed?: boolean;
};

export type AdminActionDecision = { allowed: boolean; reason?: string };

export function evaluateAdminProtectedAction(input: AdminProtectedAction): AdminActionDecision {
  if (!input.authorized) return { allowed: false, reason: "Admin role authorization is required." };
  if (input.requiredConsentScope && !input.consentSatisfied) {
    return { allowed: false, reason: `Consent scope ${input.requiredConsentScope} is required independently of Admin authorization.` };
  }
  if (input.requiresServerAuthority && !input.serverAuthorityConfirmed) {
    return { allowed: false, reason: "Authoritative server confirmation is required." };
  }
  return { allowed: true };
}

const activeSongStart = songJourney.indexOf("Qualified");
const activeSongEnd = songJourney.indexOf("Final Approval");

export function isActiveOrderJourneyState(state: SongJourneyState) {
  const index = songJourney.indexOf(state);
  return index >= activeSongStart && index <= activeSongEnd;
}

const activeProgramStart = projectAgelessJourney.indexOf("Contracted");
const activeProgramEnd = projectAgelessJourney.indexOf("Outcome Measurement");

export function isActiveProgramJourneyState(state: ProgramJourneyState) {
  const index = projectAgelessJourney.indexOf(state);
  return index >= activeProgramStart && index <= activeProgramEnd;
}

export function sponsorFundingGrantsParticipantAccess() {
  return false;
}

export function clientMayAssertPaymentSuccess() {
  return false;
}

export function clinicalOutcomeClaimsAreSupportedByProgramExperienceMetrics() {
  return false;
}

export function canGenerateSensitiveExport(input: { authorized: boolean; consentSatisfied: boolean }) {
  return input.authorized && input.consentSatisfied;
}
