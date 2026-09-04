import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { UserExperienceAccess } from "@/domain/organization-account";
import { getPostExperienceProduct, type PostExperienceProductId } from "@/domain/post-experience";
import { getFirebaseFirestore } from "./client";

/**
 * Creates a source-attributed individual purchase request. The user's claimed
 * access record is retained so rules and downstream payment processing can
 * verify that the purchase originated from a legitimate organization event.
 */
export async function createPostExperiencePurchaseIntent(input: {
  userId: string;
  access: UserExperienceAccess;
  productId: PostExperienceProductId;
}) {
  if (!getPostExperienceProduct(input.productId)) throw new Error("Choose an available keepsake.");
  if (!input.access.id || !input.access.experienceId || !input.access.participantId) {
    throw new Error("This SongKeep experience is not available for individual purchases.");
  }

  const db = getFirebaseFirestore();
  const intentRef = doc(collection(db, "users", input.userId, "purchaseIntents"));
  await setDoc(intentRef, {
    userId: input.userId,
    accessId: input.access.id,
    organizationId: input.access.organizationId,
    experienceId: input.access.experienceId,
    participantId: input.access.participantId,
    productId: input.productId,
    status: "requested",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return intentRef.id;
}
