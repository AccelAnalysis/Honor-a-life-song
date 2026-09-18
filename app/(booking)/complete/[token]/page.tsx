import type { Metadata } from "next";
import { PreparedBookingRoute } from "@/components/prepared-booking-route";

export const metadata: Metadata = {
  title: "Complete your SongKeep booking",
  description: "Review and complete the SongKeep experience prepared for your organization."
};

export default function CompletePreparedBookingPage({ params }: { params: { token: string } }) {
  return <PreparedBookingRoute token={params.token} />;
}
