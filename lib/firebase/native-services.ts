import { httpsCallable } from "firebase/functions";
import { collection, collectionGroup, getDocs, type Timestamp } from "firebase/firestore";
import type { NativeInvoice } from "@/domain/invoice";
import { getFirebaseFunctions, getFirebaseFirestore } from "./client";

// Authentication comes from the Firebase ID token. Never accept an actor or administrator flag from a form.
export async function nativeAction<T = unknown>(action: string, input: object = {}): Promise<T> {
  const call = httpsCallable<object, T>(getFirebaseFunctions(), "songkeepBilling");
  try { return (await call(JSON.parse(JSON.stringify({ operation: action, ...input })))).data; }
  catch (error) { throw new Error(error instanceof Error ? error.message.replace(/^Firebase:\s*/, "") : "This action could not be completed. Please try again."); }
}
export const nativeCheckoutEnabled = process.env.NEXT_PUBLIC_NATIVE_CHECKOUT_ENABLED === "true";
export async function openInvoiceCheckout(organizationId: string, invoiceId: string, cancel = false) {
  const call = httpsCallable<object, { url?: string; paid?: boolean; cancelled?: boolean }>(getFirebaseFunctions(), "songkeepCheckout");
  return (await call({ organizationId, invoiceId, cancel })).data;
}
export function normalizeRecord(value: unknown): unknown {
  if (value && typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalizeRecord);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeRecord(item)]));
  return value;
}
export async function listNativeInvoices(organizationId?: string): Promise<NativeInvoice[]> {
  const db = getFirebaseFirestore();
  const result = await getDocs(organizationId ? collection(db, "organizations", organizationId, "invoices") : collectionGroup(db, "invoices"));
  return result.docs.map(item => ({ ...normalizeRecord(item.data()) as Omit<NativeInvoice, "id">, id: item.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function invoicePdf(organizationId: string, invoiceId: string): Promise<{ url: string; fileName: string }> {
  const result = await nativeAction<{pdfBase64: string; sha256: string; fileName: string}>("download", { organizationId, invoiceId });
  const bytes = Uint8Array.from(atob(result.pdfBase64), letter => letter.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  if (hash !== result.sha256) throw new Error("The document could not be verified. Please download it again.");
  return { url: URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })), fileName: result.fileName };
}
export async function authorizedMediaUrl(input: { organizationId: string; assetId: string; accessId?: string }): Promise<string> {
  const call = httpsCallable<object, { url: string }>(getFirebaseFunctions(), "songkeepMedia");
  return (await call(JSON.parse(JSON.stringify(input)))).data.url;
}

export async function openIndividualCheckout(requestId: string) {
  const call = httpsCallable<object, { url?: string; paid?: boolean }>(getFirebaseFunctions(), "songkeepIndividualCheckout");
  return (await call({ requestId })).data;
}
