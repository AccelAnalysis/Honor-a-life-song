import type { Metadata } from "next";
import { Suspense } from "react";
import { ParticipantPermissionRoute } from "@/components/participant-permission-route";

export const metadata: Metadata = {
  title: "Participant Permissions | SongKeep",
  description: "Review and submit your individual choices for a SongKeep experience."
};

export default function ParticipatePage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening invitation…</p></main>}><ParticipantPermissionRoute /></Suspense>;
}
