import type { SongJourneyState } from "@/domain/workflows";
import type { AdminRecordKind } from "@/lib/admin-navigation";
import type { WorkspaceId } from "@/lib/navigation";

export const referenceContext: Record<WorkspaceId, { label: string; value: string }> = {
  customer: { label: "Reference journey", value: "Sample family song" },
  facility: { label: "Reference program", value: "Sample Project Ageless run" },
  creator: { label: "Reference assignment", value: "Sample creative work" },
  admin: { label: "Environment", value: "Chassis reference mode" }
};

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
