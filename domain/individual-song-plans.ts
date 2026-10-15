/**
 * Direct-to-consumer packages from the January 2026 song specs.
 * Shown for review on the guest plan row. Not an approved billing catalog.
 */

export const individualSongPlanIds = ["cheers", "spotlight", "encore"] as const;

export type IndividualSongPlanId = (typeof individualSongPlanIds)[number];

export type IndividualSongPlan = {
  id: IndividualSongPlanId;
  name: string;
  priceCents: number;
  benefits: readonly string[];
};

export const individualSongPlans: readonly IndividualSongPlan[] = [
  {
    id: "cheers",
    name: "Cheers",
    priceCents: 995,
    benefits: [
      "Personalized song from simple guided prompts",
      "Songwriter quality check",
      "MP3 and Song Card",
      "No revisions"
    ]
  },
  {
    id: "spotlight",
    name: "Spotlight",
    priceCents: 1_995,
    benefits: [
      "Everything in Cheers",
      "A songwriter personalization touch",
      "Optional personal note",
      "Lyric image"
    ]
  },
  {
    id: "encore",
    name: "Encore",
    priceCents: 2_995,
    benefits: [
      "Everything in Spotlight",
      "A 3–5-minute voice message or written Q&A",
      "One revision",
      "QR-enabled Song Card page"
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
