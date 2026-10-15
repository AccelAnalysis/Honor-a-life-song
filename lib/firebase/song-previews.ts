import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { httpsAudioLink, safePreviewFileName, type PreviewTrack } from "@/lib/preview-library";
import { getFirebaseFirestore, getFirebaseStorage } from "./client";

function playable(id: string, data: { title?: string; credit?: string; audioUrl?: string }): PreviewTrack | null {
  const src = data.audioUrl ?? "";
  if (!src.startsWith("https://") && !src.startsWith("/")) return null;
  return { id, title: data.title || "Preview", credit: data.credit || "SongKeep preview", src };
}

export async function listPublishedPreviews(): Promise<PreviewTrack[]> {
  const snapshots = await getDocs(query(collection(getFirebaseFirestore(), "songPreviews"), where("published", "==", true)));
  const tracks: PreviewTrack[] = [];
  for (const snapshot of snapshots.docs) {
    const data = snapshot.data();
    let audioUrl = typeof data.audioUrl === "string" ? data.audioUrl : "";
    if (!audioUrl && typeof data.storagePath === "string" && data.storagePath) {
      audioUrl = await getDownloadURL(ref(getFirebaseStorage(), data.storagePath));
    }
    const track = playable(snapshot.id, { title: data.title, credit: data.credit, audioUrl });
    if (track) tracks.push(track);
  }
  return tracks;
}

export async function publishPreviewLink(input: { title: string; audioUrl: string; createdByUserId: string; assignmentId: string }) {
  const title = input.title.trim();
  if (!title || title.length > 120) throw new Error("Enter a title for this preview.");
  const audioUrl = httpsAudioLink(input.audioUrl);
  const previewRef = doc(collection(getFirebaseFirestore(), "songPreviews"));
  await setDoc(previewRef, {
    title,
    credit: "SongKeep preview",
    kind: "link",
    audioUrl,
    storagePath: "",
    assignmentId: input.assignmentId,
    published: true,
    status: "ready",
    createdByUserId: input.createdByUserId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return previewRef.id;
}

export async function publishPreviewFile(input: { title: string; file: File; createdByUserId: string; assignmentId: string }) {
  const title = input.title.trim();
  if (!title || title.length > 120) throw new Error("Enter a title for this preview.");
  if (!input.file.size || input.file.size > 15 * 1024 * 1024) throw new Error("Choose an audio file of 15 MB or less.");
  if (input.file.type && !input.file.type.startsWith("audio/")) throw new Error("Choose an audio file.");
  const previewRef = doc(collection(getFirebaseFirestore(), "songPreviews"));
  const fileName = safePreviewFileName(input.file.name);
  const storagePath = `song-previews/${previewRef.id}/${fileName}`;
  await setDoc(previewRef, {
    title,
    credit: "SongKeep preview",
    kind: "upload",
    audioUrl: "",
    storagePath,
    assignmentId: input.assignmentId,
    published: false,
    status: "uploading",
    createdByUserId: input.createdByUserId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await uploadBytes(ref(getFirebaseStorage(), storagePath), input.file, { contentType: input.file.type || "audio/mpeg" });
  await updateDoc(previewRef, { published: true, status: "ready", updatedAt: serverTimestamp() });
  return previewRef.id;
}
