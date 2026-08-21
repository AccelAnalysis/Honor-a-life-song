import type { SongJourneyState } from "@/domain/workflows";
import type { WorkspaceId } from "@/lib/navigation";

export const referenceContext: Record<WorkspaceId, { label: string; value: string }> = {
  customer: { label: "Reference journey", value: "Sample family song" },
  facility: { label: "Reference program", value: "Sample Project Ageless run" },
  creator: { label: "Reference assignment", value: "Sample creative work" },
  admin: { label: "Environment", value: "Chassis reference mode" }
};

export const referenceCustomerContext: {
  orderId: string;
  creativeWorkId: string;
  journeyState: SongJourneyState;
} = {
  orderId: "reference-order-001",
  creativeWorkId: "reference-work-001",
  journeyState: "Customer Review"
};
