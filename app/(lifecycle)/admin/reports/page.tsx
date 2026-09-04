import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin-access-gate";
import { AdminLifecycleSurface } from "@/components/admin-lifecycle-surface";

export const metadata: Metadata = { title: "SongKeep Customer Lifecycle | Operations" };

export default function AdminLifecyclePage() {
  return <AdminAccessGate><AdminLifecycleSurface area="reports" /></AdminAccessGate>;
}
