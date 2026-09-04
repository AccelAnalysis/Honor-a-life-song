import { Suspense } from "react";
import { PasswordRecoveryRoute } from "@/components/password-recovery-route";

export default function PasswordRecoveryPage() {
  return <Suspense fallback={<p role="status">Opening…</p>}><PasswordRecoveryRoute /></Suspense>;
}
