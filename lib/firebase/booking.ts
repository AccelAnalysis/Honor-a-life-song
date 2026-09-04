import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getExperienceOffering, type ExperienceOfferingId } from "@/domain/experience";
import { getFirebaseFirestore } from "./client";

export async function createOrganizationExperienceRequest(input: {
  organizationId: string;
  createdByUserId: string;
  offeringId: ExperienceOfferingId;
  preferredDate: string;
  preferredTime: string;
  venue?: string;
  requestedPaymentMethod: "card" | "invoice";
}): Promise<string> {
  const offering = getExperienceOffering(input.offeringId);
  if (!offering) throw new Error("Choose an available experience.");
  if (!input.organizationId) throw new Error("Choose your organization.");
  if (!input.preferredDate || !input.preferredTime) throw new Error("Choose a preferred date and time.");

  const preferredStartsAt = new Date(`${input.preferredDate}T${input.preferredTime}`);
  if (Number.isNaN(preferredStartsAt.valueOf())) throw new Error("Choose a valid preferred date and time.");

  const db = getFirebaseFirestore();
  const experienceRef = doc(collection(db, "organizations", input.organizationId, "experiences"));
  await setDoc(experienceRef, {
    organizationId: input.organizationId,
    title: offering.name,
    offeringId: offering.id,
    templateKind: offering.templateKind,
    participantMode: offering.participantMode,
    status: "inquiry",
    startsAt: preferredStartsAt,
    venue: input.venue?.trim() || null,
    nextAction: "We’ll confirm the date, agreement, and payment with your organization.",
    billingStatus: "not_started",
    requestedPaymentMethod: input.requestedPaymentMethod,
    dateStatus: "requested",
    createdByUserId: input.createdByUserId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return experienceRef.id;
}
