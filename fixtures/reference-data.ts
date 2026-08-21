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
