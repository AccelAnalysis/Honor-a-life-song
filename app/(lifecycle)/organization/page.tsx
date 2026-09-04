import type { Metadata } from "next";
import { Suspense } from "react";
import { OrganizationRelationship } from "@/components/organization-relationship";

export const metadata: Metadata = {
  title: "Organization | SongKeep",
  description: "Your SongKeep events, songs, invoices, and team."
};

export default function OrganizationRelationshipPage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening SongKeep…</p></main>}><OrganizationRelationship /></Suspense>;
}
