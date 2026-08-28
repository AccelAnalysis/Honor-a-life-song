import { Suspense } from "react";
import { LoginRoute } from "@/components/login-route";
import { loginWorkflowNodes } from "@/lib/identity-navigation";

export function generateStaticParams() {
  return loginWorkflowNodes.map((node) => ({ step: node.slug.split("/") }));
}

export default function LoginWorkflowPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening sign in…</p></section></main>}><LoginRoute /></Suspense>;
}
