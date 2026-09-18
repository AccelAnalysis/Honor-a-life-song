import { httpsCallable } from "firebase/functions";
import type {
  PreparedBookingCreateInput,
  PreparedBookingCustomerView
} from "@/domain/customer-lifecycle";
import { getExperienceOffering } from "@/domain/experience";
import { getFirebaseFunctions } from "./client";
import { isStaticPreview } from "@/lib/preview-mode";

type PreparedBookingOperation =
  | "create"
  | "list"
  | "resolve"
  | "claim"
  | "sign"
  | "requestChange"
  | "revise"
  | "rotate"
  | "revoke"
  | "complete";

type PreviewRecord = { token: string; booking: PreparedBookingCustomerView };
const previewKey = "songkeep-preview-prepared-bookings-v1";
const previewToken = "preview-songkeep-booking";

function iso(offsetDays = 0, hour = 14) {
  const date = new Date("2026-10-23T14:00:00-04:00");
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function defaultPreviewRecord(): PreviewRecord {
  return {
    token: previewToken,
    booking: {
      id: "preview-booking",
      status: "ready",
      organizationName: "Harbor View Senior Living",
      organizationKind: "facility",
      recipientName: "Mary Jones",
      recipientEmail: "mary@example.com",
      recipientTitle: "Executive Director",
      recipientPhone: "(757) 555-0142",
      offeringId: "honor-a-life-song-experience",
      offeringName: "Honor a Life Song Experience",
      amountCents: 250_000,
      scope: "Participant interviews and family contributions, up to 6 original songs, and a follow-up concert.",
      preferredStartsAt: iso(),
      dateStatus: "held",
      holdExpiresAt: iso(-7, 23),
      venue: "Harbor View Senior Living",
      participantEstimate: 12,
      organizationGoal: "Celebrate residents and involve their families.",
      paymentOptions: ["card", "invoice"],
      invoiceActivationPolicy: "payment_required",
      agreementVersion: "organization-service-v1",
      currentVersion: 1,
      tokenExpiresAt: iso(14, 23)
    }
  };
}

function loadPreviewRecords(): PreviewRecord[] {
  if (typeof window === "undefined") return [defaultPreviewRecord()];
  try {
    const raw = window.localStorage.getItem(previewKey);
    if (!raw) {
      const seeded = [defaultPreviewRecord()];
      window.localStorage.setItem(previewKey, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as PreviewRecord[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // Preview state is disposable; fall back to the seeded example.
  }
  return [defaultPreviewRecord()];
}

function savePreviewRecords(records: PreviewRecord[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(previewKey, JSON.stringify(records));
}

function previewRecordByToken(token: string): PreviewRecord {
  const records = loadPreviewRecords();
  const record = records.find(item => item.token === token) ?? (token === previewToken ? defaultPreviewRecord() : undefined);
  if (!record) throw new Error("This preview booking link is no longer available.");
  return record;
}

function previewUpdateByToken(token: string, update: (booking: PreparedBookingCustomerView) => PreparedBookingCustomerView): PreparedBookingCustomerView {
  const records = loadPreviewRecords();
  const index = records.findIndex(item => item.token === token);
  if (index < 0) {
    const seed = token === previewToken ? defaultPreviewRecord() : undefined;
    if (!seed) throw new Error("This preview booking link is no longer available.");
    records.push(seed);
  }
  const target = records.findIndex(item => item.token === token);
  records[target] = { ...records[target], booking: update(records[target].booking) };
  savePreviewRecords(records);
  return records[target].booking;
}

function previewUpdateById(bookingId: string, update: (record: PreviewRecord) => PreviewRecord): PreviewRecord {
  const records = loadPreviewRecords();
  const index = records.findIndex(item => item.booking.id === bookingId);
  if (index < 0) throw new Error("Preview booking not found.");
  records[index] = update(records[index]);
  savePreviewRecords(records);
  return records[index];
}

function makePreviewToken() {
  return `preview-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(36)}`;
}

async function callPrepared<T>(operation: PreparedBookingOperation, input: object = {}): Promise<T> {
  const call = httpsCallable<object, T>(getFirebaseFunctions(), "songkeepPreparedBooking");
  const result = await call({ operation, ...input });
  return result.data;
}

export type PreparedBookingCreated = PreparedBookingCustomerView & {
  token: string;
  completionPath: string;
};

export async function createPreparedBooking(input: PreparedBookingCreateInput): Promise<PreparedBookingCreated> {
  if (isStaticPreview) {
    const offering = getExperienceOffering(input.offeringId);
    if (!offering) throw new Error("Choose an available SongKeep experience.");
    const token = makePreviewToken();
    const booking: PreparedBookingCustomerView = {
      id: `preview-${Date.now().toString(36)}`,
      status: "ready",
      organizationName: input.organizationName,
      organizationKind: input.organizationKind,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail.toLowerCase(),
      recipientTitle: input.recipientTitle,
      recipientPhone: input.recipientPhone,
      offeringId: input.offeringId,
      offeringName: offering.name,
      amountCents: offering.priceCents,
      scope: offering.description,
      preferredStartsAt: input.preferredStartsAt,
      dateStatus: input.dateStatus,
      holdExpiresAt: input.holdExpiresAt,
      venue: input.venue,
      participantEstimate: input.participantEstimate,
      organizationGoal: input.organizationGoal,
      paymentOptions: input.paymentOptions,
      invoiceActivationPolicy: input.invoiceActivationPolicy ?? "payment_required",
      agreementVersion: "organization-service-v1",
      currentVersion: 1,
      tokenExpiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString()
    };
    const records = loadPreviewRecords();
    records.unshift({ token, booking });
    savePreviewRecords(records);
    return { ...booking, token, completionPath: `/complete?booking=${encodeURIComponent(token)}` };
  }
  return callPrepared<PreparedBookingCreated>("create", input);
}

export async function listPreparedBookings(): Promise<PreparedBookingCustomerView[]> {
  if (isStaticPreview) return loadPreviewRecords().map(item => item.booking);
  return callPrepared<PreparedBookingCustomerView[]>("list");
}

export async function resolvePreparedBooking(token: string): Promise<PreparedBookingCustomerView> {
  if (isStaticPreview) {
    const record = previewRecordByToken(token || previewToken);
    if (record.booking.status === "ready") return previewUpdateByToken(record.token, booking => ({ ...booking, status: "viewed" }));
    return record.booking;
  }
  return callPrepared<PreparedBookingCustomerView>("resolve", { token });
}

export async function claimPreparedBooking(token: string, organizationId: string): Promise<PreparedBookingCustomerView> {
  if (isStaticPreview) return previewUpdateByToken(token || previewToken, booking => ({
    ...booking,
    status: "claimed",
    organizationId: organizationId || "preview-organization",
    claimedByUserId: "preview-customer"
  }));
  return callPrepared<PreparedBookingCustomerView>("claim", { token, organizationId });
}

export async function signPreparedBooking(input: {
  token: string;
  signedByName: string;
  signedByTitle: string;
  electronicRecordsAccepted: boolean;
}): Promise<PreparedBookingCustomerView> {
  if (isStaticPreview) {
    if (!input.electronicRecordsAccepted) throw new Error("Accept electronic records before signing.");
    return previewUpdateByToken(input.token || previewToken, booking => ({
      ...booking,
      status: "accepted",
      agreementId: `preview-agreement-v${booking.currentVersion}`
    }));
  }
  return callPrepared<PreparedBookingCustomerView>("sign", input);
}

export async function requestPreparedBookingChange(token: string, category: string, message: string): Promise<{ id: string }> {
  if (isStaticPreview) {
    previewUpdateByToken(token || previewToken, booking => ({ ...booking, status: "change_requested" }));
    return { id: `preview-change-${Date.now().toString(36)}` };
  }
  return callPrepared<{ id: string }>("requestChange", { token, category, message });
}

export async function revisePreparedBooking(bookingId: string, input: Partial<PreparedBookingCreateInput>): Promise<PreparedBookingCustomerView> {
  if (isStaticPreview) {
    const record = previewUpdateById(bookingId, item => {
      const nextOfferingId = input.offeringId ?? item.booking.offeringId;
      const offering = getExperienceOffering(nextOfferingId);
      return {
        ...item,
        booking: {
          ...item.booking,
          status: item.booking.claimedByUserId ? "claimed" : "ready",
          offeringId: nextOfferingId,
          offeringName: offering?.name ?? item.booking.offeringName,
          amountCents: offering?.priceCents ?? item.booking.amountCents,
          scope: offering?.description ?? item.booking.scope,
          preferredStartsAt: input.preferredStartsAt ?? item.booking.preferredStartsAt,
          dateStatus: input.dateStatus ?? item.booking.dateStatus,
          holdExpiresAt: input.holdExpiresAt,
          venue: input.venue ?? item.booking.venue,
          participantEstimate: input.participantEstimate ?? item.booking.participantEstimate,
          organizationGoal: input.organizationGoal ?? item.booking.organizationGoal,
          paymentOptions: input.paymentOptions ?? item.booking.paymentOptions,
          invoiceActivationPolicy: input.invoiceActivationPolicy ?? item.booking.invoiceActivationPolicy,
          currentVersion: item.booking.currentVersion + 1,
          agreementId: undefined
        }
      };
    });
    return record.booking;
  }
  return callPrepared<PreparedBookingCustomerView>("revise", { bookingId, ...input });
}

export async function rotatePreparedBookingLink(bookingId: string): Promise<{ token: string; completionPath: string }> {
  if (isStaticPreview) {
    const token = makePreviewToken();
    previewUpdateById(bookingId, item => ({ ...item, token }));
    return { token, completionPath: `/complete?booking=${encodeURIComponent(token)}` };
  }
  return callPrepared<{ token: string; completionPath: string }>("rotate", { bookingId });
}

export async function revokePreparedBooking(bookingId: string): Promise<{ revoked: boolean }> {
  if (isStaticPreview) {
    previewUpdateById(bookingId, item => ({ ...item, booking: { ...item.booking, status: "revoked" } }));
    return { revoked: true };
  }
  return callPrepared<{ revoked: boolean }>("revoke", { bookingId });
}

export async function completePreparedBooking(input: {
  token: string;
  paymentMethod: "card" | "invoice";
  billing: {
    name: string;
    contactName: string;
    email: string;
    address: string;
    purchaseOrder?: string;
  };
}): Promise<{
  booking: PreparedBookingCustomerView;
  request: { id: string; organizationId: string };
  invoice: { id: string; invoiceNumber?: string; status: string };
}> {
  if (isStaticPreview) {
    const invoiceId = `preview-invoice-${Date.now().toString(36)}`;
    const booking = previewUpdateByToken(input.token || previewToken, current => ({
      ...current,
      status: input.paymentMethod === "invoice" && current.invoiceActivationPolicy === "approved_receivable" ? "booked" : input.paymentMethod === "invoice" ? "invoice_open" : "payment_pending",
      organizationId: current.organizationId ?? "preview-organization",
      experienceRequestId: "preview-request",
      invoiceId,
      experienceId: input.paymentMethod === "invoice" && current.invoiceActivationPolicy === "approved_receivable" ? "preview-experience" : current.experienceId
    }));
    return {
      booking,
      request: { id: "preview-request", organizationId: booking.organizationId ?? "preview-organization" },
      invoice: { id: invoiceId, invoiceNumber: "SK-PREVIEW-000001", status: input.paymentMethod === "invoice" ? "issued" : "draft" }
    };
  }
  return callPrepared("complete", input);
}
