import { Suspense } from "react";
import { InvoiceSurface } from "@/components/invoice-surface";
export default function OrganizationInvoicesPage() {
  return <Suspense fallback={<p role="status">Opening invoices…</p>}><InvoiceSurface /></Suspense>;
}
