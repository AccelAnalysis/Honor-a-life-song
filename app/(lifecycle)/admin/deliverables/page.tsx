import { AdminAccessGate } from "@/components/admin-access-gate";
import { CreatorDeliverySurface } from "@/components/creator-delivery-surface";
export default function AdminDeliveryPage() { return <AdminAccessGate><CreatorDeliverySurface admin /></AdminAccessGate>; }
