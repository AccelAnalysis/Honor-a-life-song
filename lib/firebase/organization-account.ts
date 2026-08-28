import {
  collection,
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
import type {
  OrganizationAccount,
  OrganizationAgreement,
  OrganizationAgreementKind,
  OrganizationAsset,
  OrganizationAssetKind,
  OrganizationExperience,
  OrganizationExperienceStatus,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMemberRole,
  OrganizationSuggestedDate
} from "@/domain/organization-account";
import type { OrganizationKind } from "@/domain/types";
import { getFirebaseFirestore } from "./client";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function dataOf(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return { id: snapshot.id, ...snapshot.data() };
}

function accountFrom(id: string, data: DocumentData): OrganizationAccount {
  return {
    id,
    name: data.name ?? "Organization",
    kind: data.kind ?? "community_partner",
    createdBy: data.createdBy ?? "",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    billingEmail: data.billingEmail,
    phone: data.phone,
    website: data.website,
    address: data.address
  };
}

function memberFrom(data: ReturnType<typeof dataOf>): OrganizationMember {
  return {
    userId: data.userId ?? data.id,
    email: data.email ?? "",
    displayName: data.displayName ?? data.email ?? "Team member",
    role: data.role ?? "viewer",
    status: data.status ?? "active",
    joinedAt: toIso(data.joinedAt)
  };
}

function agreementFrom(organizationId: string, data: ReturnType<typeof dataOf>): OrganizationAgreement {
  return {
    id: data.id,
    organizationId,
    title: data.title ?? "Agreement",
    kind: data.kind ?? "other",
    documentVersion: data.documentVersion ?? "1",
    status: data.status ?? "requested",
    relatedExperienceId: data.relatedExperienceId,
    documentUrl: data.documentUrl,
    requestedAt: toIso(data.requestedAt),
    signedAt: data.signedAt ? toIso(data.signedAt) : undefined,
    signedByUserId: data.signedByUserId,
    signedByName: data.signedByName,
    signedByTitle: data.signedByTitle,
    electronicRecordsAccepted: data.electronicRecordsAccepted
  };
}

function experienceFrom(organizationId: string, data: ReturnType<typeof dataOf>): OrganizationExperience {
  return {
    id: data.id,
    organizationId,
    title: data.title ?? "Honor a Life Song experience",
    experienceType: data.experienceType ?? "program",
    status: data.status ?? "inquiry",
    startsAt: data.startsAt ? toIso(data.startsAt) : undefined,
    endsAt: data.endsAt ? toIso(data.endsAt) : undefined,
    venue: data.venue,
    nextAction: data.nextAction,
    participantReadyCount: data.participantReadyCount,
    participantExpectedCount: data.participantExpectedCount,
    billingStatus: data.billingStatus,
    invoiceUrl: data.invoiceUrl,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function suggestedDateFrom(organizationId: string, data: ReturnType<typeof dataOf>): OrganizationSuggestedDate {
  return {
    id: data.id,
    organizationId,
    startsAt: toIso(data.startsAt),
    label: data.label,
    status: data.status ?? "suggested",
    createdAt: toIso(data.createdAt)
  };
}

function assetFrom(organizationId: string, data: ReturnType<typeof dataOf>): OrganizationAsset {
  return {
    id: data.id,
    organizationId,
    experienceId: data.experienceId ?? "",
    title: data.title ?? "Event file",
    kind: data.kind ?? "other",
    status: data.status ?? "processing",
    storagePath: data.storagePath,
    downloadUrl: data.downloadUrl,
    createdAt: toIso(data.createdAt)
  };
}

export async function ensureUserProfile(user: { uid: string; email: string | null; displayName: string | null }) {
  const db = getFirebaseFirestore();
  await setDoc(doc(db, "users", user.uid), {
    email: user.email ?? "",
    displayName: user.displayName ?? user.email ?? "Honor a Life Song user",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function createOrganizationAccount(input: {
  userId: string;
  email: string;
  displayName: string;
  organizationName: string;
  kind: OrganizationKind;
}) {
  const db = getFirebaseFirestore();
  const organizationRef = doc(collection(db, "organizations"));
  const memberRef = doc(db, "organizations", organizationRef.id, "members", input.userId);
  const userOrganizationRef = doc(db, "users", input.userId, "organizations", organizationRef.id);
  const userRef = doc(db, "users", input.userId);
  const batch = writeBatch(db);

  batch.set(organizationRef, {
    name: input.organizationName.trim(),
    kind: input.kind,
    createdBy: input.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.set(memberRef, {
    userId: input.userId,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    role: "organization_admin",
    status: "active",
    joinedAt: serverTimestamp()
  });
  batch.set(userOrganizationRef, {
    organizationId: organizationRef.id,
    role: "organization_admin",
    joinedAt: serverTimestamp()
  });
  batch.set(userRef, {
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    updatedAt: serverTimestamp()
  }, { merge: true });

  await batch.commit();
  return organizationRef.id;
}

export async function listUserOrganizations(userId: string): Promise<OrganizationAccount[]> {
  const db = getFirebaseFirestore();
  const pointers = await getDocs(collection(db, "users", userId, "organizations"));
  const accounts = await Promise.all(pointers.docs.map(async (pointer) => {
    const organizationId = pointer.data().organizationId ?? pointer.id;
    const snapshot = await getDoc(doc(db, "organizations", organizationId));
    return snapshot.exists() ? accountFrom(snapshot.id, snapshot.data()) : null;
  }));
  return accounts.filter((account): account is OrganizationAccount => Boolean(account)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getOrganization(organizationId: string): Promise<OrganizationAccount | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "organizations", organizationId));
  return snapshot.exists() ? accountFrom(snapshot.id, snapshot.data()) : null;
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "members"));
  return snapshots.docs.map((snapshot) => memberFrom(dataOf(snapshot))).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createOrganizationInvitation(input: {
  organizationId: string;
  email: string;
  role: OrganizationMemberRole;
  invitedBy: string;
}): Promise<OrganizationInvitation> {
  const db = getFirebaseFirestore();
  const invitationRef = doc(collection(db, "organizations", input.organizationId, "invitations"));
  const email = input.email.trim().toLowerCase();
  await setDoc(invitationRef, {
    organizationId: input.organizationId,
    email,
    role: input.role,
    status: "pending",
    invitedBy: input.invitedBy,
    createdAt: serverTimestamp()
  });
  return {
    id: invitationRef.id,
    organizationId: input.organizationId,
    email,
    role: input.role,
    status: "pending",
    invitedBy: input.invitedBy,
    createdAt: new Date().toISOString()
  };
}

export async function getOrganizationInvitation(organizationId: string, invitationId: string): Promise<OrganizationInvitation | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "organizations", organizationId, "invitations", invitationId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    organizationId,
    email: data.email ?? "",
    role: data.role ?? "viewer",
    status: data.status ?? "pending",
    invitedBy: data.invitedBy ?? "",
    createdAt: toIso(data.createdAt),
    acceptedAt: data.acceptedAt ? toIso(data.acceptedAt) : undefined
  };
}

export async function acceptOrganizationInvitation(input: {
  organizationId: string;
  invitationId: string;
  userId: string;
  email: string;
  displayName: string;
}) {
  const db = getFirebaseFirestore();
  const invitationRef = doc(db, "organizations", input.organizationId, "invitations", input.invitationId);
  const invitation = await getDoc(invitationRef);
  if (!invitation.exists()) throw new Error("This invitation could not be found.");
  const data = invitation.data();
  if (data.status !== "pending") throw new Error("This invitation is no longer available.");
  if ((data.email ?? "").toLowerCase() !== input.email.toLowerCase()) {
    throw new Error("Sign in with the email address that received this invitation.");
  }

  const batch = writeBatch(db);
  batch.set(doc(db, "organizations", input.organizationId, "members", input.userId), {
    userId: input.userId,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    role: data.role ?? "viewer",
    status: "active",
    joinedAt: serverTimestamp()
  });
  batch.set(doc(db, "users", input.userId, "organizations", input.organizationId), {
    organizationId: input.organizationId,
    role: data.role ?? "viewer",
    joinedAt: serverTimestamp()
  });
  batch.update(invitationRef, {
    status: "accepted",
    acceptedBy: input.userId,
    acceptedAt: serverTimestamp()
  });
  batch.set(doc(db, "users", input.userId), {
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    updatedAt: serverTimestamp()
  }, { merge: true });
  await batch.commit();
}

export async function listOrganizationAgreements(organizationId: string): Promise<OrganizationAgreement[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "agreements"));
  return snapshots.docs.map((snapshot) => agreementFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function signOrganizationAgreement(input: {
  organizationId: string;
  agreementId: string;
  userId: string;
  signedByName: string;
  signedByTitle: string;
  electronicRecordsAccepted: boolean;
}) {
  if (!input.electronicRecordsAccepted) throw new Error("Electronic records must be accepted before signing online.");
  await updateDoc(doc(getFirebaseFirestore(), "organizations", input.organizationId, "agreements", input.agreementId), {
    status: "signed",
    signedAt: serverTimestamp(),
    signedByUserId: input.userId,
    signedByName: input.signedByName.trim(),
    signedByTitle: input.signedByTitle.trim(),
    electronicRecordsAccepted: true
  });
}

export async function listOrganizationExperiences(organizationId: string): Promise<OrganizationExperience[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "experiences"));
  return snapshots.docs.map((snapshot) => experienceFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => (a.startsAt ?? a.createdAt).localeCompare(b.startsAt ?? b.createdAt));
}

export async function listOrganizationSuggestedDates(organizationId: string): Promise<OrganizationSuggestedDate[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "suggestedDates"));
  return snapshots.docs.map((snapshot) => suggestedDateFrom(organizationId, dataOf(snapshot)))
    .filter((item) => item.status === "suggested" || item.status === "interested")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function expressInterestInSuggestedDate(organizationId: string, suggestionId: string) {
  await updateDoc(doc(getFirebaseFirestore(), "organizations", organizationId, "suggestedDates", suggestionId), {
    status: "interested",
    respondedAt: serverTimestamp()
  });
}

export async function listOrganizationAssets(organizationId: string): Promise<OrganizationAsset[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "assets"));
  return snapshots.docs.map((snapshot) => assetFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "admins", userId));
  return snapshot.exists() && snapshot.data().active !== false;
}

export async function listAdminOrganizations(): Promise<OrganizationAccount[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations"));
  return snapshots.docs.map((snapshot) => accountFrom(snapshot.id, snapshot.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createAdminExperience(input: {
  organizationId: string;
  title: string;
  experienceType: string;
  status: OrganizationExperienceStatus;
  startsAt?: string;
  venue?: string;
}) {
  const db = getFirebaseFirestore();
  const experienceRef = doc(collection(db, "organizations", input.organizationId, "experiences"));
  await setDoc(experienceRef, {
    organizationId: input.organizationId,
    title: input.title.trim(),
    experienceType: input.experienceType.trim() || "program",
    status: input.status,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    venue: input.venue?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return experienceRef.id;
}

export async function createAdminAgreement(input: {
  organizationId: string;
  title: string;
  kind: OrganizationAgreementKind;
  documentVersion: string;
  documentUrl?: string;
  relatedExperienceId?: string;
}) {
  const db = getFirebaseFirestore();
  const agreementRef = doc(collection(db, "organizations", input.organizationId, "agreements"));
  await setDoc(agreementRef, {
    organizationId: input.organizationId,
    title: input.title.trim(),
    kind: input.kind,
    documentVersion: input.documentVersion.trim() || "1",
    documentUrl: input.documentUrl?.trim() || null,
    relatedExperienceId: input.relatedExperienceId || null,
    status: "requested",
    requestedAt: serverTimestamp()
  });
  return agreementRef.id;
}

export async function createAdminSuggestedDate(input: {
  organizationId: string;
  startsAt: string;
  label?: string;
}) {
  const db = getFirebaseFirestore();
  const suggestionRef = doc(collection(db, "organizations", input.organizationId, "suggestedDates"));
  await setDoc(suggestionRef, {
    organizationId: input.organizationId,
    startsAt: new Date(input.startsAt),
    label: input.label?.trim() || null,
    status: "suggested",
    createdAt: serverTimestamp()
  });
  return suggestionRef.id;
}

export async function createAdminAsset(input: {
  organizationId: string;
  experienceId: string;
  title: string;
  kind: OrganizationAssetKind;
  downloadUrl?: string;
  storagePath?: string;
}) {
  const db = getFirebaseFirestore();
  const assetRef = doc(collection(db, "organizations", input.organizationId, "assets"));
  await setDoc(assetRef, {
    organizationId: input.organizationId,
    experienceId: input.experienceId,
    title: input.title.trim(),
    kind: input.kind,
    status: input.downloadUrl || input.storagePath ? "ready" : "processing",
    downloadUrl: input.downloadUrl?.trim() || null,
    storagePath: input.storagePath?.trim() || null,
    createdAt: serverTimestamp()
  });
  return assetRef.id;
}
