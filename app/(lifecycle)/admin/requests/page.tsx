import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin-access-gate";
import { AdminLifecycleSurface } from "@/components/admin-lifecycle-surface";

export const metadata: Metadata = { title: "SongKeep Requests" };

export default function AdminLifecyclePage() {
  return <AdminAccessGate><AdminLifecycleSurface area="requests" /></AdminAccessGate>;
}
