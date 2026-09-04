import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import type { BookingDraft } from "@/domain/account-onboarding";
import { normalizeExperienceOfferingId } from "@/domain/experience";
import { getFirebaseFirestore } from "./client";

export async function saveBookingDraft(userId: string, draft: BookingDraft) {
  await setDoc(doc(getFirebaseFirestore(), "users", userId, "bookingDrafts", draft.organizationId), {
    ...JSON.parse(JSON.stringify(draft)), updatedAt: serverTimestamp()
  });
}
export async function getBookingDraft(userId: string, organizationId: string): Promise<BookingDraft | null> {
  const result = await getDoc(doc(getFirebaseFirestore(), "users", userId, "bookingDrafts", organizationId));
  const data = result.data();
  return data && normalizeExperienceOfferingId(data.offeringId) ? data as BookingDraft : null;
}
export async function listBookingDrafts(userId: string): Promise<BookingDraft[]> {
  const result = await getDocs(collection(getFirebaseFirestore(), "users", userId, "bookingDrafts"));
  return result.docs.map(item => item.data() as BookingDraft).filter(item => normalizeExperienceOfferingId(item.offeringId));
}
export async function clearBookingDraft(userId: string, organizationId: string) {
  await deleteDoc(doc(getFirebaseFirestore(), "users", userId, "bookingDrafts", organizationId));
}
