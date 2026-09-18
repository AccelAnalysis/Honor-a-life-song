import type { Metadata } from "next";
import { AdminAccessGate } from "@/components/admin-access-gate";
import { PreparedBookingAdmin } from "@/components/prepared-booking-admin";

export const metadata: Metadata = { title: "Prepared Bookings | SongKeep" };

export default function PreparedBookingsPage() {
  return <AdminAccessGate previewAllowed><PreparedBookingAdmin /></AdminAccessGate>;
}
