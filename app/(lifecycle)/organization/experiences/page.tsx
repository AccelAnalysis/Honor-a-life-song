import { Suspense } from "react";
import { OrganizationRelationship } from "@/components/organization-relationship";
export default function ExperiencesPage() { return <Suspense fallback={<main><p role="status">Opening your events…</p></main>}><OrganizationRelationship view="experiences" /></Suspense>; }
