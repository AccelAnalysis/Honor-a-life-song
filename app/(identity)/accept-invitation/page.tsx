import { Suspense } from "react";
import { AcceptInvitationRoute } from "@/components/accept-invitation-route";

export default function AcceptInvitationPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening invitation…</p></section></main>}><AcceptInvitationRoute /></Suspense>;
}
