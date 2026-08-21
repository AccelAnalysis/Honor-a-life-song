import type { Participant, ProgramRun } from "@/domain/types";
import type { ProgramJourneyState } from "@/domain/workflows";
import type { WorkspaceId } from "@/lib/navigation";

export const referenceProgramRun: ProgramRun & { status: ProgramJourneyState } = {
  id: "reference-project-ageless-run",
  templateId: "reference-project-ageless-template",
  organizationId: "reference-facility",
  status: "Facility Onboarding",
  startsOn: "2026-09-14",
  endsOn: "2026-10-09"
};

export const referenceParticipant: Participant = {
  id: "reference-participant",
  programRunId: referenceProgramRun.id,
  personId: "reference-person",
  participationStatus: "enrolled"
};

export const referenceFacilityContext = {
  label: "Reference program",
  value: "Sample Project Ageless run",
  programRunId: referenceProgramRun.id,
  participantId: referenceParticipant.id,
  participantLabel: "Reference participant"
};

export const referenceContext = {
  customer: { label: "Reference journey", value: "Sample family song" },
  facility: referenceFacilityContext,
  creator: { label: "Reference assignment", value: "Sample creative work" },
  admin: { label: "Environment", value: "Chassis reference mode" }
} satisfies Record<WorkspaceId, { label: string; value: string }>;
