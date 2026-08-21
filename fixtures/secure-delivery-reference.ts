import type { ConsentRecord } from "../domain/consent";
import type { DeliveryAccessContext } from "../domain/delivery";

const activeReferenceConsent: ConsentRecord = {
  id: "reference-consent-active",
  subjectPersonId: "reference-subject",
  grantedByPersonId: "reference-subject",
  authorityBasis: "self",
  state: "active",
  scopes: ["designated_family_sharing", "private_performance"],
  restrictions: [],
  version: 1
};

const withdrawnReferenceConsent: ConsentRecord = {
  ...activeReferenceConsent,
  id: "reference-consent-withdrawn",
  state: "withdrawn",
  withdrawnAt: "2026-08-21T12:00:00Z"
};

const approvedAssets = [
  {
    id: "reference-final-audio",
    sourceEntityId: "reference-media-final-audio",
    creativeWorkId: "reference-creative-work",
    kind: "final_audio" as const,
    label: "Approved final song",
    included: true,
    approved: true,
    actions: ["listen", "download"] as const,
    requiredConsentScopes: ["designated_family_sharing"] as const,
    approvedVersionId: "reference-final-recording-approval"
  },
  {
    id: "reference-approved-lyrics",
    sourceEntityId: "reference-lyric-version-3",
    creativeWorkId: "reference-creative-work",
    kind: "approved_lyrics" as const,
    label: "Approved lyrics · version 3",
    included: true,
    approved: true,
    actions: ["view", "download"] as const,
    requiredConsentScopes: ["designated_family_sharing"] as const,
    approvedVersionId: "reference-lyric-version-3"
  },
  {
    id: "reference-approved-story",
    sourceEntityId: "reference-approved-story-selection",
    creativeWorkId: "reference-creative-work",
    kind: "approved_story" as const,
    label: "Approved story selection",
    included: true,
    approved: true,
    actions: ["view"] as const,
    requiredConsentScopes: ["designated_family_sharing"] as const
  },
  {
    id: "reference-photo-not-included",
    sourceEntityId: "reference-photo-source",
    creativeWorkId: "reference-creative-work",
    kind: "approved_photo" as const,
    label: "Approved photo",
    included: false,
    approved: true,
    actions: ["view"] as const,
    requiredConsentScopes: ["designated_family_sharing"] as const
  }
];

function baseContext(): DeliveryAccessContext {
  return {
    deliveryId: "reference-delivery",
    creativeWorkId: "reference-creative-work",
    entryMechanism: "secure_link",
    tokenState: "valid",
    verificationState: "verified",
    recipientPersonId: "reference-recipient",
    entitled: true,
    consentRecord: activeReferenceConsent,
    deliveryConsentScopes: ["designated_family_sharing"],
    assets: approvedAssets.map((asset) => ({ ...asset, actions: [...asset.actions], requiredConsentScopes: [...asset.requiredConsentScopes] })),
    controlledSharingAllowed: true,
    confirmation: { state: "available_unconfirmed" },
    qrKeepsakeCapability: "planned_p1"
  };
}

export const referenceDeliveryScenarios: Record<string, DeliveryAccessContext> = {
  "reference-preview": baseContext(),
  "reference-qr-entry": { ...baseContext(), entryMechanism: "qr" },
  "reference-verify": { ...baseContext(), verificationState: "required" },
  "reference-expired": { ...baseContext(), tokenState: "expired" },
  "reference-revoked": { ...baseContext(), tokenState: "revoked" },
  "reference-consent-blocked": { ...baseContext(), consentRecord: withdrawnReferenceConsent },
  "reference-asset-unavailable": {
    ...baseContext(),
    assets: approvedAssets.map((asset) => ({ ...asset, included: false, actions: [...asset.actions], requiredConsentScopes: [...asset.requiredConsentScopes] }))
  },
  "reference-access-denied": { ...baseContext(), entitled: false }
};

export const referenceDeliveryTokens = Object.keys(referenceDeliveryScenarios);

export function getReferenceDelivery(deliveryToken: string): DeliveryAccessContext | undefined {
  return referenceDeliveryScenarios[deliveryToken];
}
