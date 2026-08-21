import type { Participant, ProgramRun } from "@/domain/types";
import type { ProgramJourneyState, SongJourneyState } from "@/domain/workflows";
import type { AdminRecordKind } from "@/lib/admin-navigation";
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

export const referenceCreatorContext = {
  creativeWorkId: "reference-creative-work"
} as const;

export const referenceCustomerContext: {
  orderId: string;
  creativeWorkId: string;
  journeyState: SongJourneyState;
} = {
  orderId: "reference-order-001",
  creativeWorkId: "reference-work-001",
  journeyState: "Customer Review"
};

export const referenceAdminRecordIds: Record<AdminRecordKind, string> = {
  inquiry: "ref-inquiry-001",
  order: "ref-order-001",
  program: "ref-program-001",
  person: "ref-person-001",
  organization: "ref-organization-001",
  package: "ref-package-001",
  program_template: "ref-program-template-001",
  commercial: "ref-commercial-001",
  funding: "ref-funding-001",
  schedule: "ref-schedule-001",
  communication: "ref-communication-001",
  consent: "ref-consent-001",
  audit: "ref-audit-001",
  configuration: "ref-configuration-001"
};
