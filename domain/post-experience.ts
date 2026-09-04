import type { EntityId, ISODateTime } from "./types";

export const postExperienceProductIds = [
  "digital-song-keepsake",
  "printed-lyric-keepsake",
  "event-memory-collection"
] as const;

export type PostExperienceProductId = (typeof postExperienceProductIds)[number];

export interface PostExperienceProduct {
  id: PostExperienceProductId;
  name: string;
  description: string;
  includes: readonly string[];
  requiresReleasedAssetKinds: readonly string[];
}

export const postExperienceProducts: readonly PostExperienceProduct[] = [
  {
    id: "digital-song-keepsake",
    name: "Digital song keepsake",
    description: "Keep an approved personal or shared song with the materials prepared for your experience.",
    includes: ["Approved song access", "Digital lyric keepsake", "Private SongKeep collection"],
    requiresReleasedAssetKinds: ["song"]
  },
  {
    id: "printed-lyric-keepsake",
    name: "Printed lyric keepsake",
    description: "A presentation-ready printed version of the approved lyrics connected to your SongKeep experience.",
    includes: ["Designed lyric print", "Experience and song details", "Delivery coordination"],
    requiresReleasedAssetKinds: ["lyrics"]
  },
  {
    id: "event-memory-collection",
    name: "Event memory collection",
    description: "Bring together the approved song, lyrics, photographs, and video released from the organization event.",
    includes: ["Approved digital collection", "Private access", "Share controls based on permission"],
    requiresReleasedAssetKinds: ["song"]
  }
] as const;

export type PostExperiencePurchaseStatus =
  | "requested"
  | "checkout_started"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export interface PostExperiencePurchaseIntent {
  id: EntityId;
  userId: EntityId;
  accessId: EntityId;
  organizationId: EntityId;
  experienceId: EntityId;
  participantId: EntityId;
  productId: PostExperienceProductId;
  status: PostExperiencePurchaseStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

const paymentLinkEnvironmentKeys: Record<PostExperienceProductId, string | undefined> = {
  "digital-song-keepsake": process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_DIGITAL_SONG_KEEPSAKE,
  "printed-lyric-keepsake": process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRINTED_LYRIC_KEEPSAKE,
  "event-memory-collection": process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_EVENT_MEMORY_COLLECTION
};

export function getPostExperiencePaymentLink(productId: PostExperienceProductId): string | undefined {
  const value = paymentLinkEnvironmentKeys[productId];
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function buildPostExperiencePaymentLink(input: {
  productId: PostExperienceProductId;
  purchaseIntentId: string;
  customerEmail?: string;
}): string | undefined {
  const configured = getPostExperiencePaymentLink(input.productId);
  if (!configured) return undefined;
  const url = new URL(configured);
  url.searchParams.set("client_reference_id", input.purchaseIntentId);
  if (input.customerEmail) url.searchParams.set("prefilled_email", input.customerEmail);
  return url.toString();
}

export function getPostExperienceProduct(productId: string | null | undefined): PostExperienceProduct | undefined {
  return postExperienceProducts.find((product) => product.id === productId);
}
