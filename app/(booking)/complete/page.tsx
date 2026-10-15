import type { Metadata } from "next";
import { Suspense } from "react";
import { PreparedBookingRoute } from "@/components/prepared-booking-route";

export const metadata: Metadata = {
  title: "Complete your SongKeep booking",
  description: "Review and complete the SongKeep experience prepared for your organization."
};

export default function CompletePreparedBookingPage() {
  return <Suspense fallback={<main className="centeredPage"><p>Opening your booking…</p></main>}><PreparedBookingRoute /></Suspense>;
}
