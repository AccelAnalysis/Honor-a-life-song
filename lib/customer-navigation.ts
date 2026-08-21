import type { ConsentScope } from "../domain/consent";
import { workspaceNavigation, type NavigationItem } from "./navigation";

export type CustomerParentId =
  | "customer-home"
  | "journey"
  | "story"
  | "interviews"
  | "reviews"
  | "family"
  | "messages"
  | "files"
  | "orders"
  | "permissions";

export type CustomerServiceBoundary =
  | "requests"
  | "orders"
  | "people"
  | "stories"
  | "creative-work"
  | "approvals"
  | "media"
  | "consent"
  | "workflow"
  | "scheduling"
  | "payments"
  | "communications"
  | "invitations"
  | "catalog"
  | "fulfillment"
  | "secure-delivery"
  | "audit";

export type CustomerRelease = "P0" | "P1";
export type CustomerExposure = "customer_private" | "family_scoped" | "secure_delivery";

export type CustomerWorkflowAction = {
  label: string;
  service: CustomerServiceBoundary;
};

export type CustomerWorkflowTarget = {
  parentId: CustomerParentId;
  childId?: string;
  grandchildId?: string;
};

export type CustomerWorkflowNode = {
  id: string;
  label: string;
  slug: string;
  description: string;
  boundaries: readonly CustomerServiceBoundary[];
  requiredConsentScopes?: readonly ConsentScope[];
  managesConsentScope?: ConsentScope;
  exposure?: CustomerExposure;
  release?: CustomerRelease;
  requiresOrder?: boolean;
  action?: CustomerWorkflowAction;
  target?: CustomerWorkflowTarget;
  grandchildren?: readonly CustomerWorkflowNode[];
};

export const customerServiceConnections: Record<CustomerServiceBoundary, boolean> = {
  requests: false,
  orders: false,
  people: false,
  stories: false,
  "creative-work": false,
  approvals: false,
  media: false,
  consent: false,
  workflow: false,
  scheduling: false,
  payments: false,
  communications: false,
  invitations: false,
  catalog: false,
  fulfillment: false,
  "secure-delivery": false,
  audit: false
};

export function customerParentCarriesOrderContext(_parentId: CustomerParentId) {
  return true;
}

const uploadGrandchildren: readonly CustomerWorkflowNode[] = [
  {
    id: "uploads-photos",
    label: "Photos",
    slug: "photos",
    description: "Approved image source material attached to the selected order/story through shared secure media storage. Uploading a photo does not grant marketing, event-media, sponsor, or family-sharing permission.",
    boundaries: ["stories", "media", "consent", "audit"],
    exposure: "customer_private",
    requiresOrder: true,
    action: { label: "Upload photo", service: "media" }
  },
  {
    id: "uploads-documents",
    label: "Documents",
    slug: "documents",
    description: "Story-related documents for the selected order using validated secure storage rather than unrestricted cloud storage.",
    boundaries: ["stories", "media", "audit"],
    exposure: "customer_private",
    requiresOrder: true,
    action: { label: "Upload document", service: "media" }
  },
  {
    id: "uploads-audio",
    label: "Audio",
    slug: "audio",
    description: "Permitted source audio associated with the selected order/story. Recording or upload authorization does not automatically authorize public distribution.",
    boundaries: ["stories", "media", "consent", "audit"],
    exposure: "customer_private",
    requiresOrder: true,
    action: { label: "Upload audio", service: "media" }
  },
  {
    id: "uploads-other-memories",
    label: "Other Memories",
    slug: "other-memories",
    description: "Other story-development materials represented through the existing StoryContribution and MediaAsset boundaries, not an arbitrary file repository.",
    boundaries: ["stories", "media", "audit"],
    exposure: "customer_private",
    requiresOrder: true,
    action: { label: "Add memory material", service: "media" }
  }
];

export const customerChildren: Record<CustomerParentId, readonly CustomerWorkflowNode[]> = {
  "customer-home": [
    {
      id: "dashboard-current-song",
      label: "Current Song / Program",
      slug: "current-song-program",
      description: "The active authorized order/song journey or applicable program context. Unrelated customer, facility, participant, or production records remain outside this view.",
      boundaries: ["orders", "workflow", "creative-work"],
      requiresOrder: true,
      target: { parentId: "journey" }
    },
    {
      id: "dashboard-progress-timeline",
      label: "Progress Timeline",
      slug: "progress-timeline",
      description: "Customer-facing progress derived from the governed individual song lifecycle rather than a second browser-owned lifecycle.",
      boundaries: ["workflow", "orders"],
      requiresOrder: true
    },
    {
      id: "dashboard-next-action",
      label: "Next Action",
      slug: "next-action",
      description: "The next legitimate customer action derived from authoritative workflow state; no call to action is manufactured merely to populate the dashboard.",
      boundaries: ["workflow", "orders", "scheduling", "payments", "stories", "approvals", "secure-delivery"],
      requiresOrder: true
    },
    {
      id: "dashboard-messages",
      label: "Messages",
      slug: "messages",
      description: "Customer-appropriate communications surfaced from the shared Messages destination.",
      boundaries: ["communications"],
      requiresOrder: true,
      target: { parentId: "messages" }
    },
    {
      id: "dashboard-recent-activity",
      label: "Recent Activity",
      slug: "recent-activity",
      description: "Customer-appropriate activity only. Internal creator notes, admin overrides, sensitive flags, and unrelated audit events are excluded.",
      boundaries: ["audit", "orders", "workflow"],
      exposure: "customer_private",
      requiresOrder: true
    }
  ],
  journey: [
    {
      id: "journey-request",
      label: "Request",
      slug: "request",
      description: "Submitted or active request context for the selected order, using the canonical request/order model.",
      boundaries: ["requests", "orders", "workflow"],
      requiresOrder: true,
      action: { label: "Save request", service: "requests" }
    },
    {
      id: "journey-interview",
      label: "Interview",
      slug: "interview",
      description: "Interview readiness and status linked to the full Interviews workflow through the shared scheduling authority.",
      boundaries: ["workflow", "scheduling"],
      requiresOrder: true,
      target: { parentId: "interviews" }
    },
    {
      id: "journey-story-development",
      label: "Story Development",
      slug: "story-development",
      description: "Customer-appropriate story-development progress without creator interpretation notes or other internal production material.",
      boundaries: ["workflow", "stories"],
      exposure: "customer_private",
      requiresOrder: true,
      target: { parentId: "story" }
    },
    {
      id: "journey-lyrics",
      label: "Lyrics",
      slug: "lyrics",
      description: "Customer-facing lyric-development and review readiness connected to versioned Lyrics & Review workflows.",
      boundaries: ["workflow", "creative-work", "approvals"],
      requiresOrder: true,
      target: { parentId: "reviews" }
    },
    {
      id: "journey-production",
      label: "Production",
      slug: "production",
      description: "Customer-facing production, recording, and final-approval status only. Composition internals, arrangement notes, raw recordings, stems, mixing/mastering controls, assignments, and QA notes remain internal.",
      boundaries: ["workflow", "creative-work", "approvals"],
      exposure: "customer_private",
      requiresOrder: true
    },
    {
      id: "journey-delivery",
      label: "Delivery",
      slug: "delivery",
      description: "Delivery readiness linked to Files & Keepsakes and the shared Secure Delivery boundary; permanent public media URLs are not used.",
      boundaries: ["workflow", "media", "secure-delivery", "consent"],
      exposure: "secure_delivery",
      requiresOrder: true,
      target: { parentId: "files" }
    }
  ],
  story: [
    {
      id: "story-guided-questions",
      label: "Guided Story Questions",
      slug: "guided-story-questions",
      description: "Structured human-led prompts used to gather meaningful source material for the selected song journey. No autonomous AI interview or songwriting behavior is introduced.",
      boundaries: ["stories", "orders", "audit"],
      requiresOrder: true,
      action: { label: "Save story responses", service: "stories" }
    },
    {
      id: "story-life-timeline",
      label: "Life Timeline",
      slug: "life-timeline",
      description: "Song-relevant chronological life events, scoped to story development rather than genealogy, medical history, or general life-record management.",
      boundaries: ["stories"],
      requiresOrder: true,
      action: { label: "Save timeline entry", service: "stories" }
    },
    {
      id: "story-people-relationships",
      label: "People & Relationships",
      slug: "people-relationships",
      description: "People significant to the story, distinguishing a story reference from an authenticated collaborator or duplicate user account.",
      boundaries: ["stories", "people"],
      requiresOrder: true,
      action: { label: "Save story relationship", service: "stories" }
    },
    {
      id: "story-places",
      label: "Places",
      slug: "places",
      description: "Meaningful places relevant to the story/song without introducing unnecessary mapping or geolocation features.",
      boundaries: ["stories"],
      requiresOrder: true,
      action: { label: "Save place", service: "stories" }
    },
    {
      id: "story-important-events",
      label: "Important Events",
      slug: "important-events",
      description: "Events meaningful to the song story, not a general calendar.",
      boundaries: ["stories"],
      requiresOrder: true,
      action: { label: "Save event", service: "stories" }
    },
    {
      id: "story-values-personality",
      label: "Values / Personality",
      slug: "values-personality",
      description: "Human-provided context around character, values, sayings, passions, and personality without generated diagnoses or inferred sensitive traits.",
      boundaries: ["stories"],
      requiresOrder: true,
      action: { label: "Save story context", service: "stories" }
    },
    {
      id: "story-favorite-music-style",
      label: "Favorite Music / Style",
      slug: "favorite-music-style",
      description: "Creative-direction source material supplied by the customer. It does not promise copyrighted artist imitation or automatic style replication.",
      boundaries: ["stories", "creative-work"],
      requiresOrder: true,
      action: { label: "Save music preferences", service: "stories" }
    },
    {
      id: "story-uploads",
      label: "Uploads",
      slug: "uploads",
      description: "Secure story-source uploads for the selected order using the shared media boundary; not a Customer-only storage system or general memory vault.",
      boundaries: ["stories", "media", "consent", "audit"],
      exposure: "customer_private",
      requiresOrder: true,
      grandchildren: uploadGrandchildren
    }
  ],
  interviews: [
    {
      id: "interviews-schedule",
      label: "Schedule Interview",
      slug: "schedule-interview",
      description: "Customer-facing interview scheduling through the shared scheduling boundary. No confirmed appointment is simulated when the provider is not connected.",
      boundaries: ["scheduling", "orders", "workflow"],
      requiresOrder: true,
      action: { label: "Schedule interview", service: "scheduling" }
    },
    {
      id: "interviews-upcoming",
      label: "Upcoming Interview",
      slug: "upcoming-interview",
      description: "The authoritative upcoming interview when one exists through the shared scheduling service.",
      boundaries: ["scheduling", "workflow"],
      requiresOrder: true
    },
    {
      id: "interviews-reschedule",
      label: "Reschedule",
      slug: "reschedule",
      description: "Rescheduling through the same shared scheduling authority; local UI state alone cannot change the appointment.",
      boundaries: ["scheduling", "workflow", "audit"],
      requiresOrder: true,
      action: { label: "Reschedule interview", service: "scheduling" }
    },
    {
      id: "interviews-preparation",
      label: "Interview Preparation",
      slug: "interview-preparation",
      description: "Preparation guidance and relevant story prompts without duplicating the Story & Memories workspace.",
      boundaries: ["stories", "scheduling"],
      requiresOrder: true
    }
  ],
  reviews: [
    {
      id: "reviews-current-draft",
      label: "Current Draft",
      slug: "current-draft",
      description: "The exact LyricVersion formally presented to this customer for review, not simply the newest creator draft.",
      boundaries: ["creative-work", "approvals", "audit"],
      exposure: "customer_private",
      requiresOrder: true
    },
    {
      id: "reviews-previous-versions",
      label: "Previous Versions",
      slug: "previous-versions",
      description: "Only prior LyricVersion records legitimately shared with this customer; creator-only drafts and internal comments remain excluded.",
      boundaries: ["creative-work", "audit"],
      exposure: "customer_private",
      requiresOrder: true
    },
    {
      id: "reviews-submit-feedback",
      label: "Submit Feedback",
      slug: "submit-feedback",
      description: "Feedback linked to the exact lyric version under review instead of an unstructured status mutation.",
      boundaries: ["creative-work", "communications", "audit"],
      requiresOrder: true,
      action: { label: "Submit version feedback", service: "creative-work" }
    },
    {
      id: "reviews-request-revision",
      label: "Request Revision",
      slug: "request-revision",
      description: "An explicit revision request governed by authoritative package/revision policy rather than browser-decided unlimited revisions.",
      boundaries: ["creative-work", "catalog", "workflow", "audit"],
      requiresOrder: true,
      action: { label: "Request revision", service: "creative-work" }
    },
    {
      id: "reviews-approve-lyrics",
      label: "Approve Lyrics",
      slug: "approve-lyrics",
      description: "Canonical Approval workflow bound to the exact LyricVersion approved and advanced only through the governing workflow authority.",
      boundaries: ["approvals", "creative-work", "workflow", "audit"],
      requiresOrder: true,
      action: { label: "Approve exact lyric version", service: "approvals" }
    }
  ],
  family: [
    {
      id: "family-invite",
      label: "Invite Family Member",
      slug: "invite-family-member",
      description: "A scoped family invitation boundary. Family relationship alone never grants full order access, and no email/SMS send is simulated without the real communications service.",
      boundaries: ["invitations", "people", "communications", "audit"],
      exposure: "family_scoped",
      requiresOrder: true,
      action: { label: "Send scoped invitation", service: "invitations" }
    },
    {
      id: "family-manage-contributors",
      label: "Manage Contributors",
      slug: "manage-contributors",
      description: "Understand and manage permitted contributors while distinguishing purchaser, family collaborator, song subject, and authorized representative.",
      boundaries: ["people", "orders", "invitations", "audit"],
      exposure: "family_scoped",
      requiresOrder: true,
      release: "P1"
    },
    {
      id: "family-contributions",
      label: "Contributions",
      slug: "contributions",
      description: "Authorized family StoryContribution and MediaAsset records connected to the shared story/media model rather than a parallel Customer database.",
      boundaries: ["stories", "media", "people", "consent"],
      exposure: "family_scoped",
      requiresOrder: true,
      release: "P1"
    },
    {
      id: "family-access-permissions",
      label: "Access Permissions",
      slug: "access-permissions",
      description: "Scoped access management. Family invitation never implies payment access, all-media access, creator notes, every approval, consent changes, publishing, or unrelated-order access.",
      boundaries: ["people", "orders", "consent", "audit"],
      exposure: "family_scoped",
      requiresOrder: true
    }
  ],
  messages: [],
  files: [
    {
      id: "files-final-song",
      label: "Final Song",
      slug: "final-song",
      description: "Approved final audio exposed only through the Secure Delivery boundary; working recordings, unapproved mixes, creator files, and permanent public object URLs stay excluded.",
      boundaries: ["media", "creative-work", "approvals", "secure-delivery", "consent", "audit"],
      exposure: "secure_delivery",
      requiresOrder: true,
      action: { label: "Access final song", service: "secure-delivery" }
    },
    {
      id: "files-lyric-sheet",
      label: "Lyric Sheet",
      slug: "lyric-sheet",
      description: "The approved lyric document/version intended for delivery, never an arbitrary latest draft.",
      boundaries: ["media", "creative-work", "approvals", "secure-delivery"],
      exposure: "secure_delivery",
      requiresOrder: true,
      action: { label: "Access lyric sheet", service: "secure-delivery" }
    },
    {
      id: "files-song-card",
      label: "Song Card",
      slug: "song-card",
      description: "The source-defined song-card integration point. Rich configurable digital song cards are P1 and are not presented as production-live until connected.",
      boundaries: ["media", "secure-delivery"],
      exposure: "secure_delivery",
      requiresOrder: true,
      release: "P1"
    },
    {
      id: "files-shareable-link",
      label: "Shareable Link",
      slug: "shareable-link",
      description: "Controlled sharing through Secure Delivery. Authorization/entitlement, consent, and delivery policy are required; private delivery does not imply public-marketing permission.",
      boundaries: ["secure-delivery", "media", "consent", "audit"],
      requiredConsentScopes: ["designated_family_sharing"],
      exposure: "secure_delivery",
      requiresOrder: true,
      action: { label: "Create controlled share", service: "secure-delivery" }
    },
    {
      id: "files-physical-keepsake",
      label: "Physical Keepsake Status",
      slug: "physical-keepsake-status",
      description: "Simple physical-keepsake fulfillment status integration point. Warehouse, carrier, and complex inventory infrastructure remain outside this slice.",
      boundaries: ["fulfillment", "orders"],
      requiresOrder: true,
      release: "P1"
    }
  ],
  orders: [
    {
      id: "orders-summary",
      label: "Order Summary",
      slug: "order-summary",
      description: "Authoritative order scope and applicable line items. Catalog/pricing rules cannot be mutated from the Customer workspace outside approved actions.",
      boundaries: ["orders", "catalog"],
      requiresOrder: true
    },
    {
      id: "orders-deposit-balance",
      label: "Deposit / Balance",
      slug: "deposit-balance",
      description: "Server-authoritative payment state. Browser redirects, query parameters, client state, or a successful-looking checkout screen cannot mark an order paid.",
      boundaries: ["orders", "payments", "audit"],
      requiresOrder: true,
      action: { label: "Open payment flow", service: "payments" }
    },
    {
      id: "orders-receipts",
      label: "Receipts",
      slug: "receipts",
      description: "Legitimate receipts from the shared payment/order system; reference mode does not fabricate receipt numbers, taxes, or payment data.",
      boundaries: ["orders", "payments"],
      requiresOrder: true
    },
    {
      id: "orders-refund-status",
      label: "Refund Status",
      slug: "refund-status",
      description: "Customer-appropriate refund status from the authoritative payment/order system. The client cannot mark its own order refunded.",
      boundaries: ["orders", "payments", "audit"],
      requiresOrder: true
    },
    {
      id: "orders-add-ons",
      label: "Add-ons",
      slug: "add-ons",
      description: "Only configured service-catalog add-ons applicable to the selected order; products, prices, and eligibility rules are not invented in the UI.",
      boundaries: ["orders", "catalog", "payments"],
      requiresOrder: true,
      action: { label: "Select configured add-on", service: "catalog" }
    }
  ],
  permissions: [
    {
      id: "permissions-participation",
      label: "Participation Consent",
      slug: "participation-consent",
      description: "Participation permission where applicable. Purchase or payment is not treated as participant consent.",
      boundaries: ["consent", "people", "audit"],
      managesConsentScope: "participation",
      requiresOrder: true,
      action: { label: "Update participation consent", service: "consent" }
    },
    {
      id: "permissions-recording",
      label: "Recording Consent",
      slug: "recording-consent",
      description: "Permission for applicable interview/audio recording. Scheduling an interview does not itself grant recording permission.",
      boundaries: ["consent", "scheduling", "audit"],
      managesConsentScope: "interview_recording",
      requiresOrder: true,
      action: { label: "Update recording consent", service: "consent" }
    },
    {
      id: "permissions-family-sharing",
      label: "Family Sharing",
      slug: "family-sharing",
      description: "Consent for designated family sharing. Family relationship is not automatic authorization or consent.",
      boundaries: ["consent", "people", "audit"],
      managesConsentScope: "designated_family_sharing",
      requiresOrder: true,
      action: { label: "Update family-sharing consent", service: "consent" }
    },
    {
      id: "permissions-performance",
      label: "Performance Permission",
      slug: "performance-permission",
      description: "Permission for the applicable performance context without inferring public publishing or broader performance rights.",
      boundaries: ["consent", "audit"],
      managesConsentScope: "private_performance",
      requiresOrder: true,
      action: { label: "Update performance permission", service: "consent" }
    },
    {
      id: "permissions-photo-video",
      label: "Photo / Video Permission",
      slug: "photo-video-permission",
      description: "Event photography/video permission kept separate from public-marketing use.",
      boundaries: ["consent", "media", "audit"],
      managesConsentScope: "event_photo_video",
      requiresOrder: true,
      action: { label: "Update photo/video permission", service: "consent" }
    },
    {
      id: "permissions-public-marketing",
      label: "Public Story / Marketing Permission",
      slug: "public-story-marketing-permission",
      description: "Public story/marketing permission kept separate from participation, recording, internal creative use, private delivery, and family sharing. The private service remains possible when marketing is declined.",
      boundaries: ["consent", "media", "audit"],
      managesConsentScope: "public_marketing",
      requiresOrder: true,
      action: { label: "Update public-marketing permission", service: "consent" }
    }
  ]
};

export const customerLeafDestinations: Partial<Record<CustomerParentId, CustomerWorkflowNode>> = {
  messages: {
    id: "customer-messages",
    label: "Messages",
    slug: "messages",
    description: "Authorized Customer/Creator, Customer/Operations, applicable family, and system communications through the shared communications boundary. No provider-specific React coupling or simulated successful send is introduced.",
    boundaries: ["communications", "people", "audit"],
    exposure: "customer_private",
    requiresOrder: true,
    action: { label: "Send message", service: "communications" }
  }
};

export type CustomerRouteResolution = {
  parent: NavigationItem;
  child?: CustomerWorkflowNode;
  grandchild?: CustomerWorkflowNode;
  orderId?: string;
  contextual: boolean;
};

export function getCustomerParent(parentId: CustomerParentId) {
  const parent = workspaceNavigation.customer.find((item) => item.id === parentId);
  if (!parent) throw new Error(`Unknown Customer parent: ${parentId}`);
  return parent;
}

export function getCustomerChildren(parentId: CustomerParentId) {
  return customerChildren[parentId];
}

export function getCustomerChild(parentId: CustomerParentId, childId: string) {
  return customerChildren[parentId].find((item) => item.id === childId);
}

function parentIdFromSlug(slug: string): CustomerParentId | undefined {
  if (slug === "dashboard") return "customer-home";
  return workspaceNavigation.customer.find((item) => item.slug === slug)?.id as CustomerParentId | undefined;
}

export function resolveCustomerRoute(inputSegments: readonly string[]): CustomerRouteResolution | undefined {
  let segments = [...inputSegments];
  let orderId: string | undefined;
  let contextual = false;

  if (segments[0] === "order") {
    if (!segments[1]) return undefined;
    orderId = decodeURIComponent(segments[1]);
    if (!orderId) return undefined;
    contextual = true;
    segments = segments.slice(2);
  }

  if (segments.length === 0) {
    return { parent: getCustomerParent("customer-home"), orderId, contextual };
  }

  const parentId = parentIdFromSlug(segments[0]);
  if (!parentId) return undefined;
  const parent = getCustomerParent(parentId);

  if (segments.length === 1) {
    return { parent, orderId, contextual };
  }

  const child = customerChildren[parentId].find((item) => item.slug === segments[1]);
  if (!child) return undefined;

  if (segments.length === 2) {
    return { parent, child, orderId, contextual };
  }

  if (!child.grandchildren || segments.length !== 3) return undefined;
  const grandchild = child.grandchildren.find((item) => item.slug === segments[2]);
  if (!grandchild) return undefined;
  return { parent, child, grandchild, orderId, contextual };
}

export function buildCustomerHref(options: {
  parentId: CustomerParentId;
  childId?: string;
  grandchildId?: string;
  orderId?: string;
}) {
  const { parentId, childId, grandchildId, orderId } = options;
  const segments = ["customer"];
  if (orderId) segments.push("order", encodeURIComponent(orderId));

  const parent = getCustomerParent(parentId);
  if (parentId !== "customer-home") segments.push(parent.slug);

  if (childId) {
    const child = getCustomerChild(parentId, childId);
    if (!child) throw new Error(`Unknown Customer child ${childId} for ${parentId}`);
    if (parentId === "customer-home") segments.push("dashboard");
    segments.push(child.slug);

    if (grandchildId) {
      const grandchild = child.grandchildren?.find((item) => item.id === grandchildId);
      if (!grandchild) throw new Error(`Unknown Customer grandchild ${grandchildId} for ${childId}`);
      segments.push(grandchild.slug);
    }
  } else if (grandchildId) {
    throw new Error("Customer grandchild routes require a child workflow.");
  }

  return `/${segments.join("/")}`;
}

function routeSegmentsFor(options: Parameters<typeof buildCustomerHref>[0]) {
  return buildCustomerHref(options).split("/").filter(Boolean).slice(1);
}

export function getCustomerStaticRouteSlugs(referenceOrderId: string) {
  const routes: string[][] = [];
  const add = (segments: string[]) => routes.push(segments);

  (Object.keys(customerChildren) as CustomerParentId[]).forEach((parentId) => {
    add(routeSegmentsFor({ parentId }));
    add(routeSegmentsFor({ parentId, orderId: referenceOrderId }));

    customerChildren[parentId].forEach((child) => {
      add(routeSegmentsFor({ parentId, childId: child.id }));
      add(routeSegmentsFor({ parentId, childId: child.id, orderId: referenceOrderId }));

      child.grandchildren?.forEach((grandchild) => {
        add(routeSegmentsFor({ parentId, childId: child.id, grandchildId: grandchild.id }));
        add(routeSegmentsFor({ parentId, childId: child.id, grandchildId: grandchild.id, orderId: referenceOrderId }));
      });
    });
  });

  const seen = new Set<string>();
  return routes.filter((segments) => {
    const key = segments.join("/");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
