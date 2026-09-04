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
import { ref, uploadBytesResumable } from "firebase/storage";
import type {
  CreatorAssignment,
  CreatorAssignmentRole,
  ExperienceAssetAudience,
  ExperienceConsentRecord,
  OrganizationAsset,
  OrganizationAssetKind,
  PlatformUserSummary
} from "@/domain/organization-account";
import { entitlementConsentScopes } from "@/domain/experience";
import { getFirebaseFirestore, getFirebaseStorage } from "./client";
import { listExperienceConsentRecords } from "./organization-account";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate().toISOString();
  return new Date(0).toISOString();
}

function dataOf(snapshot: QueryDocumentSnapshot<DocumentData>): DocumentData & { id: string } {
  return { id: snapshot.id, ...snapshot.data() };
}

function assignmentFrom(data: DocumentData & { id: string }): CreatorAssignment {
  return {
    id: data.id,
    assignedUserId: data.assignedUserId ?? "",
    assignedUserName: data.assignedUserName ?? "Creator",
    assignedUserEmail: data.assignedUserEmail ?? undefined,
    organizationId: data.organizationId ?? "",
    organizationName: data.organizationName ?? "Organization",
    experienceId: data.experienceId ?? "",
    experienceTitle: data.experienceTitle ?? "SongKeep experience",
    participantId: data.participantId ?? undefined,
    participantName: data.participantName ?? undefined,
    role: data.role ?? "songwriter",
    status: data.status ?? "assigned",
    dueAt: data.dueAt ? toIso(data.dueAt) : undefined,
    createdByUserId: data.createdByUserId ?? "",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}

function assetFrom(organizationId: string, data: DocumentData & { id: string }): OrganizationAsset {
  return {
    id: data.id,
    organizationId,
    experienceId: data.experienceId ?? "",
    title: data.title ?? "Creator material",
    kind: data.kind ?? "other",
    status: data.status ?? "processing",
    organizationVisible: data.organizationVisible === true,
    participantId: data.participantId ?? undefined,
    storagePath: data.storagePath ?? undefined,
    downloadUrl: data.downloadUrl ?? undefined,
    workflowStatus: data.workflowStatus ?? undefined,
    assignmentId: data.assignmentId ?? undefined,
    submittedByUserId: data.submittedByUserId ?? undefined,
    submittedByName: data.submittedByName ?? undefined,
    submittedByRole: data.submittedByRole ?? undefined,
    notes: data.notes ?? undefined,
    reviewNotes: data.reviewNotes ?? undefined,
    mimeType: data.mimeType ?? undefined,
    fileName: data.fileName ?? undefined,
    version: typeof data.version === "number" ? data.version : undefined,
    reviewedByUserId: data.reviewedByUserId ?? undefined,
    reviewedAt: data.reviewedAt ? toIso(data.reviewedAt) : undefined,
    releasedAt: data.releasedAt ? toIso(data.releasedAt) : undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: data.updatedAt ? toIso(data.updatedAt) : undefined
  };
}

export async function listCreatorAssignments(userId: string): Promise<CreatorAssignment[]> {
  const snapshots = await getDocs(query(collection(getFirebaseFirestore(), "creatorAssignments"), where("assignedUserId", "==", userId)));
  return snapshots.docs.map((snapshot) => assignmentFrom(dataOf(snapshot)))
    .filter((assignment) => assignment.status !== "cancelled")
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
}

export async function listAdminCreatorAssignments(): Promise<CreatorAssignment[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "creatorAssignments"));
  return snapshots.docs.map((snapshot) => assignmentFrom(dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listCreatorCandidates(): Promise<PlatformUserSummary[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "users"));
  return snapshots.docs.map((snapshot) => ({
    userId: snapshot.id,
    email: snapshot.data().email ?? "",
    displayName: snapshot.data().displayName ?? snapshot.data().email ?? "SongKeep user"
  })).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createAdminCreatorAssignment(input: {
  assignedUser: PlatformUserSummary;
  organizationId: string;
  organizationName: string;
  experienceId: string;
  experienceTitle: string;
  participantId?: string;
  participantName?: string;
  role: CreatorAssignmentRole;
  dueAt?: string;
  createdByUserId: string;
}): Promise<string> {
  if (!input.assignedUser.userId) throw new Error("Choose a creator.");
  if (!input.organizationId || !input.experienceId) throw new Error("Choose an organization experience.");
  const assignmentRef = doc(collection(getFirebaseFirestore(), "creatorAssignments"));
  await setDoc(assignmentRef, {
    assignedUserId: input.assignedUser.userId,
    assignedUserName: input.assignedUser.displayName,
    assignedUserEmail: input.assignedUser.email || null,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    experienceId: input.experienceId,
    experienceTitle: input.experienceTitle,
    participantId: input.participantId || null,
    participantName: input.participantName || null,
    role: input.role,
    status: "assigned",
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    createdByUserId: input.createdByUserId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return assignmentRef.id;
}

export async function listCreatorAssignmentSubmissions(assignment: CreatorAssignment): Promise<OrganizationAsset[]> {
  const snapshots = await getDocs(query(
    collection(getFirebaseFirestore(), "organizations", assignment.organizationId, "assets"),
    where("assignmentId", "==", assignment.id),
    where("submittedByUserId", "==", assignment.assignedUserId)
  ));
  return snapshots.docs.map((snapshot) => assetFrom(assignment.organizationId, dataOf(snapshot)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAdminCreatorSubmissions(organizationId: string, experienceId?: string): Promise<OrganizationAsset[]> {
  const snapshots = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "assets"));
  return snapshots.docs.map((snapshot) => assetFrom(organizationId, dataOf(snapshot)))
    .filter((asset) => Boolean(asset.assignmentId) && (!experienceId || asset.experienceId === experienceId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function safeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").replace(/\.\.+/g, "_");
  return normalized || "material";
}

export async function submitCreatorDeliverable(input: {
  assignment: CreatorAssignment;
  userId: string;
  userName: string;
  title: string;
  kind: OrganizationAssetKind;
  notes?: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  if (input.assignment.assignedUserId !== input.userId) throw new Error("This assignment belongs to another creator.");
  if (!input.title.trim()) throw new Error("Enter a title for this material.");
  if (input.file.size === 0) throw new Error("Choose a file to upload.");
  if (input.file.size > 250 * 1024 * 1024) throw new Error("Files must be 250 MB or smaller.");

  const db = getFirebaseFirestore();
  const assetRef = doc(collection(db, "organizations", input.assignment.organizationId, "assets"));
  const fileName = safeFileName(input.file.name);
  const storagePath = `organizations/${input.assignment.organizationId}/creator-submissions/${input.assignment.id}/${assetRef.id}/${fileName}`;

  await setDoc(assetRef, {
    organizationId: input.assignment.organizationId,
    experienceId: input.assignment.experienceId,
    title: input.title.trim(),
    kind: input.kind,
    status: "processing",
    workflowStatus: "uploading",
    organizationVisible: false,
    assignmentId: input.assignment.id,
    participantId: input.assignment.participantId || null,
    submittedByUserId: input.userId,
    submittedByName: input.userName,
    submittedByRole: input.assignment.role,
    notes: input.notes?.trim() || null,
    reviewNotes: null,
    storagePath,
    downloadUrl: null,
    fileName,
    mimeType: input.file.type || "application/octet-stream",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  try {
    const upload = uploadBytesResumable(ref(getFirebaseStorage(), storagePath), input.file, {
      contentType: input.file.type || "application/octet-stream",
      cacheControl: "private, no-store",
      customMetadata: {
        assignmentId: input.assignment.id,
        experienceId: input.assignment.experienceId,
        submittedByUserId: input.userId
      }
    });
    await new Promise<void>((resolve, reject) => {
      upload.on("state_changed", (snapshot) => {
        input.onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      }, reject, resolve);
    });
    await updateDoc(assetRef, {
      status: "ready",
      workflowStatus: "submitted",
      updatedAt: serverTimestamp()
    });
    return assetRef.id;
  } catch (uploadError) {
    await updateDoc(assetRef, {
      status: "restricted",
      workflowStatus: "upload_failed",
      updatedAt: serverTimestamp()
    }).catch(() => undefined);
    throw uploadError;
  }
}

export async function reviewCreatorDeliverable(input: {
  organizationId: string; assetId: string; reviewedByUserId: string;
  decision: "approved" | "changes_requested" | "rejected"; reviewNotes?: string;
}) { return nativeAction("reviewDeliverable", input); }


export async function releaseCreatorDeliverable(input: {
  organizationId: string; experienceId: string; assetId: string; participantId?: string;
  audiences: ExperienceAssetAudience[]; reviewedByUserId: string; rightsNote?: string;
}) { return nativeAction("release", input); }
