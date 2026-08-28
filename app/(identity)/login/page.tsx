import { Suspense } from "react";
import { LoginRoute } from "@/components/login-route";

export default function LoginPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening sign in…</p></section></main>}><LoginRoute /></Suspense>;
}
