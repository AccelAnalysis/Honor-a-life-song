import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";
import type { PreferredContactMethod } from "@/domain/organization-account";
import type { OrganizationKind } from "@/domain/types";
import { getFirebaseFirestore } from "./client";
import { listUserOrganizations } from "./organization-account";

export interface OrganizationOnboardingInput {
  userId: string;
  contactEmail: string;
  contactName: string;
  contactTitle?: string;
  contactPhone?: string;
  preferredContactMethod: PreferredContactMethod;
  organizationName: string;
  organizationKind: OrganizationKind;
  organizationEmail?: string;
  organizationPhone?: string;
}

/**
 * The organization is the durable commercial customer. The signed-in person is
 * stored as its primary contact so the role can later change without moving the
 * organization's orders, invoices, experiences, or relationship history.
 */
export async function createOrganizationRelationship(input: OrganizationOnboardingInput) {
  if (!input.organizationName.trim()) throw new Error("Enter the organization name.");
  if (!input.contactName.trim()) throw new Error("Enter the primary contact name.");

  const db = getFirebaseFirestore();
  const existingOrganizations = await listUserOrganizations(input.userId);
  const existing = existingOrganizations[0];
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const organizationEmail = input.organizationEmail?.trim().toLowerCase() || undefined;

  if (existing) {
    await Promise.all([
      setDoc(doc(db, "organizations", existing.id), {
        name: input.organizationName.trim(),
        kind: input.organizationKind,
        organizationEmail: organizationEmail ?? null,
        billingEmail: organizationEmail ?? contactEmail,
        phone: input.organizationPhone?.trim() || null,
        primaryContactUserId: input.userId,
        updatedAt: serverTimestamp()
      }, { merge: true }),
      setDoc(doc(db, "organizations", existing.id, "members", input.userId), {
        userId: input.userId,
        email: contactEmail,
        displayName: input.contactName.trim(),
        title: input.contactTitle?.trim() || null,
        directPhone: input.contactPhone?.trim() || null,
        preferredContactMethod: input.preferredContactMethod,
        isPrimaryContact: true,
        role: "organization_admin",
        status: "active",
        updatedAt: serverTimestamp()
      }, { merge: true }),
      setDoc(doc(db, "users", input.userId), {
        email: contactEmail,
        displayName: input.contactName.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true })
    ]);
    return existing.id;
  }

  const organizationRef = doc(collection(db, "organizations"));
  const memberRef = doc(db, "organizations", organizationRef.id, "members", input.userId);
  const userOrganizationRef = doc(db, "users", input.userId, "organizations", organizationRef.id);
  const userRef = doc(db, "users", input.userId);
  const batch = writeBatch(db);

  batch.set(organizationRef, {
    name: input.organizationName.trim(),
    kind: input.organizationKind,
    organizationEmail: organizationEmail ?? null,
    billingEmail: organizationEmail ?? contactEmail,
    phone: input.organizationPhone?.trim() || null,
    primaryContactUserId: input.userId,
    createdBy: input.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.set(memberRef, {
    userId: input.userId,
    email: contactEmail,
    displayName: input.contactName.trim(),
    title: input.contactTitle?.trim() || null,
    directPhone: input.contactPhone?.trim() || null,
    preferredContactMethod: input.preferredContactMethod,
    isPrimaryContact: true,
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
    email: contactEmail,
    displayName: input.contactName.trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  await batch.commit();
  return organizationRef.id;
}
