import { isPlausibleDeliveryToken, type DeliveryAccessContext } from "@/domain/delivery";
import { getReferenceDelivery } from "@/fixtures/secure-delivery-reference";
import { unresolvedProductionDelivery } from "@/services/secure-delivery";

function invalidDelivery(): DeliveryAccessContext {
  return {
    deliveryId: "invalid-delivery",
    creativeWorkId: "invalid-creative-work",
    entryMechanism: "secure_link",
    tokenState: "invalid",
    verificationState: "not_required",
    entitled: false,
    deliveryConsentScopes: [],
    assets: [],
    controlledSharingAllowed: false,
    confirmation: { state: "not_available" },
    qrKeepsakeCapability: "planned_p1"
  };
}

export function resolveDeliveryRoute(deliveryToken: string): DeliveryAccessContext {
  if (!isPlausibleDeliveryToken(deliveryToken)) return invalidDelivery();
  return getReferenceDelivery(deliveryToken) ?? unresolvedProductionDelivery();
}
