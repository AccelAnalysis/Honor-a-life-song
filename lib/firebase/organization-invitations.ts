import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch, type Timestamp } from "firebase/firestore";
import type { ExperienceAccessInvitation, UserExperienceAccess } from "@/domain/organization-account";
import { getFirebaseFirestore } from "./client";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate().toISOString();
  return new Date(0).toISOString();
}

export async function acceptOrganizationInvitationSecure(input: {
  organizationId: string;
  invitationId: string;
  userId: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}) {
  if (!input.emailVerified) throw new Error("Verify this email address before accepting the invitation.");
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
    invitationId: input.invitationId,
    joinedAt: serverTimestamp()
  });
  batch.set(doc(db, "users", input.userId, "organizations", input.organizationId), {
    organizationId: input.organizationId,
    role: data.role ?? "viewer",
    invitationId: input.invitationId,
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

export async function getExperienceAccessInvitation(
  organizationId: string,
  experienceId: string,
  invitationId: string
): Promise<ExperienceAccessInvitation | null> {
  const snapshot = await getDoc(doc(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "accessInvitations",
    invitationId
  ));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    organizationId,
    organizationName: data.organizationName ?? "Organization",
    experienceId,
    experienceTitle: data.experienceTitle ?? "Honor a Life Song experience",
    participantId: data.participantId ?? "",
    participantName: data.participantName ?? "Participant",
    recipient: data.recipient ?? "participant",
    recipientEmail: data.recipientEmail ?? "",
    recipientName: data.recipientName,
    entitlementIds: Array.isArray(data.entitlementIds) ? data.entitlementIds : [],
    status: data.status ?? "pending",
    invitedBy: data.invitedBy ?? "",
    createdAt: toIso(data.createdAt),
    expiresAt: data.expiresAt ? toIso(data.expiresAt) : undefined,
    acceptedBy: data.acceptedBy,
    acceptedAt: data.acceptedAt ? toIso(data.acceptedAt) : undefined,
    deliveryToken: data.deliveryToken
  };
}

export async function acceptExperienceAccessInvitationSecure(input: {
  organizationId: string;
  experienceId: string;
  invitationId: string;
  userId: string;
  email: string;
  emailVerified: boolean;
}) {
  if (!input.emailVerified) throw new Error("Verify this email address before accepting access.");
  const db = getFirebaseFirestore();
  const invitationRef = doc(
    db,
    "organizations",
    input.organizationId,
    "experiences",
    input.experienceId,
    "accessInvitations",
    input.invitationId
  );
  const invitation = await getDoc(invitationRef);
  if (!invitation.exists()) throw new Error("This access invitation could not be found.");
  const data = invitation.data();
  if (data.status !== "pending") throw new Error("This access invitation is no longer available.");
  if ((data.recipientEmail ?? "").toLowerCase() !== input.email.toLowerCase()) {
    throw new Error("Sign in with the verified email address that received this access invitation.");
  }

  const accessRef = doc(db, "users", input.userId, "experienceAccess", input.invitationId);
  const batch = writeBatch(db);
  batch.set(accessRef, {
    organizationId: input.organizationId,
    organizationName: data.organizationName ?? "Organization",
    experienceId: input.experienceId,
    experienceTitle: data.experienceTitle ?? "Honor a Life Song experience",
    participantId: data.participantId ?? "",
    participantName: data.participantName ?? "Participant",
    recipient: data.recipient ?? "participant",
    entitlementIds: Array.isArray(data.entitlementIds) ? data.entitlementIds : [],
    invitationId: input.invitationId,
    deliveryToken: data.deliveryToken ?? null,
    acceptedAt: serverTimestamp()
  });
  batch.update(invitationRef, {
    status: "accepted",
    acceptedBy: input.userId,
    acceptedAt: serverTimestamp()
  });
  await batch.commit();
}

export async function listUserExperienceAccess(userId: string): Promise<UserExperienceAccess[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "users", userId, "experienceAccess"));
  return snapshots.docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      organizationId: data.organizationId ?? "",
      organizationName: data.organizationName ?? "Organization",
      experienceId: data.experienceId ?? "",
      experienceTitle: data.experienceTitle ?? "Honor a Life Song experience",
      participantId: data.participantId ?? "",
      participantName: data.participantName ?? "Participant",
      recipient: data.recipient ?? "participant",
      entitlementIds: Array.isArray(data.entitlementIds) ? data.entitlementIds : [],
      acceptedAt: toIso(data.acceptedAt),
      deliveryToken: data.deliveryToken
    } satisfies UserExperienceAccess;
  }).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
}
