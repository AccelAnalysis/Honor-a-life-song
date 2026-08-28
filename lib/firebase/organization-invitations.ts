import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { getFirebaseFirestore } from "./client";

export async function acceptOrganizationInvitationSecure(input: {
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
