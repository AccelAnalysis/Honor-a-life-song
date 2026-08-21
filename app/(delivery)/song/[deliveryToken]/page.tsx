import type { Metadata } from "next";
import { SecureDelivery } from "@/components/secure-delivery";
import { referenceDeliveryTokens } from "@/fixtures/secure-delivery-reference";
import { resolveDeliveryRoute } from "@/lib/secure-delivery-route";

export const metadata: Metadata = {
  title: "Secure Song Delivery | Honor a Life Song",
  description: "Private Honor a Life Song delivery access.",
  robots: { index: false, follow: false, nocache: true }
};

export function generateStaticParams() {
  return referenceDeliveryTokens.map((deliveryToken) => ({ deliveryToken }));
}

export default function DeliveryPage({ params }: { params: { deliveryToken: string } }) {
  const context = resolveDeliveryRoute(params.deliveryToken);
  return <SecureDelivery context={context} />;
}
