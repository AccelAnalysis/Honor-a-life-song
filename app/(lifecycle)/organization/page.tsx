import type { Metadata } from "next";
import { Suspense } from "react";
import { OrganizationRelationship } from "@/components/organization-relationship";

export const metadata: Metadata = {
  title: "Organization | SongKeep",
  description: "Manage the ongoing SongKeep relationship for your organization."
};

export default function OrganizationRelationshipPage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening SongKeep…</p></main>}><OrganizationRelationship /></Suspense>;
}
