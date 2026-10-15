import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeRoute } from "@/components/unsubscribe-route";

export const metadata: Metadata = {
  title: "Unsubscribe | SongKeep",
  robots: { index: false, follow: false, nocache: true }
};

export default function UnsubscribePage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening unsubscribe…</p></section></main>}><UnsubscribeRoute /></Suspense>;
}
