/**
 * Individual SongKeep packages shown in the create flow, on Services, and on Pricing.
 * Stripe checkout reads priceCents and productName from the Firestore product
 * for that request. This repo does not store Stripe price IDs. The display ids
 * are song-keep, song-keep-music, and song-keep-signature.
 */

export const individualSongPlanIds = ["song-keep", "song-keep-music", "song-keep-signature"] as const;

export type IndividualSongPlanId = (typeof individualSongPlanIds)[number];

export type IndividualSongPlan = {
  id: IndividualSongPlanId;
  name: string;
  priceCents: number;
  benefits: readonly string[];
  featured?: boolean;
  badge?: string | null;
};

export const individualSongPlans: readonly IndividualSongPlan[] = [
  {
    id: "song-keep",
    name: "Song Keep",
    priceCents: 1_900,
    benefits: [
      "Personalized lyrics",
      "A beautiful keepsake lyric PDF",
      "Editable before you finalize",
      "Save and share"
    ]
  },
  {
    id: "song-keep-music",
    name: "Song Keep + Music",
    priceCents: 3_900,
    featured: true,
    badge: "Most popular",
    benefits: [
      "Everything in Song Keep",
      "A complete personalized song",
      "An MP3",
      "A keepsake lyric PDF",
      "A private shareable song page"
    ]
  },
  {
    id: "song-keep-signature",
    name: "Song Keep Signature",
    priceCents: 5_900,
    benefits: [
      "Everything in Song Keep + Music",
      "Songwriter's Touch™",
      "Tina personally reviews and personalizes the chorus or a key section",
      "A personalized dedication",
      "A premium keepsake PDF",
      "A QR code to the song"
    ]
  }
];

export const individualSongAddOns: readonly { id: string; name: string; priceCents: number }[] = [
  { id: "additional-revision", name: "Additional revision", priceCents: 500 },
  { id: "spoken-dedication", name: "Spoken dedication introduction", priceCents: 500 },
  { id: "lyric-pdf", name: "Lyric PDF and QR keepsake", priceCents: 500 },
  { id: "lyric-video", name: "Image-to-song / lyric video", priceCents: 1_000 },
  { id: "rush-delivery", name: "Rush delivery", priceCents: 1_000 }
];

export function getIndividualSongPlan(id: string | null | undefined): IndividualSongPlan | undefined {
  return individualSongPlans.find((plan) => plan.id === id);
}

export function formatPlanPrice(priceCents: number): string {
  const hasCents = priceCents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0
  }).format(priceCents / 100);
}
