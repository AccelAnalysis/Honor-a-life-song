import { httpsCallable } from "firebase/functions";
import type {
  PreparedBooking,
  PreparedBookingCreateInput,
  PreparedBookingCustomerView
} from "@/domain/customer-lifecycle";
import { getFirebaseFunctions } from "./client";

type PreparedBookingOperation =
  | "create"
  | "list"
  | "resolve"
  | "claim"
  | "sign"
  | "requestChange"
  | "rotate"
  | "revoke"
  | "complete";

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
  return callPrepared<PreparedBookingCreated>("create", input);
}

export async function listPreparedBookings(): Promise<PreparedBooking[]> {
  return callPrepared<PreparedBooking[]>("list");
}

export async function resolvePreparedBooking(token: string): Promise<PreparedBookingCustomerView> {
  return callPrepared<PreparedBookingCustomerView>("resolve", { token });
}

export async function claimPreparedBooking(token: string, organizationId: string): Promise<PreparedBookingCustomerView> {
  return callPrepared<PreparedBookingCustomerView>("claim", { token, organizationId });
}

export async function signPreparedBooking(input: {
  token: string;
  signedByName: string;
  signedByTitle: string;
  electronicRecordsAccepted: boolean;
}): Promise<PreparedBookingCustomerView> {
  return callPrepared<PreparedBookingCustomerView>("sign", input);
}

export async function requestPreparedBookingChange(token: string, category: string, message: string): Promise<{ id: string }> {
  return callPrepared<{ id: string }>("requestChange", { token, category, message });
}

export async function rotatePreparedBookingLink(bookingId: string): Promise<{ token: string; completionPath: string }> {
  return callPrepared<{ token: string; completionPath: string }>("rotate", { bookingId });
}

export async function revokePreparedBooking(bookingId: string): Promise<{ revoked: boolean }> {
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
  return callPrepared("complete", input);
}
