import { CreatorAccessGate } from "@/components/creator-access-gate";
import { CreatorDeliverySurface } from "@/components/creator-delivery-surface";
export default function CreatorDeliveryPage() { return <CreatorAccessGate><CreatorDeliverySurface /></CreatorAccessGate>; }
