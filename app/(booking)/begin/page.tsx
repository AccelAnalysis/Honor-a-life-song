import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingRoute } from "@/components/booking-route";

export const metadata: Metadata = {
  title: "Begin your experience | SongKeep",
  description: "Schedule, review, pay, and prepare for your SongKeep experience."
};

export default function BeginBookingPage() {
  return <Suspense fallback={<main className="centeredPage"><section className="authCard"><p>Opening your experience…</p></section></main>}><BookingRoute /></Suspense>;
}
