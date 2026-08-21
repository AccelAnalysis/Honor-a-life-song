import { describe, expect, it } from "vitest";
import {
  authorizeDeliveryAsset,
  canUseControlledSharing,
  isPlausibleDeliveryToken,
  privateSongSections,
  resolveDeliveryAccess,
  secureDeliveryHierarchy
} from "../domain/delivery";
import { getReferenceDelivery } from "../fixtures/secure-delivery-reference";
import { resolveDeliveryRoute } from "../lib/secure-delivery-route";
import { secureDeliveryServiceAvailability } from "../services/secure-delivery";

function reference(token: string) {
  const context = getReferenceDelivery(token);
  if (!context) throw new Error(`Missing reference delivery fixture: ${token}`);
  return context;
}

describe("secure delivery hierarchy", () => {
  it("preserves the source-defined private song children", () => {
    expect(privateSongSections).toEqual(["Listen", "Download", "Lyrics", "Photos / Approved Story", "Share Controls"]);
  });

  it("preserves the source-defined delivery states", () => {
    expect(secureDeliveryHierarchy).toEqual([
      "Private Song Page",
      "QR Keepsake Landing Page",
      "Access Verification",
      "Expired / Revoked Link",
      "Delivery Confirmation"
    ]);
  });
});

describe("delivery route resolution", () => {
  it("accepts the existing reference preview route", () => {
    expect(resolveDeliveryAccess(resolveDeliveryRoute("reference-preview")).state).toBe("available");
  });

  it("fails malformed tokens before any protected access", () => {
    expect(isPlausibleDeliveryToken("bad token")).toBe(false);
    expect(resolveDeliveryAccess(resolveDeliveryRoute("bad token")).state).toBe("invalid");
  });

  it("fails closed for unknown production-looking tokens while the production adapter is absent", () => {
    expect(resolveDeliveryAccess(resolveDeliveryRoute("unknown_token_12345")).state).toBe("service_unavailable");
  });
});

describe("ordered access gates", () => {
  it("completes token, verification, entitlement, consent, then asset authorization", () => {
    const resolution = resolveDeliveryAccess(reference("reference-preview"));
    expect(resolution.state).toBe("available");
    expect(resolution.completedGates).toEqual(["token", "verification", "entitlement", "consent", "asset_authorization"]);
  });

  it("stops at token validation when verification is required", () => {
    const resolution = resolveDeliveryAccess(reference("reference-verify"));
    expect(resolution.state).toBe("verification_required");
    expect(resolution.completedGates).toEqual(["token"]);
    expect(resolution.authorizedAssetIds).toEqual([]);
  });

  it("does not authorize assets for an unentitled recipient", () => {
    const resolution = resolveDeliveryAccess(reference("reference-access-denied"));
    expect(resolution.state).toBe("access_denied");
    expect(resolution.completedGates).toEqual(["token", "verification"]);
    expect(resolution.authorizedAssetIds).toEqual([]);
  });
});

describe("expiration, revocation, and consent withdrawal", () => {
  it.each(["reference-expired", "reference-revoked"])("blocks protected assets for %s", (token: string) => {
    const resolution = resolveDeliveryAccess(reference(token));
    expect(["expired", "revoked"]).toContain(resolution.state);
    expect(resolution.authorizedAssetIds).toEqual([]);
  });

  it("fails closed when applicable consent has been withdrawn", () => {
    const resolution = resolveDeliveryAccess(reference("reference-consent-blocked"));
    expect(resolution.state).toBe("consent_blocked");
    expect(resolution.authorizedAssetIds).toEqual([]);
    expect(canUseControlledSharing(reference("reference-consent-blocked")).allowed).toBe(false);
  });
});

describe("approved asset integrity and cross-record isolation", () => {
  it("exposes only included approved final assets", () => {
    const context = reference("reference-preview");
    const resolution = resolveDeliveryAccess(context);
    expect(resolution.authorizedAssetIds).toContain("reference-final-audio");
    expect(resolution.authorizedAssetIds).toContain("reference-approved-lyrics");
    expect(resolution.authorizedAssetIds).not.toContain("reference-photo-not-included");
  });

  it("uses the explicitly approved lyric version rather than a newest-file rule", () => {
    const lyrics = reference("reference-preview").assets.find((asset) => asset.kind === "approved_lyrics");
    expect(lyrics?.approved).toBe(true);
    expect(lyrics?.approvedVersionId).toBe("reference-lyric-version-3");
  });

  it("rejects an asset request bound to another delivery record", () => {
    const context = reference("reference-preview");
    const decision = authorizeDeliveryAsset(context, {
      deliveryId: "another-delivery",
      assetId: "reference-final-audio",
      action: "download"
    });
    expect(decision.allowed).toBe(false);
  });

  it("rejects a source asset that is not in the resolved delivery package", () => {
    const context = reference("reference-preview");
    const decision = authorizeDeliveryAsset(context, {
      deliveryId: context.deliveryId,
      assetId: "unrelated-media-asset",
      action: "download"
    });
    expect(decision.allowed).toBe(false);
  });

  it("does not make the delivery available when no approved assets are included", () => {
    expect(resolveDeliveryAccess(reference("reference-asset-unavailable")).state).toBe("asset_unavailable");
  });
});

describe("sharing, confirmation, QR, and production connectivity", () => {
  it("gates controlled sharing independently and does not infer public marketing permission", () => {
    const context = reference("reference-preview");
    expect(canUseControlledSharing(context).allowed).toBe(true);
    expect(context.consentRecord?.scopes).not.toContain("public_marketing");
  });

  it("keeps delivery confirmation separate from page resolution", () => {
    const context = reference("reference-preview");
    resolveDeliveryAccess(context);
    expect(context.confirmation.state).toBe("available_unconfirmed");
  });

  it("routes QR entry through the same security chain while keeping the richer keepsake capability P1", () => {
    const context = reference("reference-qr-entry");
    expect(context.entryMechanism).toBe("qr");
    expect(context.qrKeepsakeCapability).toBe("planned_p1");
    expect(resolveDeliveryAccess(context).state).toBe("available");
    expect(secureDeliveryServiceAvailability.qrKeepsakeP1).toBe(false);
  });

  it("does not pretend production delivery services are connected", () => {
    expect(secureDeliveryServiceAvailability).toEqual({
      tokenResolution: false,
      entitlementValidation: false,
      recipientVerification: false,
      mediaAuthorization: false,
      auditPersistence: false,
      confirmationPersistence: false,
      resend: false,
      qrKeepsakeP1: false
    });
  });
});
