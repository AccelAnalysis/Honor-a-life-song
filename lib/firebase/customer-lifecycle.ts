import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp
} from "firebase/firestore";
import {
  getNetPromoterBand,
  type ExperienceFeedback,
  type OrganizationReferral
} from "@/domain/customer-lifecycle";
import { getFirebaseFirestore } from "./client";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function dataOf(snapshot: QueryDocumentSnapshot<DocumentData>): DocumentData & { id: string } {
  return { id: snapshot.id, ...snapshot.data() };
}

export async function listExperienceFeedback(
  organizationId: string,
  experienceId: string
): Promise<ExperienceFeedback[]> {
  const snapshots = await getDocs(collection(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "feedback"
  ));
  return snapshots.docs.map((snapshot) => {
    const data = dataOf(snapshot);
    return {
      id: data.id,
      organizationId,
      experienceId,
      submittedByUserId: data.submittedByUserId ?? data.id,
      npsScore: data.npsScore ?? 0,
      satisfactionScore: data.satisfactionScore,
      mostMeaningful: data.mostMeaningful,
      improvement: data.improvement,
      band: data.band ?? getNetPromoterBand(data.npsScore ?? 0),
      createdAt: toIso(data.createdAt)
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitExperienceFeedback(input: {
  organizationId: string;
  experienceId: string;
  submittedByUserId: string;
  npsScore: number;
  satisfactionScore?: number;
  mostMeaningful?: string;
  improvement?: string;
}) {
  const band = getNetPromoterBand(input.npsScore);
  if (input.satisfactionScore !== undefined && (!Number.isInteger(input.satisfactionScore) || input.satisfactionScore < 1 || input.satisfactionScore > 5)) {
    throw new Error("Satisfaction must be a whole number from 1 through 5.");
  }
  const feedbackRef = doc(
    getFirebaseFirestore(),
    "organizations",
    input.organizationId,
    "experiences",
    input.experienceId,
    "feedback",
    input.submittedByUserId
  );
  await setDoc(feedbackRef, {
    organizationId: input.organizationId,
    experienceId: input.experienceId,
    submittedByUserId: input.submittedByUserId,
    npsScore: input.npsScore,
    satisfactionScore: input.satisfactionScore ?? null,
    mostMeaningful: input.mostMeaningful?.trim() || null,
    improvement: input.improvement?.trim() || null,
    band,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return band;
}

export async function submitOrganizationReferral(input: {
  organizationId: string;
  sourceExperienceId: string;
  advocateUserId: string;
  referredOrganizationName: string;
  referredContactName?: string;
  referredContactEmail?: string;
  relationship?: string;
  message?: string;
}): Promise<OrganizationReferral> {
  if (!input.referredOrganizationName.trim()) throw new Error("Enter the organization you would like to introduce.");
  const db = getFirebaseFirestore();
  const referralRef = doc(collection(db, "organizations", input.organizationId, "referrals"));
  await setDoc(referralRef, {
    organizationId: input.organizationId,
    sourceExperienceId: input.sourceExperienceId,
    advocateUserId: input.advocateUserId,
    referredOrganizationName: input.referredOrganizationName.trim(),
    referredContactName: input.referredContactName?.trim() || null,
    referredContactEmail: input.referredContactEmail?.trim().toLowerCase() || null,
    relationship: input.relationship?.trim() || null,
    message: input.message?.trim() || null,
    status: "submitted",
    createdAt: serverTimestamp()
  });
  return {
    id: referralRef.id,
    organizationId: input.organizationId,
    sourceExperienceId: input.sourceExperienceId,
    advocateUserId: input.advocateUserId,
    referredOrganizationName: input.referredOrganizationName.trim(),
    referredContactName: input.referredContactName?.trim() || undefined,
    referredContactEmail: input.referredContactEmail?.trim().toLowerCase() || undefined,
    relationship: input.relationship?.trim() || undefined,
    message: input.message?.trim() || undefined,
    status: "submitted",
    createdAt: new Date().toISOString()
  };
}
