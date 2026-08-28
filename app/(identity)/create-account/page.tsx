import { Suspense } from "react";
import { CreateAccountRoute } from "@/components/create-account-route";

export default function CreateAccountPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening account setup…</p></section></main>}><CreateAccountRoute /></Suspense>;
}
