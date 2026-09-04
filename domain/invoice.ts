export type InvoiceStatus = "draft" | "issued" | "sent" | "viewed" | "partially_paid" | "paid" | "overdue" | "void" | "uncollectible" | "refunded";
export interface BillingProfile { name: string; contactName: string; email: string; address: string; purchaseOrder: string }
export interface InvoiceSettings {
  legalName: string; dba: string; address: string; email: string; phone: string;
  paymentInstructions: string; terms: string; dueDays: number; taxBasisPoints: number;
  taxReviewed: boolean; taxNote: string; autoIssue: boolean; appUrl: string;
}
export interface NativeInvoice {
  id: string; organizationId: string; requestId: string; orderId: string; offeringId: string;
  invoiceNumber: string | null; status: InvoiceStatus; createdAt: string;
  amountPaidCents: number; amountDueCents: number; amountRefundedCents: number;
  experienceId?: string; pdfHash?: string; pdfVersion?: number; pdfGeneratedAt?: string;
  sentAt?: string; viewedAt?: string; paidAt?: string; preparationNotice?: string;
  checkout?: { status: string; sessionId?: string } | null;
  commercial: null | {
    version: number; seller: Pick<InvoiceSettings, "legalName" | "dba" | "address" | "email" | "phone">;
    buyer: BillingProfile; lineItems: Array<{quantity: number; description: string; amountCents: number}>;
    subtotalCents: number; discountCents: number; taxCents: number; totalCents: number;
    issuedAt: string; dueAt: string; serviceDate?: string; location?: string;
    paymentTerms: string; paymentInstructions: string; terms: string; taxNote: string; accountUrl: string;
  };
}
export const invoiceLabels: Record<InvoiceStatus, string> = {
  draft: "Being prepared", issued: "Awaiting payment", sent: "Sent · awaiting payment", viewed: "Viewed · awaiting payment",
  partially_paid: "Partially paid", paid: "Paid", overdue: "Past due", void: "Void", uncollectible: "Closed · uncollectible", refunded: "Refunded"
};
export function displayInvoiceStatus(invoice: NativeInvoice, now = new Date()): InvoiceStatus {
  if (!invoice.commercial || ["draft", "void", "uncollectible", "refunded"].includes(invoice.status)) return invoice.status;
  if (invoice.amountPaidCents >= invoice.commercial.totalCents) return "paid";
  if (new Date(invoice.commercial.dueAt) < now) return "overdue";
  if (invoice.amountPaidCents > 0) return "partially_paid";
  return invoice.viewedAt ? "viewed" : invoice.sentAt ? "sent" : "issued";
}
export const invoiceMoney = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
