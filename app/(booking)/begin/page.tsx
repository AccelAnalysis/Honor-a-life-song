import type { Metadata } from "next";
import { BookingRoute } from "@/components/booking-route";

export const metadata: Metadata = {
  title: "Begin Your Experience | Honor a Life Song",
  description: "Schedule, review, pay, and prepare for your Honor a Life Song experience."
};

export default function BeginBookingPage() {
  return <BookingRoute />;
}
