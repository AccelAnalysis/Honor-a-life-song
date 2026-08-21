import type { DeliveryAccessContext, DeliveryAssetAction } from "../domain/delivery";
import type { AuditEvent } from "../domain/types";

export interface ShortLivedAssetAccess {
  url: string;
  expiresAt: string;
}

export interface SecureDeliveryService {
  resolveDelivery(deliveryToken: string): Promise<DeliveryAccessContext>;
  authorizeAsset(input: {
    deliveryId: string;
    assetId: string;
    action: DeliveryAssetAction;
  }): Promise<ShortLivedAssetAccess>;
  confirmDelivery(deliveryId: string): Promise<void>;
  recordAuditEvent(event: AuditEvent): Promise<void>;
}

export const secureDeliveryServiceAvailability = {
  tokenResolution: false,
  entitlementValidation: false,
  recipientVerification: false,
  mediaAuthorization: false,
  auditPersistence: false,
  confirmationPersistence: false,
  resend: false,
  qrKeepsakeP1: false
} as const;

export function unresolvedProductionDelivery(): DeliveryAccessContext {
  return {
    deliveryId: "unresolved-production-delivery",
    creativeWorkId: "unresolved-production-work",
    entryMechanism: "secure_link",
    tokenState: "service_unavailable",
    verificationState: "not_required",
    entitled: false,
    deliveryConsentScopes: [],
    assets: [],
    controlledSharingAllowed: false,
    confirmation: { state: "not_available" },
    qrKeepsakeCapability: "planned_p1"
  };
}
