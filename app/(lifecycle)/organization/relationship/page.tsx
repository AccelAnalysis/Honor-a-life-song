import { Suspense } from "react";
import { OrganizationRelationship } from "@/components/organization-relationship";

export default function OrganizationRelationshipAliasPage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening your account…</p></main>}><OrganizationRelationship /></Suspense>;
}
