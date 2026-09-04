import { nativeAction } from "./native-services";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp
} from "firebase/firestore";
import type {
  ExperienceAccessInvitation,
  ExperienceAccessRecipient,
  ExperienceAssetAudience,
  ExperienceAssetEntitlement,
  ExperienceConsentRecord,
  ExperienceParticipant,
  ExperienceParticipantStatus,
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
import type { ConsentScope, ConsentState } from "@/domain/consent";
import {
  entitlementConsentScopes,
  getExperienceOffering,
  normalizeExperienceOfferingId,
  type ExperienceOfferingId
} from "@/domain/experience";
import type { OrganizationKind } from "@/domain/types";
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
    title: data.title,
    directPhone: data.directPhone ?? data.phone,
    preferredContactMethod: data.preferredContactMethod,
    isPrimaryContact: data.isPrimaryContact ?? data.primaryContact,
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
  const offeringId = normalizeExperienceOfferingId(data.offeringId ?? data.experienceType) ?? "honor-a-life-song-experience";
  const offering = getExperienceOffering(offeringId);
  return {
    id: data.id,
    organizationId,
    title: data.title ?? "Honor a Life Song experience",
    offeringId,
    templateKind: data.templateKind ?? offering?.templateKind ?? "full_program",
    participantMode: data.participantMode ?? offering?.participantMode ?? "named_roster",
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
    organizationVisible: data.organizationVisible === true,
    participantId: data.participantId,
    storagePath: data.storagePath,
    downloadUrl: data.downloadUrl,
    createdAt: toIso(data.createdAt)
  };
}

function participantFrom(organizationId: string, experienceId: string, data: ReturnType<typeof dataOf>): ExperienceParticipant {
  return {
    id: data.id,
    organizationId,
    experienceId,
    displayName: data.displayName ?? "Participant",
    participationStatus: data.participationStatus ?? "enrolled",
    permissionReadiness: data.permissionReadiness ?? "not_requested",
    familyContactName: data.familyContactName,
    familyContactEmail: data.familyContactEmail,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function consentFrom(organizationId: string, experienceId: string, participantId: string, data: ReturnType<typeof dataOf>): ExperienceConsentRecord {
  return {
    id: data.id,
    organizationId,
    experienceId,
    participantId,
    state: data.state ?? "pending",
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    restrictions: Array.isArray(data.restrictions) ? data.restrictions : [],
    authorityBasis: data.authorityBasis ?? "self",
    signedByName: data.signedByName ?? "",
    source: data.source ?? "paper",
    participantDeliveryEmail: data.participantDeliveryEmail ?? undefined,
    designatedFamilyEmails: Array.isArray(data.designatedFamilyEmails) ? data.designatedFamilyEmails : [],
    version: typeof data.version === "number" ? data.version : 1,
    effectiveAt: data.effectiveAt ? toIso(data.effectiveAt) : undefined,
    withdrawnAt: data.withdrawnAt ? toIso(data.withdrawnAt) : undefined,
    createdAt: toIso(data.createdAt)
  };
}

function entitlementFrom(organizationId: string, experienceId: string, data: ReturnType<typeof dataOf>): ExperienceAssetEntitlement {
  return {
    id: data.id,
    organizationId,
    experienceId,
    assetId: data.assetId ?? "",
    participantId: data.participantId ?? "",
    audience: data.audience ?? "participant",
    consentRecordId: data.consentRecordId ?? "",
    requiredConsentScopes: Array.isArray(data.requiredConsentScopes) ? data.requiredConsentScopes : [],
    authorizedRecipientEmails: Array.isArray(data.authorizedRecipientEmails) ? data.authorizedRecipientEmails : [],
    status: data.status ?? "pending",
    createdAt: toIso(data.createdAt),
    revokedAt: data.revokedAt ? toIso(data.revokedAt) : undefined
  };
}

function accessInvitationFrom(organizationId: string, experienceId: string, data: ReturnType<typeof dataOf>): ExperienceAccessInvitation {
  return {
    id: data.id,
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
  if (!input.organizationName.trim()) throw new Error("Enter the organization name.");
  const db = getFirebaseFirestore();
  const existingOrganizations = await listUserOrganizations(input.userId);
  if (existingOrganizations[0]) return existingOrganizations[0].id;

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
    try {
      const snapshot = await getDoc(doc(db, "organizations", organizationId));
      return snapshot.exists() ? accountFrom(snapshot.id, snapshot.data()) : null;
    } catch {
      // A stale discovery pointer must not prevent access to the user's valid organizations.
      return null;
    }
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
  const snapshots = await getDocs(query(
    collection(getFirebaseFirestore(), "organizations", organizationId, "assets"),
    where("organizationVisible", "==", true)
  ));
  return snapshots.docs.map((snapshot) => assetFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminOrganizationAssets(organizationId: string): Promise<OrganizationAsset[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "assets"));
  return snapshots.docs.map((snapshot) => assetFrom(organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listExperienceParticipants(organizationId: string, experienceId: string): Promise<ExperienceParticipant[]> {
  const snapshots = await getDocs(collection(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "participants"
  ));
  return snapshots.docs.map((snapshot) => participantFrom(organizationId, experienceId, dataOf(snapshot)))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createExperienceParticipant(input: {
  organizationId: string;
  experienceId: string;
  displayName: string;
  participationStatus?: ExperienceParticipantStatus;
  familyContactName?: string;
  familyContactEmail?: string;
}) {
  if (!input.displayName.trim()) throw new Error("Enter the participant name.");
  const db = getFirebaseFirestore();
  const participantRef = doc(collection(
    db,
    "organizations",
    input.organizationId,
    "experiences",
    input.experienceId,
    "participants"
  ));
  await setDoc(participantRef, {
    organizationId: input.organizationId,
    experienceId: input.experienceId,
    displayName: input.displayName.trim(),
    participationStatus: input.participationStatus ?? "enrolled",
    permissionReadiness: "not_requested",
    familyContactName: input.familyContactName?.trim() || null,
    familyContactEmail: input.familyContactEmail?.trim().toLowerCase() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return participantRef.id;
}

export async function listExperienceConsentRecords(
  organizationId: string,
  experienceId: string,
  participantId: string
): Promise<ExperienceConsentRecord[]> {
  const snapshots = await getDocs(collection(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "participants",
    participantId,
    "consents"
  ));
  return snapshots.docs.map((snapshot) => consentFrom(organizationId, experienceId, participantId, dataOf(snapshot)))
    .sort((a, b) => b.version - a.version);
}

export async function createAdminParticipantConsent(input: {
  organizationId: string;
  experienceId: string;
  participantId: string;
  state: ConsentState;
  scopes: ConsentScope[];
  restrictions?: string[];
  authorityBasis: "self" | "authorized_representative";
  signedByName: string;
  source: "electronic" | "paper";
  participantDeliveryEmail?: string;
  designatedFamilyEmails?: string[];
}) {
  return nativeAction<string>("saveConsent", input);
}

export async function listExperienceEntitlements(organizationId: string, experienceId: string): Promise<ExperienceAssetEntitlement[]> {
  const snapshots = await getDocs(collection(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "entitlements"
  ));
  return snapshots.docs.map((snapshot) => entitlementFrom(organizationId, experienceId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listExperienceAccessInvitations(organizationId: string, experienceId: string): Promise<ExperienceAccessInvitation[]> {
  const snapshots = await getDocs(collection(
    getFirebaseFirestore(),
    "organizations",
    organizationId,
    "experiences",
    experienceId,
    "accessInvitations"
  ));
  return snapshots.docs.map((snapshot) => accessInvitationFrom(organizationId, experienceId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createExperienceAccessInvitation(input: {
  organization: OrganizationAccount;
  experience: OrganizationExperience;
  participant: ExperienceParticipant;
  recipient: ExperienceAccessRecipient;
  recipientEmail: string;
  recipientName?: string;
  invitedBy: string;
}): Promise<ExperienceAccessInvitation> {
  if (input.experience.organizationId !== input.organization.id
    || input.participant.organizationId !== input.organization.id
    || input.participant.experienceId !== input.experience.id) {
    throw new Error("The participant, experience, and organization must belong together.");
  }
  if (!input.recipientEmail.trim()) throw new Error("Enter the recipient email address.");
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const entitlements = await listExperienceEntitlements(input.organization.id, input.experience.id);
  const audience = input.recipient === "participant" ? "participant" : "designated_family";
  const eligibleEntitlements = entitlements.filter((entitlement) => (
    entitlement.participantId === input.participant.id
      && entitlement.audience === audience
      && entitlement.status === "active"
      && entitlement.authorizedRecipientEmails.includes(recipientEmail)
  ));
  if (eligibleEntitlements.length === 0) {
    throw new Error("No permissioned materials are ready for this recipient email yet.");
  }

  const db = getFirebaseFirestore();
  const invitationRef = doc(collection(
    db,
    "organizations",
    input.organization.id,
    "experiences",
    input.experience.id,
    "accessInvitations"
  ));
  await setDoc(invitationRef, {
    organizationId: input.organization.id,
    organizationName: input.organization.name,
    experienceId: input.experience.id,
    experienceTitle: input.experience.title,
    participantId: input.participant.id,
    participantName: input.participant.displayName,
    recipient: input.recipient,
    recipientEmail,
    recipientName: input.recipientName?.trim() || null,
    entitlementIds: eligibleEntitlements.map((entitlement) => entitlement.id),
    status: "pending",
    invitedBy: input.invitedBy,
    createdAt: serverTimestamp()
  });
  return {
    id: invitationRef.id,
    organizationId: input.organization.id,
    organizationName: input.organization.name,
    experienceId: input.experience.id,
    experienceTitle: input.experience.title,
    participantId: input.participant.id,
    participantName: input.participant.displayName,
    recipient: input.recipient,
    recipientEmail,
    recipientName: input.recipientName?.trim() || undefined,
    entitlementIds: eligibleEntitlements.map((entitlement) => entitlement.id),
    status: "pending",
    invitedBy: input.invitedBy,
    createdAt: new Date().toISOString()
  };
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
  offeringId: ExperienceOfferingId;
  status: OrganizationExperienceStatus;
  startsAt?: string;
  venue?: string;
}) {
  const db = getFirebaseFirestore();
  if (!input.title.trim()) throw new Error("Enter an experience title.");
  const offering = getExperienceOffering(input.offeringId);
  if (!offering) throw new Error("Choose a supported organization experience.");
  const experienceRef = doc(collection(db, "organizations", input.organizationId, "experiences"));
  await setDoc(experienceRef, {
    organizationId: input.organizationId,
    title: input.title.trim(),
    offeringId: offering.id,
    templateKind: offering.templateKind,
    participantMode: offering.participantMode,
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
  participantId?: string;
  audiences: ExperienceAssetAudience[];
  downloadUrl?: string;
  storagePath?: string;
}) {
  const db = getFirebaseFirestore();
  const audiences = [...new Set(input.audiences)];
  if (audiences.length === 0) throw new Error("Choose at least one audience for this material.");
  const recipientAudiences = audiences.filter(
    (audience): audience is Exclude<ExperienceAssetAudience, "organization"> => audience !== "organization"
  );
  if (recipientAudiences.length > 0 && !input.participantId) {
    throw new Error("Choose the participant whose materials are being released.");
  }

  const consentRecords = input.participantId
    ? await listExperienceConsentRecords(input.organizationId, input.experienceId, input.participantId)
    : [];
  const consentByAudience = new Map<Exclude<ExperienceAssetAudience, "organization">, ExperienceConsentRecord>();
  for (const audience of recipientAudiences) {
    const requiredScopes = entitlementConsentScopes[audience];
    const consent = consentRecords.find((record) => (
      record.state === "active"
        && requiredScopes.every((scope) => record.scopes.includes(scope))
    ));
    if (!consent) {
      throw new Error(audience === "designated_family"
        ? "Active designated-family sharing permission is required before releasing this material."
        : "Active participant permission is required before releasing this material.");
    }
    if (audience === "participant" && !consent.participantDeliveryEmail) {
      throw new Error("Record the participant delivery email on the active permission form before releasing this material.");
    }
    if (audience === "designated_family" && consent.designatedFamilyEmails.length === 0) {
      throw new Error("Record the designated family recipient email on the active permission form before releasing this material.");
    }
    consentByAudience.set(audience, consent);
  }

  const assetRef = doc(collection(db, "organizations", input.organizationId, "assets"));
  const readyForDelivery = Boolean(input.downloadUrl?.trim());
  const batch = writeBatch(db);
  batch.set(assetRef, {
    organizationId: input.organizationId,
    experienceId: input.experienceId,
    title: input.title.trim(),
    kind: input.kind,
    status: readyForDelivery ? "ready" : "processing",
    organizationVisible: audiences.includes("organization"),
    participantId: input.participantId || null,
    downloadUrl: input.downloadUrl?.trim() || null,
    storagePath: input.storagePath?.trim() || null,
    createdAt: serverTimestamp()
  });
  for (const audience of recipientAudiences) {
    const consent = consentByAudience.get(audience);
    if (!consent || !input.participantId) continue;
    const entitlementRef = doc(collection(
      db,
      "organizations",
      input.organizationId,
      "experiences",
      input.experienceId,
      "entitlements"
    ));
    batch.set(entitlementRef, {
      organizationId: input.organizationId,
      experienceId: input.experienceId,
      assetId: assetRef.id,
      participantId: input.participantId,
      audience,
      consentRecordId: consent.id,
      requiredConsentScopes: entitlementConsentScopes[audience],
      authorizedRecipientEmails: audience === "participant"
        ? consent.participantDeliveryEmail ? [consent.participantDeliveryEmail] : []
        : consent.designatedFamilyEmails,
      status: readyForDelivery ? "active" : "pending",
      createdAt: serverTimestamp()
    });
  }
  await batch.commit();
  return assetRef.id;
}
