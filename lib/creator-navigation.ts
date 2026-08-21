import type { ConsentScope } from "../domain/consent";
import { workspaceNavigation, type NavigationItem } from "./navigation";

export type CreatorParentId =
  | "creator-home"
  | "work"
  | "story"
  | "song"
  | "production"
  | "media"
  | "calendar"
  | "messages";

export type CreatorServiceBoundary =
  | "assignments"
  | "people"
  | "orders-programs"
  | "stories"
  | "creative-work"
  | "approvals"
  | "media"
  | "consent"
  | "workflow"
  | "scheduling"
  | "communications"
  | "secure-delivery"
  | "audit";

export type CreatorExposure = "creator_internal" | "authorized_collaboration" | "delivery_candidate";

export type CreatorWorkflowAction = {
  label: string;
  service: CreatorServiceBoundary;
};

export type CreatorWorkflowTarget = {
  parentId: CreatorParentId;
  childId?: string;
  grandchildId?: string;
};

export type CreatorWorkflowNode = {
  id: string;
  label: string;
  slug: string;
  description: string;
  boundaries: readonly CreatorServiceBoundary[];
  requiredConsentScopes?: readonly ConsentScope[];
  exposure?: CreatorExposure;
  requiresCreativeWork?: boolean;
  action?: CreatorWorkflowAction;
  target?: CreatorWorkflowTarget;
  grandchildren?: readonly CreatorWorkflowNode[];
};

export const creatorServiceConnections: Record<CreatorServiceBoundary, boolean> = {
  assignments: false,
  people: false,
  "orders-programs": false,
  stories: false,
  "creative-work": false,
  approvals: false,
  media: false,
  consent: false,
  workflow: false,
  scheduling: false,
  communications: false,
  "secure-delivery": false,
  audit: false
};

const workContextParents = new Set<CreatorParentId>(["story", "song", "production", "media"]);

export function creatorParentCarriesWorkContext(parentId: CreatorParentId) {
  return workContextParents.has(parentId);
}

const lyricGrandchildren: readonly CreatorWorkflowNode[] = [
  {
    id: "lyrics-draft",
    label: "Draft",
    slug: "draft",
    description: "The active human-authored lyric-development surface for the selected CreativeWork. Saving must create or update an authoritative LyricVersion without overwriting prior submitted or approved versions.",
    boundaries: ["creative-work", "workflow", "audit"],
    exposure: "creator_internal",
    requiresCreativeWork: true,
    action: { label: "Persist lyric version", service: "creative-work" }
  },
  {
    id: "lyrics-version-history",
    label: "Version History",
    slug: "version-history",
    description: "Chronological/version-ordered LyricVersion history preserving version identity, author where supported, timestamp, workflow/review state, and relationships to approvals or feedback.",
    boundaries: ["creative-work", "approvals", "audit"],
    exposure: "creator_internal",
    requiresCreativeWork: true
  },
  {
    id: "lyrics-comparison",
    label: "Comparison",
    slug: "comparison",
    description: "Human review of applicable LyricVersion records side by side. This comparison surface does not generate rewrites or autonomously edit lyrics.",
    boundaries: ["creative-work"],
    exposure: "creator_internal",
    requiresCreativeWork: true
  }
];

export const creatorChildren: Record<CreatorParentId, readonly CreatorWorkflowNode[]> = {
  "creator-home": [
    {
      id: "dashboard-assigned-work",
      label: "Assigned Work",
      slug: "assigned-work",
      description: "Creator-assigned story, lyric, revision, production, review, or other source-supported creative work. The dashboard reads assignment authority; it does not fabricate assignments.",
      boundaries: ["assignments", "workflow", "creative-work"],
      target: { parentId: "work" }
    },
    {
      id: "dashboard-due-soon",
      label: "Due Soon",
      slug: "due-soon",
      description: "Assigned work prioritized only by legitimate due dates or deadlines supplied by authoritative assignment or workflow records.",
      boundaries: ["assignments", "workflow"],
      target: { parentId: "work", childId: "work-in-progress" }
    },
    {
      id: "dashboard-awaiting-review",
      label: "Awaiting Review",
      slug: "awaiting-review",
      description: "Creator work that has reached an applicable governed review gate, distinguishing customer/family review from internal or quality-review contexts.",
      boundaries: ["workflow", "creative-work", "approvals"],
      target: { parentId: "song", childId: "song-approvals" }
    },
    {
      id: "dashboard-revision-requests",
      label: "Revision Requests",
      slug: "revision-requests",
      description: "Work requiring revision based on authoritative feedback or revision state, with history retained against the underlying versions and feedback records.",
      boundaries: ["assignments", "creative-work", "workflow"],
      target: { parentId: "work", childId: "work-revision" }
    },
    {
      id: "dashboard-production-queue",
      label: "Production Queue",
      slug: "production-queue",
      description: "CreativeWork legitimately ready for production activity after the required review and approval prerequisites; the dashboard cannot bypass approval gates.",
      boundaries: ["assignments", "workflow", "creative-work", "approvals"],
      target: { parentId: "production" }
    }
  ],
  work: [
    {
      id: "work-new-assignments",
      label: "New Assignments",
      slug: "new-assignments",
      description: "Newly assigned creator work not yet actively underway. Assignment persistence remains authoritative outside the UI.",
      boundaries: ["assignments", "workflow", "creative-work"]
    },
    {
      id: "work-in-progress",
      label: "In Progress",
      slug: "in-progress",
      description: "Creator-owned work in active governed states, without independently changing payment, qualification, consent, or delivery state.",
      boundaries: ["assignments", "workflow", "creative-work"]
    },
    {
      id: "work-awaiting-customer",
      label: "Awaiting Customer",
      slug: "awaiting-customer",
      description: "Work legitimately blocked on customer, family, or authorized-reviewer input. Creator inactivity alone does not create this state.",
      boundaries: ["assignments", "workflow", "communications", "approvals"]
    },
    {
      id: "work-revision",
      label: "Revision",
      slug: "revision",
      description: "Creator work with an active revision request, retaining the relationship between feedback, LyricVersion history, and the governing workflow.",
      boundaries: ["assignments", "creative-work", "workflow", "approvals"]
    },
    {
      id: "work-completed",
      label: "Completed",
      slug: "completed",
      description: "Creator tasks completed under the governing workflow. Creator-task completion is not equivalent to song delivery or order closure.",
      boundaries: ["assignments", "workflow", "creative-work"]
    }
  ],
  story: [
    {
      id: "story-interview-notes",
      label: "Interview Notes",
      slug: "interview-notes",
      description: "Authorized interview notes associated with the selected story/song/program context. Recording access remains subject to recording and internal-creative-use consent where applicable.",
      boundaries: ["stories", "consent", "audit"],
      requiredConsentScopes: ["internal_creative_use"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-source-materials",
      label: "Source Materials",
      slug: "source-materials",
      description: "Authorized photographs, documents, notes, submitted audio, family contributions, and other story materials through canonical StoryContribution and MediaAsset relationships rather than a Creator-only file store.",
      boundaries: ["stories", "media", "consent", "audit"],
      requiredConsentScopes: ["internal_creative_use"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-themes",
      label: "Story Themes",
      slug: "story-themes",
      description: "Structured human-authored thematic interpretation traceable to actual story material. Generated speculation is not represented as fact.",
      boundaries: ["stories", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-timeline",
      label: "Timeline",
      slug: "timeline",
      description: "A structured chronology of song-relevant life or story events where captured, not a general genealogy or memory-vault product.",
      boundaries: ["stories"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-important-people",
      label: "Important People",
      slug: "important-people",
      description: "People significant to the story, reusing canonical Person relationships rather than creating duplicate Person records for names that appear in lyrics.",
      boundaries: ["stories", "people"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-facts-to-verify",
      label: "Facts to Verify",
      slug: "facts-to-verify",
      description: "Unresolved names, dates, places, relationships, events, and other song-relevant facts, explicitly distinguished from verified information.",
      boundaries: ["stories", "communications", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-pronunciations",
      label: "Pronunciations",
      slug: "pronunciations",
      description: "Names, places, organizations, and other terms requiring correct pronunciation before recording or performance.",
      boundaries: ["stories", "creative-work"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "story-sensitive-content-flags",
      label: "Sensitive Content Flags",
      slug: "sensitive-content-flags",
      description: "Internal workflow/sensitivity flags for material requiring special handling. These are not medical records, therapy notes, psychological assessments, or clinical decision support.",
      boundaries: ["stories", "consent", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    }
  ],
  song: [
    {
      id: "song-overview",
      label: "Song Overview",
      slug: "overview",
      description: "Operational summary of the selected canonical CreativeWork: work type, associated context, lifecycle status, assigned creator where supported, deadline, review state, production readiness, blockers, and appropriate next action.",
      boundaries: ["creative-work", "assignments", "workflow", "approvals", "media"],
      requiresCreativeWork: true
    },
    {
      id: "song-lyrics",
      label: "Lyrics",
      slug: "lyrics",
      description: "Versioned human lyric-development workflow for the selected CreativeWork, with draft, version history, and comparison as genuine grandchildren.",
      boundaries: ["creative-work", "workflow", "approvals", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      grandchildren: lyricGrandchildren
    },
    {
      id: "song-customer-feedback",
      label: "Customer Feedback",
      slug: "customer-feedback",
      description: "Authorized feedback connected to the current CreativeWork or version, distinct from internal notes, formal approvals, revision requests, and system status.",
      boundaries: ["creative-work", "communications", "approvals"],
      exposure: "authorized_collaboration",
      requiresCreativeWork: true
    },
    {
      id: "song-internal-notes",
      label: "Internal Notes",
      slug: "internal-notes",
      description: "Creator/internal-team notes that must not appear in Customer, Family, Facility, or Secure Delivery surfaces.",
      boundaries: ["creative-work", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    },
    {
      id: "song-approvals",
      label: "Approvals",
      slug: "approvals",
      description: "Traceable approval workflow using canonical Approval records rather than unaudited page booleans. Creator screens cannot manufacture approval or bypass prerequisite review state.",
      boundaries: ["approvals", "creative-work", "workflow", "audit"],
      requiresCreativeWork: true,
      action: { label: "Record authoritative approval", service: "approvals" }
    },
    {
      id: "song-files",
      label: "Files",
      slug: "files",
      description: "CreativeWork-associated MediaAsset records appropriate to Song Workspace without duplicating the full Media workflow.",
      boundaries: ["media", "creative-work", "consent"],
      exposure: "creator_internal",
      requiresCreativeWork: true
    }
  ],
  production: [
    {
      id: "production-composition",
      label: "Composition",
      slug: "composition",
      description: "Composition activity/state associated with the selected CreativeWork after governed production readiness.",
      boundaries: ["creative-work", "workflow", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Update composition state", service: "workflow" }
    },
    {
      id: "production-arrangement",
      label: "Arrangement",
      slug: "arrangement",
      description: "Arrangement activity/state for the selected CreativeWork through the shared creative-work and workflow boundaries.",
      boundaries: ["creative-work", "workflow", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Update arrangement state", service: "workflow" }
    },
    {
      id: "production-recording",
      label: "Recording",
      slug: "recording",
      description: "Recording workflow and readiness. Relevant pronunciations and unresolved facts remain visible before recording; production cannot begin from an unapproved lyric draft.",
      boundaries: ["creative-work", "workflow", "stories", "media", "consent", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Update recording state", service: "workflow" }
    },
    {
      id: "production-editing",
      label: "Editing",
      slug: "editing",
      description: "Post-recording editing activity using canonical CreativeWork and MediaAsset relationships.",
      boundaries: ["creative-work", "workflow", "media", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Update editing state", service: "workflow" }
    },
    {
      id: "production-mixing",
      label: "Mixing",
      slug: "mixing",
      description: "Mixing activity/state for the selected CreativeWork without turning the platform into generic production software.",
      boundaries: ["creative-work", "workflow", "media", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Update mixing state", service: "workflow" }
    },
    {
      id: "production-mastering-finalization",
      label: "Mastering / Finalization",
      slug: "mastering-finalization",
      description: "Finalization/mastering where applicable, still upstream of required quality review, final approval, and secure delivery.",
      boundaries: ["creative-work", "workflow", "media", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Update finalization state", service: "workflow" }
    },
    {
      id: "production-quality-review",
      label: "Quality Review",
      slug: "quality-review",
      description: "Final production quality-control gate before appropriate downstream final approval and delivery. Completing one production task does not make a work securely deliverable.",
      boundaries: ["creative-work", "workflow", "approvals", "media", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Record quality-review state", service: "workflow" }
    }
  ],
  media: [
    {
      id: "media-working-files",
      label: "Working Files",
      slug: "working-files",
      description: "Authorized in-progress production MediaAsset records. Working assets remain internal and do not automatically become customer-accessible.",
      boundaries: ["media", "creative-work", "consent", "audit"],
      exposure: "creator_internal",
      requiresCreativeWork: true,
      action: { label: "Upload working asset", service: "media" }
    },
    {
      id: "media-final-audio",
      label: "Final Audio",
      slug: "final-audio",
      description: "Approved/finalized audio MediaAsset records. An uploaded audio file is not automatically final or approved.",
      boundaries: ["media", "creative-work", "approvals", "audit"],
      exposure: "delivery_candidate",
      requiresCreativeWork: true,
      action: { label: "Register finalized audio", service: "media" }
    },
    {
      id: "media-lyric-pdf",
      label: "Lyric PDF",
      slug: "lyric-pdf",
      description: "Generated or approved lyric-document MediaAsset where supported, preserving the relationship to the applicable approved lyric version.",
      boundaries: ["media", "creative-work", "approvals", "audit"],
      exposure: "delivery_candidate",
      requiresCreativeWork: true,
      action: { label: "Generate lyric document", service: "media" }
    },
    {
      id: "media-delivery-assets",
      label: "Delivery Assets",
      slug: "delivery-assets",
      description: "Assets prepared for the separate Secure Delivery or keepsake boundary. They are not publicly addressable by default and require entitlement and consent evaluation downstream.",
      boundaries: ["media", "secure-delivery", "consent", "approvals", "audit"],
      exposure: "delivery_candidate",
      requiresCreativeWork: true,
      action: { label: "Prepare secure delivery asset", service: "secure-delivery" }
    }
  ],
  calendar: [],
  messages: []
};

export const creatorLeafDestinations: Partial<Record<CreatorParentId, CreatorWorkflowNode>> = {
  calendar: {
    id: "creator-calendar",
    label: "Calendar",
    slug: "calendar",
    description: "Creator scheduling view for source-supported interviews, program sessions, production commitments, rehearsals, events, and other assigned work through the shared scheduling boundary. No separate Creator scheduling backend is created.",
    boundaries: ["scheduling", "assignments", "workflow"],
    action: { label: "Create or change scheduled commitment", service: "scheduling" }
  },
  messages: {
    id: "creator-messages",
    label: "Messages",
    slug: "messages",
    description: "Authorized Creator communication with customers, authorized family, facility/program teams, or internal operations through the normalized communications boundary. No provider-specific React logic or simulated successful send is introduced.",
    boundaries: ["communications", "people", "consent", "audit"],
    action: { label: "Send message", service: "communications" }
  }
};

export type CreatorRouteResolution = {
  parent: NavigationItem;
  child?: CreatorWorkflowNode;
  grandchild?: CreatorWorkflowNode;
  creativeWorkId?: string;
  contextual: boolean;
};

export function getCreatorParent(parentId: CreatorParentId) {
  const parent = workspaceNavigation.creator.find((item) => item.id === parentId);
  if (!parent) throw new Error(`Unknown Creator parent: ${parentId}`);
  return parent;
}

export function getCreatorChildren(parentId: CreatorParentId) {
  return creatorChildren[parentId];
}

export function getCreatorChild(parentId: CreatorParentId, childId: string) {
  return creatorChildren[parentId].find((item) => item.id === childId);
}

function parentIdFromSlug(slug: string): CreatorParentId | undefined {
  if (slug === "dashboard") return "creator-home";
  return workspaceNavigation.creator.find((item) => item.slug === slug)?.id as CreatorParentId | undefined;
}

export function resolveCreatorRoute(inputSegments: readonly string[]): CreatorRouteResolution | undefined {
  let segments = [...inputSegments];
  let creativeWorkId: string | undefined;
  let contextual = false;

  if (segments[0] === "creative-work") {
    if (!segments[1]) return undefined;
    creativeWorkId = decodeURIComponent(segments[1]);
    if (!creativeWorkId) return undefined;
    contextual = true;
    segments = segments.slice(2);
  }

  if (segments.length === 0) {
    return { parent: getCreatorParent("creator-home"), creativeWorkId, contextual };
  }

  const parentId = parentIdFromSlug(segments[0]);
  if (!parentId) return undefined;
  const parent = getCreatorParent(parentId);

  if (segments.length === 1) {
    return { parent, creativeWorkId, contextual };
  }

  const child = creatorChildren[parentId].find((item) => item.slug === segments[1]);
  if (!child) return undefined;

  if (segments.length === 2) {
    return { parent, child, creativeWorkId, contextual };
  }

  if (!child.grandchildren || segments.length !== 3) return undefined;
  const grandchild = child.grandchildren.find((item) => item.slug === segments[2]);
  if (!grandchild) return undefined;
  return { parent, child, grandchild, creativeWorkId, contextual };
}

export function buildCreatorHref(options: {
  parentId: CreatorParentId;
  childId?: string;
  grandchildId?: string;
  creativeWorkId?: string;
}) {
  const { parentId, childId, grandchildId, creativeWorkId } = options;
  const segments = ["creator"];
  if (creativeWorkId) segments.push("creative-work", encodeURIComponent(creativeWorkId));

  const parent = getCreatorParent(parentId);
  if (parentId !== "creator-home") segments.push(parent.slug);

  if (childId) {
    const child = getCreatorChild(parentId, childId);
    if (!child) throw new Error(`Unknown Creator child ${childId} for ${parentId}`);
    if (parentId === "creator-home") segments.push("dashboard");
    segments.push(child.slug);

    if (grandchildId) {
      const grandchild = child.grandchildren?.find((item) => item.id === grandchildId);
      if (!grandchild) throw new Error(`Unknown Creator grandchild ${grandchildId} for ${childId}`);
      segments.push(grandchild.slug);
    }
  } else if (grandchildId) {
    throw new Error("Creator grandchild routes require a child workflow.");
  }

  return `/${segments.join("/")}`;
}

function routeSegmentsFor(options: Parameters<typeof buildCreatorHref>[0]) {
  return buildCreatorHref(options).split("/").filter(Boolean).slice(1);
}

export function getCreatorStaticRouteSlugs(referenceCreativeWorkId: string) {
  const routes: string[][] = [];
  const add = (segments: string[]) => routes.push(segments);

  (Object.keys(creatorChildren) as CreatorParentId[]).forEach((parentId) => {
    add(routeSegmentsFor({ parentId }));
    add(routeSegmentsFor({ parentId, creativeWorkId: referenceCreativeWorkId }));

    creatorChildren[parentId].forEach((child) => {
      add(routeSegmentsFor({ parentId, childId: child.id }));
      add(routeSegmentsFor({ parentId, childId: child.id, creativeWorkId: referenceCreativeWorkId }));

      child.grandchildren?.forEach((grandchild) => {
        add(routeSegmentsFor({ parentId, childId: child.id, grandchildId: grandchild.id }));
        add(routeSegmentsFor({ parentId, childId: child.id, grandchildId: grandchild.id, creativeWorkId: referenceCreativeWorkId }));
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
