import type { Metadata } from "next";
import { Suspense } from "react";
import { OrganizationRelationship } from "@/components/organization-relationship";

export const metadata: Metadata = {
  title: "Organization Account | SongKeep",
  description: "Review organization contacts, purchasing records, agreements, and billing."
};

export default function OrganizationAccountPage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening account…</p></main>}><OrganizationRelationship view="account" /></Suspense>;
}
