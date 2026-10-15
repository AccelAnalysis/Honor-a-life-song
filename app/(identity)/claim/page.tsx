import type { Metadata } from "next";
import { Suspense } from "react";
import { ExperienceAccessClaim } from "@/components/experience-access-claim";

export const metadata: Metadata = {
  title: "Private experience access | SongKeep",
  robots: { index: false, follow: false, nocache: true }
};

export default function ClaimPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening invitation…</p></section></main>}><ExperienceAccessClaim /></Suspense>;
}
