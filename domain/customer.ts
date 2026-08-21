import type { AuthorizationDecision } from "./consent";
import type { Approval, EntityId, LyricVersion } from "./types";
import { songJourney, type SongJourneyState } from "./workflows";

export type JourneyPhaseState = "complete" | "current" | "upcoming";

export type JourneyPhase = {
  state: SongJourneyState;
  status: JourneyPhaseState;
};

export function deriveJourneyProgress(current: SongJourneyState): JourneyPhase[] {
  const currentIndex = songJourney.indexOf(current);
  return songJourney.map((state, index) => ({
    state,
    status: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming"
  }));
}

export type CustomerNextAction = {
  label: string;
  parentId: "journey" | "story" | "interviews" | "reviews" | "orders" | "files";
  childId?: string;
};

export function deriveCustomerNextAction(state: SongJourneyState): CustomerNextAction | undefined {
  switch (state) {
    case "Inquiry":
    case "Request":
      return { label: "Complete request", parentId: "journey", childId: "journey-request" };
    case "Awaiting Payment":
      return { label: "Complete required payment", parentId: "orders", childId: "orders-deposit-balance" };
    case "Interview Scheduling":
      return { label: "Schedule interview", parentId: "interviews", childId: "interviews-schedule" };
    case "Story Capture":
      return { label: "Provide story information", parentId: "story", childId: "story-guided-questions" };
    case "Customer Review":
      return { label: "Review lyrics", parentId: "reviews", childId: "reviews-current-draft" };
    case "Final Approval":
      return { label: "Review final approval request", parentId: "journey", childId: "journey-production" };
    case "Delivered":
      return { label: "Access delivery", parentId: "files", childId: "files-final-song" };
    default:
      return undefined;
  }
}

export function filterCustomerVisibleLyricVersions(
  versions: readonly LyricVersion[],
  sharedVersionIds: readonly EntityId[]
) {
  const shared = new Set(sharedVersionIds);
  return versions.filter((version) => shared.has(version.id));
}

export function approvalTargetsLyricVersion(approval: Approval, lyricVersionId: EntityId) {
  return approval.scope === "lyrics" && approval.lyricVersionId === lyricVersionId;
}

export function customerActionAllowed(
  authorization: AuthorizationDecision,
  consent?: AuthorizationDecision
): AuthorizationDecision {
  if (!authorization.allowed) return authorization;
  if (consent && !consent.allowed) return consent;
  return { allowed: true };
}

export type CustomerScopedCapability = "order" | "payments" | "consent" | "approval" | "internal_creator_notes";

export type CustomerAccessGrant = {
  orderIds: readonly EntityId[];
  paymentOrderIds?: readonly EntityId[];
  consentOrderIds?: readonly EntityId[];
  approvalOrderIds?: readonly EntityId[];
  mediaAssetIds?: readonly EntityId[];
};

export function customerScopedAccessAllows(
  grant: CustomerAccessGrant,
  orderId: EntityId,
  capability: CustomerScopedCapability
) {
  if (!grant.orderIds.includes(orderId)) return false;
  if (capability === "internal_creator_notes") return false;
  if (capability === "payments") return Boolean(grant.paymentOrderIds?.includes(orderId));
  if (capability === "consent") return Boolean(grant.consentOrderIds?.includes(orderId));
  if (capability === "approval") return Boolean(grant.approvalOrderIds?.includes(orderId));
  return true;
}

export function customerMediaAccessAllows(
  grant: CustomerAccessGrant,
  orderId: EntityId,
  mediaAssetId: EntityId
) {
  return grant.orderIds.includes(orderId) && Boolean(grant.mediaAssetIds?.includes(mediaAssetId));
}

export function orderContextMatches(orderId: EntityId | undefined, expectedOrderId: EntityId) {
  return Boolean(orderId && orderId === expectedOrderId);
}
