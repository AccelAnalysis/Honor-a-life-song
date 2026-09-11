import { Suspense } from "react";
import { WorkspaceRoute } from "@/components/workspace-route";
import { getWorkspaceStaticParams } from "@/lib/workspace-static-routes";

export function generateStaticParams() {
  return getWorkspaceStaticParams();
}

export default function WorkspacePage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening workspace…</p></section></main>}><WorkspaceRoute /></Suspense>;
}
