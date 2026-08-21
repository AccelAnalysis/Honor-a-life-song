export const songJourney = ["Inquiry", "Request", "Qualified", "Awaiting Payment", "Interview Scheduling", "Story Capture", "Story Development", "Lyric Development", "Customer Review", "Approved for Production", "Production", "Quality Review", "Final Approval", "Delivered", "Closed"] as const;
export type SongJourneyState = (typeof songJourney)[number];

export const projectAgelessJourney = ["Lead", "Consultation", "Scope & Funding", "Contracted", "Facility Onboarding", "Participant Enrollment", "Consent Readiness", "Active Program", "Song Development", "Event Readiness", "Concert", "Keepsake Delivery", "Outcome Measurement", "Closeout"] as const;
export type ProgramJourneyState = (typeof projectAgelessJourney)[number];

function adjacentTransitions<T extends readonly string[]>(states: T) {
  return Object.fromEntries(states.map((state, index) => [state, index < states.length - 1 ? [states[index + 1]] : []])) as Record<T[number], T[number][]>;
}

export const songTransitions = adjacentTransitions(songJourney);
export const projectAgelessTransitions = adjacentTransitions(projectAgelessJourney);

export function canTransition<T extends string>(map: Record<T, T[]>, from: T, to: T) {
  return map[from].includes(to);
}

const creatorProductionEligibleStates: readonly SongJourneyState[] = ["Approved for Production", "Production", "Quality Review", "Final Approval"];

export function creatorProductionEligible(state: SongJourneyState) {
  return creatorProductionEligibleStates.includes(state);
}
