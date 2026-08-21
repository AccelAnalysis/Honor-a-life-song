import { consentAllows, type ConsentRecord, type ConsentScope } from "./consent";
import type { EntityId, ISODateTime } from "./types";

export const privateSongSections = [
  "Listen",
  "Download",
  "Lyrics",
  "Photos / Approved Story",
  "Share Controls"
] as const;

export const secureDeliveryHierarchy = [
  "Private Song Page",
  "QR Keepsake Landing Page",
  "Access Verification",
  "Expired / Revoked Link",
  "Delivery Confirmation"
] as const;

export type DeliveryTokenState = "valid" | "invalid" | "expired" | "revoked" | "service_unavailable";
export type DeliveryVerificationState = "not_required" | "required" | "verified";
export type DeliveryEntryMechanism = "secure_link" | "qr";
export type DeliveryAssetKind = "final_audio" | "approved_lyrics" | "approved_photo" | "approved_story" | "final_document";
export type DeliveryAssetAction = "listen" | "download" | "view";
export type DeliveryGate = "token" | "verification" | "entitlement" | "consent" | "asset_authorization";
export type DeliveryResolutionState =
  | "available"
  | "invalid"
  | "expired"
  | "revoked"
  | "verification_required"
  | "access_denied"
  | "consent_blocked"
  | "asset_unavailable"
  | "service_unavailable";

export interface DeliveryAssetGrant {
  id: EntityId;
  sourceEntityId: EntityId;
  creativeWorkId: EntityId;
  kind: DeliveryAssetKind;
  label: string;
  included: boolean;
  approved: boolean;
  actions: DeliveryAssetAction[];
  requiredConsentScopes: ConsentScope[];
  approvedVersionId?: EntityId;
}

export interface DeliveryConfirmation {
  state: "not_available" | "available_unconfirmed" | "confirmed";
  confirmedAt?: ISODateTime;
}

export interface DeliveryAccessContext {
  deliveryId: EntityId;
  creativeWorkId: EntityId;
  entryMechanism: DeliveryEntryMechanism;
  tokenState: DeliveryTokenState;
  verificationState: DeliveryVerificationState;
  recipientPersonId?: EntityId;
  entitled: boolean;
  consentRecord?: ConsentRecord;
  deliveryConsentScopes: ConsentScope[];
  assets: DeliveryAssetGrant[];
  controlledSharingAllowed: boolean;
  confirmation: DeliveryConfirmation;
  qrKeepsakeCapability: "planned_p1" | "available";
}

export interface DeliveryResolution {
  state: DeliveryResolutionState;
  completedGates: DeliveryGate[];
  authorizedAssetIds: EntityId[];
}

export interface DeliveryAssetRequest {
  deliveryId: EntityId;
  assetId: EntityId;
  action: DeliveryAssetAction;
}

export type DeliveryActionDecision = { allowed: true } | { allowed: false; reason: string };

export function isPlausibleDeliveryToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{12,256}$/.test(token);
}

function consentAllowsAll(record: ConsentRecord | undefined, scopes: ConsentScope[]): DeliveryActionDecision {
  for (const scope of scopes) {
    const decision = consentAllows(record, scope);
    if (!decision.allowed) return { allowed: false, reason: decision.reason ?? "Consent does not permit this use." };
  }
  return { allowed: true };
}

export function authorizeDeliveryAsset(context: DeliveryAccessContext, request: DeliveryAssetRequest): DeliveryActionDecision {
  if (request.deliveryId !== context.deliveryId) return { allowed: false, reason: "The requested asset is not part of this delivery." };
  if (context.tokenState !== "valid") return { allowed: false, reason: "The delivery credential is not active." };
  if (context.verificationState === "required") return { allowed: false, reason: "Recipient verification is required." };
  if (!context.entitled) return { allowed: false, reason: "The recipient is not entitled to this delivery." };

  const deliveryConsent = consentAllowsAll(context.consentRecord, context.deliveryConsentScopes);
  if (!deliveryConsent.allowed) return deliveryConsent;

  const asset = context.assets.find((candidate) => candidate.id === request.assetId);
  if (!asset || asset.creativeWorkId !== context.creativeWorkId) {
    return { allowed: false, reason: "The requested asset is not part of this delivery." };
  }
  if (!asset.included || !asset.approved) return { allowed: false, reason: "The requested asset is not an approved final delivery asset." };
  if (!asset.actions.includes(request.action)) return { allowed: false, reason: "This delivery does not permit the requested asset action." };

  return consentAllowsAll(context.consentRecord, asset.requiredConsentScopes);
}

export function resolveDeliveryAccess(context: DeliveryAccessContext): DeliveryResolution {
  if (context.tokenState === "service_unavailable") {
    return { state: "service_unavailable", completedGates: [], authorizedAssetIds: [] };
  }
  if (context.tokenState === "invalid") return { state: "invalid", completedGates: [], authorizedAssetIds: [] };
  if (context.tokenState === "expired") return { state: "expired", completedGates: [], authorizedAssetIds: [] };
  if (context.tokenState === "revoked") return { state: "revoked", completedGates: [], authorizedAssetIds: [] };

  const completedGates: DeliveryGate[] = ["token"];

  if (context.verificationState === "required") {
    return { state: "verification_required", completedGates, authorizedAssetIds: [] };
  }
  if (context.verificationState === "verified") completedGates.push("verification");

  if (!context.entitled) return { state: "access_denied", completedGates, authorizedAssetIds: [] };
  completedGates.push("entitlement");

  const deliveryConsent = consentAllowsAll(context.consentRecord, context.deliveryConsentScopes);
  if (!deliveryConsent.allowed) return { state: "consent_blocked", completedGates, authorizedAssetIds: [] };
  completedGates.push("consent");

  const authorizedAssetIds = context.assets
    .filter((asset) => {
      if (!asset.included || !asset.approved || asset.creativeWorkId !== context.creativeWorkId) return false;
      return consentAllowsAll(context.consentRecord, asset.requiredConsentScopes).allowed;
    })
    .map((asset) => asset.id);

  if (authorizedAssetIds.length === 0) {
    return { state: "asset_unavailable", completedGates, authorizedAssetIds: [] };
  }

  completedGates.push("asset_authorization");
  return { state: "available", completedGates, authorizedAssetIds };
}

export function canUseControlledSharing(context: DeliveryAccessContext): DeliveryActionDecision {
  const resolved = resolveDeliveryAccess(context);
  if (resolved.state !== "available") return { allowed: false, reason: "Delivery access is not currently available." };
  if (!context.controlledSharingAllowed) return { allowed: false, reason: "Controlled sharing is not enabled for this delivery." };
  return consentAllowsAll(context.consentRecord, ["designated_family_sharing"]);
}
