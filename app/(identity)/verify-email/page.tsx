import { Suspense } from "react";
import { VerifyEmailRoute } from "@/components/verify-email-route";

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening verification…</p></section></main>}><VerifyEmailRoute /></Suspense>;
}
