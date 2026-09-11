import { nativeAction } from "./native-services";
import {
  collection,
  runTransaction,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp
} from "firebase/firestore";
import type { ConsentScope } from "@/domain/consent";
import {
  branchForNps,
  type AcquisitionContext,
  type ExperienceFeedback,
  type IndividualPurchaseRequest,
  type IndividualPurchaseRequestStatus,
  type OrganizationExperienceRequest,
  type OrganizationReferral,
  type OrganizationRelationshipProfile,
  type ParticipantPermissionInvitation,
  type PostExperienceProduct,
  type PostExperienceProductKind
} from "@/domain/customer-lifecycle";
import { getExperienceOffering, type ExperienceOfferingId } from "@/domain/experience";
import type { OrganizationKind } from "@/domain/types";
import { listUserOrganizations } from "./organization-account";
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

function experienceRequestFrom(organizationId: string, data: ReturnType<typeof dataOf>): OrganizationExperienceRequest {
  return {
    id: data.id,
    organizationId,
    organizationName: data.organizationName ?? "Organization",
    createdByUserId: data.createdByUserId ?? "",
    offeringId: data.offeringId ?? "single-song-group-event",
    offeringName: data.offeringName ?? "SongKeep experience",
    amountCents: typeof data.amountCents === "number" ? data.amountCents : 0,
    currency: "USD",
    status: data.status ?? "payment_pending",
    financialStatus: data.financialStatus ?? "payment_pending",
    requestedPaymentMethod: data.requestedPaymentMethod ?? "invoice",
    preferredStartsAt: toIso(data.preferredStartsAt),
    venue: data.venue ?? undefined,
    participantEstimate: typeof data.participantEstimate === "number" ? data.participantEstimate : undefined,
    organizationGoal: data.organizationGoal ?? undefined,
    agreementAcknowledged: data.agreementAcknowledged === true,
    agreementVersion: data.agreementVersion ?? "organization-planning-v1",
    sourceExperienceId: data.sourceExperienceId ?? undefined,
    replacesRequestId: data.replacesRequestId ?? undefined,
    experienceId: data.experienceId ?? undefined,
    invoiceId: data.invoiceId ?? undefined,
    invoiceNumber: data.invoiceNumber ?? undefined,
    invoiceUrl: data.invoiceUrl ?? undefined,
    invoiceDueAt: data.invoiceDueAt ? toIso(data.invoiceDueAt) : undefined,
    nurtureTrack: data.nurtureTrack ?? "payment_reconciliation",
    nextAction: data.nextAction ?? "SongKeep will review this request.",
    acquisition: data.acquisition ?? undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function feedbackFrom(organizationId: string, data: ReturnType<typeof dataOf>): ExperienceFeedback {
  return {
    id: data.id,
    organizationId,
    experienceId: data.experienceId ?? "",
    audience: data.audience ?? "organization",
    submittedByUserId: data.submittedByUserId ?? "",
    score: typeof data.score === "number" ? data.score : 0,
    satisfaction: typeof data.satisfaction === "number" ? data.satisfaction : undefined,
    comments: data.comments ?? undefined,
    branch: data.branch ?? "relationship_nurture",
    followUpStatus: data.followUpStatus ?? "not_required",
    createdAt: toIso(data.createdAt)
  };
}

function referralFrom(organizationId: string, data: ReturnType<typeof dataOf>): OrganizationReferral {
  return {
    id: data.id,
    organizationId,
    experienceId: data.experienceId ?? "",
    feedbackId: data.feedbackId ?? "",
    submittedByUserId: data.submittedByUserId ?? "",
    advocateName: data.advocateName ?? "",
    advocateEmail: data.advocateEmail ?? "",
    referredOrganizationName: data.referredOrganizationName ?? "",
    referredContactName: data.referredContactName ?? undefined,
    referredContactEmail: data.referredContactEmail ?? undefined,
    message: data.message ?? undefined,
    status: data.status ?? "submitted",
    createdAt: toIso(data.createdAt)
  };
}

function permissionInvitationFrom(
  organizationId: string,
  experienceId: string,
  data: ReturnType<typeof dataOf>
): ParticipantPermissionInvitation {
  return {
    id: data.id,
    organizationId,
    organizationName: data.organizationName ?? "Organization",
    experienceId,
    experienceTitle: data.experienceTitle ?? "SongKeep experience",
    participantId: data.participantId ?? "",
    participantName: data.participantName ?? "Participant",
    recipientEmail: data.recipientEmail ?? "",
    recipientName: data.recipientName ?? undefined,
    agreementVersion: data.agreementVersion ?? "participant-permissions-v1",
    status: data.status ?? "pending",
    invitedByUserId: data.invitedByUserId ?? "",
    createdAt: toIso(data.createdAt),
    submittedAt: data.submittedAt ? toIso(data.submittedAt) : undefined,
    submittedByUserId: data.submittedByUserId ?? undefined,
    signatureName: data.signatureName ?? undefined,
    authorityBasis: data.authorityBasis ?? undefined,
    scopes: Array.isArray(data.scopes) ? data.scopes : undefined,
    restrictions: Array.isArray(data.restrictions) ? data.restrictions : undefined,
    participantDeliveryEmail: data.participantDeliveryEmail ?? undefined,
    designatedFamilyEmails: Array.isArray(data.designatedFamilyEmails) ? data.designatedFamilyEmails : undefined,
    consentRecordId: data.consentRecordId ?? undefined,
    reviewedAt: data.reviewedAt ? toIso(data.reviewedAt) : undefined
  };
}

function productFrom(data: ReturnType<typeof dataOf>): PostExperienceProduct {
  return {
    id: data.id,
    name: data.name ?? "SongKeep product",
    description: data.description ?? "",
    kind: data.kind ?? "other",
    status: data.status ?? "inactive",
    priceCents: typeof data.priceCents === "number" ? data.priceCents : undefined,
    currency: "USD",
    checkoutUrl: data.checkoutUrl ?? undefined,
    audiences: Array.isArray(data.audiences) ? data.audiences : ["participant", "designated_family"],
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function purchaseRequestFrom(userId: string, data: ReturnType<typeof dataOf>): IndividualPurchaseRequest {
  return {
    id: data.id,
    userId,
    accessId: data.accessId ?? "",
    organizationId: data.organizationId ?? "",
    organizationName: data.organizationName ?? "Organization",
    experienceId: data.experienceId ?? "",
    experienceTitle: data.experienceTitle ?? "SongKeep experience",
    participantId: data.participantId ?? "",
    participantName: data.participantName ?? "Participant",
    recipient: data.recipient ?? "participant",
    productId: data.productId ?? "",
    productName: data.productName ?? "SongKeep product",
    priceCents: typeof data.priceCents === "number" ? data.priceCents : undefined,
    currency: "USD",
    requestedPaymentMethod: data.requestedPaymentMethod ?? "invoice",
    status: data.status ?? "invoice_requested",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

export async function createOrganizationWithPrimaryContact(input: {
  setupId: string;
  firstName: string;
  lastName: string;
  offeringId?: ExperienceOfferingId;
  userId: string;
  email: string;
  displayName: string;
  contactTitle?: string;
  contactPhone?: string;
  preferredContactMethod?: "email" | "phone" | "text";
  organizationName: string;
  organizationKind: OrganizationKind;
  organizationEmail?: string;
  organizationPhone?: string;
  website?: string;
  address?: string;
}): Promise<string> {
  const organizationName = input.organizationName.trim();
  if (!organizationName) throw new Error("Enter the organization name.");
  if (!input.displayName.trim()) throw new Error("Enter the primary contact name.");
  if (!input.email.trim()) throw new Error("Enter the primary contact email.");

  const db = getFirebaseFirestore();
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(input.setupId)) throw new Error("Please retry creating your account.");
  const setupRef = doc(db, "users", input.userId, "organizationSetups", input.setupId);
  const organizationRef = doc(collection(db, "organizations"));
  return runTransaction(db, async transaction => {
    const setup = await transaction.get(setupRef);
    if (setup.exists()) return setup.data().organizationId as string;
    transaction.set(organizationRef, {
      name: organizationName, kind: input.organizationKind,
      organizationEmail: input.organizationEmail?.trim().toLowerCase() || normalizedEmail,
      billingEmail: input.organizationEmail?.trim().toLowerCase() || normalizedEmail,
      phone: input.organizationPhone?.trim() || null, website: input.website?.trim() || null,
      address: input.address?.trim() || null, createdBy: input.userId,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    transaction.set(doc(db, "organizations", organizationRef.id, "members", input.userId), {
      userId: input.userId, email: normalizedEmail, displayName: input.displayName.trim(),
      firstName: input.firstName.trim(), lastName: input.lastName.trim(),
      title: input.contactTitle?.trim() || null, phone: input.contactPhone?.trim() || null,
      preferredContactMethod: input.preferredContactMethod ?? "email", relationshipRole: "primary_contact",
      primaryContact: true, role: "organization_admin", status: "active", joinedAt: serverTimestamp()
    });
    transaction.set(doc(db, "users", input.userId, "organizations", organizationRef.id), {
      organizationId: organizationRef.id, role: "organization_admin", joinedAt: serverTimestamp()
    });
    transaction.set(doc(db, "users", input.userId), {
      email: normalizedEmail, displayName: input.displayName.trim(), firstName: input.firstName.trim(),
      lastName: input.lastName.trim(), updatedAt: serverTimestamp()
    }, { merge: true });
    transaction.set(setupRef, { organizationId: organizationRef.id, createdAt: serverTimestamp() });
    if (input.offeringId) transaction.set(doc(db, "users", input.userId, "bookingDrafts", organizationRef.id), {
      organizationId: organizationRef.id, offeringId: input.offeringId, updatedAt: serverTimestamp()
    });
    return organizationRef.id;
  });
}

export async function listOrganizationRelationshipProfiles(userId: string): Promise<OrganizationRelationshipProfile[]> {
  const db = getFirebaseFirestore();
  const organizations = await listUserOrganizations(userId);
  return Promise.all(organizations.map(async (organization) => {
    const [organizationSnapshot, memberSnapshot] = await Promise.all([
      getDoc(doc(db, "organizations", organization.id)),
      getDoc(doc(db, "organizations", organization.id, "members", userId))
    ]);
    const organizationData = organizationSnapshot.data() ?? {};
    const memberData = memberSnapshot.data() ?? {};
    return {
      id: organization.id,
      name: organization.name,
      kind: organization.kind,
      membershipRole: memberData.role,
      organizationEmail: organizationData.organizationEmail ?? organization.billingEmail,
      phone: organizationData.phone ?? organization.phone,
      website: organizationData.website ?? organization.website,
      address: organizationData.address ?? organization.address,
      contact: {
        userId,
        displayName: memberData.displayName ?? memberData.email ?? "Primary contact",
        email: memberData.email ?? "",
        title: memberData.title ?? undefined,
        phone: memberData.phone ?? memberData.directPhone ?? undefined,
        preferredContactMethod: memberData.preferredContactMethod ?? "email",
        relationshipRole: memberData.relationshipRole ?? "primary_contact",
        primary: memberData.primaryContact !== false
      }
    } satisfies OrganizationRelationshipProfile;
  }));
}

export async function createOrganizationExperienceRequest(input: {
  organizationId: string; createdByUserId: string; offeringId: ExperienceOfferingId;
  preferredDate: string; preferredTime: string; venue?: string; participantEstimate?: number;
  organizationGoal?: string; requestedPaymentMethod: "card" | "invoice"; agreementAcknowledged: boolean;
  sourceExperienceId?: string; replacesRequestId?: string; acquisition?: AcquisitionContext; idempotencyKey?: string;
}): Promise<OrganizationExperienceRequest> {
  const preferredStartsAt = new Date(`${input.preferredDate}T${input.preferredTime}`);
  if (!Number.isFinite(preferredStartsAt.valueOf())) throw new Error("Choose a valid preferred date and time.");
  return nativeAction<OrganizationExperienceRequest>("createRequest", {
    ...input, preferredStartsAt: preferredStartsAt.toISOString(), idempotencyKey: input.idempotencyKey ?? crypto.randomUUID()
  });
}

export async function listOrganizationExperienceRequests(organizationId: string): Promise<OrganizationExperienceRequest[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "experienceRequests"));
  return snapshots.docs
    .map((snapshot) => experienceRequestFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminExperienceRequests(): Promise<OrganizationExperienceRequest[]> {
  const snapshots = await getDocs(collectionGroup(getFirebaseFirestore(), "experienceRequests"));
  return snapshots.docs.map((snapshot) => {
    const organizationId = snapshot.ref.parent.parent?.id ?? snapshot.data().organizationId ?? "";
    return experienceRequestFrom(organizationId, dataOf(snapshot));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitOrganizationFeedback(input: {
  organizationId: string;
  experienceId: string;
  submittedByUserId: string;
  score: number;
  satisfaction?: number;
  comments?: string;
}): Promise<ExperienceFeedback> {
  const branch = branchForNps(input.score);
  if (input.satisfaction !== undefined && (!Number.isInteger(input.satisfaction) || input.satisfaction < 1 || input.satisfaction > 5)) {
    throw new Error("Satisfaction must be a whole number from 1 through 5.");
  }
  const db = getFirebaseFirestore();
  const feedbackRef = doc(collection(db, "organizations", input.organizationId, "feedback"));
  const now = new Date().toISOString();
  const feedback: ExperienceFeedback = {
    id: feedbackRef.id,
    organizationId: input.organizationId,
    experienceId: input.experienceId,
    audience: "organization",
    submittedByUserId: input.submittedByUserId,
    score: input.score,
    satisfaction: input.satisfaction,
    comments: input.comments?.trim() || undefined,
    branch,
    followUpStatus: branch === "service_recovery" ? "required" : "not_required",
    createdAt: now
  };
  const { id: _feedbackId, ...feedbackData } = feedback;
  await setDoc(feedbackRef, {
    ...feedbackData,
    satisfaction: feedback.satisfaction ?? null,
    comments: feedback.comments ?? null,
    createdAt: serverTimestamp()
  });
  return feedback;
}

export async function listOrganizationFeedback(organizationId: string): Promise<ExperienceFeedback[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "feedback"));
  return snapshots.docs.map((snapshot) => feedbackFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminFeedback(): Promise<ExperienceFeedback[]> {
  const snapshots = await getDocs(collectionGroup(getFirebaseFirestore(), "feedback"));
  return snapshots.docs.map((snapshot) => {
    const organizationId = snapshot.ref.parent.parent?.id ?? snapshot.data().organizationId ?? "";
    return feedbackFrom(organizationId, dataOf(snapshot));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitOrganizationReferral(input: {
  organizationId: string;
  experienceId: string;
  feedbackId: string;
  submittedByUserId: string;
  advocateName: string;
  advocateEmail: string;
  referredOrganizationName: string;
  referredContactName?: string;
  referredContactEmail?: string;
  message?: string;
}): Promise<OrganizationReferral> {
  if (!input.referredOrganizationName.trim()) throw new Error("Enter the organization you would like to introduce.");
  const db = getFirebaseFirestore();
  const feedbackSnapshot = await getDoc(doc(db, "organizations", input.organizationId, "feedback", input.feedbackId));
  if (!feedbackSnapshot.exists() || Number(feedbackSnapshot.data().score ?? 0) < 9) {
    throw new Error("Referral invitations become available after promoter feedback.");
  }
  const referralRef = doc(collection(db, "organizations", input.organizationId, "referrals"));
  const now = new Date().toISOString();
  const referral: OrganizationReferral = {
    id: referralRef.id,
    organizationId: input.organizationId,
    experienceId: input.experienceId,
    feedbackId: input.feedbackId,
    submittedByUserId: input.submittedByUserId,
    advocateName: input.advocateName.trim(),
    advocateEmail: input.advocateEmail.trim().toLowerCase(),
    referredOrganizationName: input.referredOrganizationName.trim(),
    referredContactName: input.referredContactName?.trim() || undefined,
    referredContactEmail: input.referredContactEmail?.trim().toLowerCase() || undefined,
    message: input.message?.trim() || undefined,
    status: "submitted",
    createdAt: now
  };
  const { id: _referralId, ...referralData } = referral;
  await setDoc(referralRef, {
    ...referralData,
    referredContactName: referral.referredContactName ?? null,
    referredContactEmail: referral.referredContactEmail ?? null,
    message: referral.message ?? null,
    createdAt: serverTimestamp()
  });
  return referral;
}

export async function listOrganizationReferrals(organizationId: string): Promise<OrganizationReferral[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "referrals"));
  return snapshots.docs.map((snapshot) => referralFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminReferrals(): Promise<OrganizationReferral[]> {
  const snapshots = await getDocs(collectionGroup(getFirebaseFirestore(), "referrals"));
  return snapshots.docs.map((snapshot) => {
    const organizationId = snapshot.ref.parent.parent?.id ?? snapshot.data().organizationId ?? "";
    return referralFrom(organizationId, dataOf(snapshot));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createParticipantPermissionInvitation(input: {
  organizationId: string;
  experienceId: string;
  participantId: string;
  recipientEmail: string;
  recipientName?: string;
  invitedByUserId: string;
}): Promise<ParticipantPermissionInvitation> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!recipientEmail) throw new Error("Enter the participant or representative email.");
  const db = getFirebaseFirestore();
  const [organizationSnapshot, experienceSnapshot, participantSnapshot] = await Promise.all([
    getDoc(doc(db, "organizations", input.organizationId)),
    getDoc(doc(db, "organizations", input.organizationId, "experiences", input.experienceId)),
    getDoc(doc(db, "organizations", input.organizationId, "experiences", input.experienceId, "participants", input.participantId))
  ]);
  if (!organizationSnapshot.exists() || !experienceSnapshot.exists() || !participantSnapshot.exists()) {
    throw new Error("The organization, experience, and participant must belong together.");
  }
  const invitationRef = doc(collection(
    db,
    "organizations",
    input.organizationId,
    "experiences",
    input.experienceId,
    "permissionInvitations"
  ));
  const now = new Date().toISOString();
  const invitation: ParticipantPermissionInvitation = {
    id: invitationRef.id,
    organizationId: input.organizationId,
    organizationName: organizationSnapshot.data().name ?? "Organization",
    experienceId: input.experienceId,
    experienceTitle: experienceSnapshot.data().title ?? "SongKeep experience",
    participantId: input.participantId,
    participantName: participantSnapshot.data().displayName ?? "Participant",
    recipientEmail,
    recipientName: input.recipientName?.trim() || undefined,
    agreementVersion: "participant-permissions-v1",
    status: "pending",
    invitedByUserId: input.invitedByUserId,
    createdAt: now
  };
  const { id: _invitationId, ...invitationData } = invitation;
  await setDoc(invitationRef, {
    ...invitationData,
    recipientName: invitation.recipientName ?? null,
    createdAt: serverTimestamp()
  });
  return invitation;
}

export async function getParticipantPermissionInvitation(
  organizationId: string,
  experienceId: string,
  invitationId: string
): Promise<ParticipantPermissionInvitation | null> {
  const snapshot = await getDoc(doc(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "permissionInvitations",
    invitationId
  ));
  return snapshot.exists()
    ? permissionInvitationFrom(organizationId, experienceId, { id: snapshot.id, ...snapshot.data() })
    : null;
}

export async function listExperiencePermissionInvitations(
  organizationId: string,
  experienceId: string
): Promise<ParticipantPermissionInvitation[]> {
  const snapshots = await getDocs(collection(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "permissionInvitations"
  ));
  return snapshots.docs.map((snapshot) => permissionInvitationFrom(organizationId, experienceId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminPermissionInvitations(): Promise<ParticipantPermissionInvitation[]> {
  const snapshots = await getDocs(collectionGroup(getFirebaseFirestore(), "permissionInvitations"));
  return snapshots.docs.map((snapshot) => {
    const experienceId = snapshot.ref.parent.parent?.id ?? snapshot.data().experienceId ?? "";
    const organizationId = snapshot.ref.parent.parent?.parent.parent?.id ?? snapshot.data().organizationId ?? "";
    return permissionInvitationFrom(organizationId, experienceId, dataOf(snapshot));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitParticipantPermissionResponse(input: {
  organizationId: string; experienceId: string; invitationId: string; userId: string; userEmail: string;
  emailVerified: boolean; signatureName: string; authorityBasis: "self" | "authorized_representative";
  scopes: ConsentScope[]; restrictions?: string[]; participantDeliveryEmail?: string; designatedFamilyEmails?: string[];
}) {
  if (input.scopes.includes("designated_family_sharing") && !input.designatedFamilyEmails?.length) {
    throw new Error("Add at least one designated family email address.");
  }
  return nativeAction("submitPermission", input);
}

export async function approveParticipantPermissionResponse(input: { invitation: ParticipantPermissionInvitation }) {
  const { organizationId, experienceId, id: invitationId } = input.invitation;
  return nativeAction<string>("approvePermission", { organizationId, experienceId, invitationId });
}

export async function listPostExperienceProducts(options?: { includeInactive?: boolean }): Promise<PostExperienceProduct[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "postExperienceProducts"));
  return snapshots.docs.map((snapshot) => productFrom(dataOf(snapshot)))
    .filter((product) => options?.includeInactive || product.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createPostExperienceProduct(input: {
  name: string;
  description: string;
  kind: PostExperienceProductKind;
  priceCents?: number;
  checkoutUrl?: string;
  audiences: Array<"participant" | "designated_family">;
}) {
  if (!input.name.trim()) throw new Error("Enter a product name.");
  if (!input.description.trim()) throw new Error("Describe what the individual receives.");
  if (input.priceCents !== undefined && (!Number.isInteger(input.priceCents) || input.priceCents < 0)) {
    throw new Error("Enter a valid price in cents.");
  }
  if (input.audiences.length === 0) throw new Error("Choose at least one eligible audience.");
  const productRef = doc(collection(getFirebaseFirestore(), "postExperienceProducts"));
  await setDoc(productRef, {
    name: input.name.trim(),
    description: input.description.trim(),
    kind: input.kind,
    status: "active",
    priceCents: input.priceCents ?? null,
    currency: "USD",
    checkoutUrl: input.checkoutUrl?.trim() || null,
    audiences: [...new Set(input.audiences)],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return productRef.id;
}

export async function createIndividualPurchaseRequest(input: {
  userId: string; accessId: string; productId: string;
}): Promise<{ request: IndividualPurchaseRequest; checkoutUrl?: string }> {
  return nativeAction<{ request: IndividualPurchaseRequest; checkoutUrl?: string }>("purchase", input);
}

export async function listUserPurchaseRequests(userId: string): Promise<IndividualPurchaseRequest[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "users", userId, "purchaseRequests"));
  return snapshots.docs.map((snapshot) => purchaseRequestFrom(userId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminIndividualPurchaseRequests(): Promise<IndividualPurchaseRequest[]> {
  const snapshots = await getDocs(collectionGroup(getFirebaseFirestore(), "purchaseRequests"));
  return snapshots.docs.map((snapshot) => {
    const userId = snapshot.ref.parent.parent?.id ?? snapshot.data().userId ?? "";
    return purchaseRequestFrom(userId, dataOf(snapshot));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function adminUpdateIndividualPurchaseRequest(input: {
  userId: string; requestId: string; status: IndividualPurchaseRequestStatus; reference?: string; confirmed?: boolean;
}) { return nativeAction("updatePurchase", input); }
