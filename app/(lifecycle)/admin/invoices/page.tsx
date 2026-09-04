import { Suspense } from "react";
import { AdminAccessGate } from "@/components/admin-access-gate";
import { InvoiceSurface } from "@/components/invoice-surface";
export default function AdminInvoicesPage() {
  return <AdminAccessGate><Suspense fallback={<p role="status">Opening invoices…</p>}><InvoiceSurface admin /></Suspense></AdminAccessGate>;
}
