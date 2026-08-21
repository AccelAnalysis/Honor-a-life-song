import type { ConsentScope } from "../domain/consent";
import { workspaceNavigation, type NavigationItem } from "./navigation";

export type FacilityParentId =
  | "facility-home"
  | "program"
  | "participants"
  | "schedule"
  | "stories"
  | "songs"
  | "families"
  | "events"
  | "keepsakes"
  | "funding"
  | "outcomes";

export type FacilityServiceBoundary =
  | "programs"
  | "people"
  | "scheduling"
  | "stories"
  | "creative-work"
  | "consent"
  | "communications"
  | "media"
  | "secure-delivery"
  | "funding"
  | "reporting"
  | "audit";

export type FacilityWorkflowAction = {
  label: string;
  service: FacilityServiceBoundary;
  consentScope?: ConsentScope;
};

export type FacilityWorkflowTarget = {
  parentId: FacilityParentId;
  childId?: string;
};

export type FacilityWorkflowNode = {
  id: string;
  label: string;
  slug: string;
  description: string;
  boundaries: readonly FacilityServiceBoundary[];
  action?: FacilityWorkflowAction;
  target?: FacilityWorkflowTarget;
  grandchildren?: readonly FacilityWorkflowNode[];
};

export const facilityServiceConnections: Record<FacilityServiceBoundary, boolean> = {
  programs: false,
  people: false,
  scheduling: false,
  stories: false,
  "creative-work": false,
  consent: false,
  communications: false,
  media: false,
  "secure-delivery": false,
  funding: false,
  reporting: false,
  audit: false
};

const participantDetailGrandchildren: readonly FacilityWorkflowNode[] = [
  {
    id: "participant-contact-representative",
    label: "Contact / Representative",
    slug: "contact-representative",
    description: "Contact information and authorized representative relationships for the selected participant, without creating a participant account.",
    boundaries: ["people", "audit"]
  },
  {
    id: "participant-participation-status",
    label: "Participation Status",
    slug: "participation-status",
    description: "The selected participant's relationship to the ProgramRun. This is distinct from attendance at individual touchpoints.",
    boundaries: ["programs", "audit"]
  },
  {
    id: "participant-accessibility-notes",
    label: "Accessibility Notes",
    slug: "accessibility-notes",
    description: "Program-useful accessibility and accommodation information only; this is not a clinical or health-record workspace.",
    boundaries: ["programs", "audit"]
  },
  {
    id: "participant-consent",
    label: "Consent",
    slug: "consent",
    description: "Granular participant permissions evaluated independently from facility-user authorization.",
    boundaries: ["consent", "audit"],
    action: { label: "Record or change consent", service: "consent" }
  },
  {
    id: "participant-story-contributions",
    label: "Story Contributions",
    slug: "story-contributions",
    description: "Story contributions associated with the participant through the shared story system and applicable consent restrictions.",
    boundaries: ["stories", "consent", "media"]
  },
  {
    id: "participant-touchpoint-attendance",
    label: "Touchpoint Attendance",
    slug: "touchpoint-attendance",
    description: "Participation records joining this participant to individual Touchpoints with planned, attended, declined, or missed attendance states.",
    boundaries: ["programs", "scheduling", "audit"]
  },
  {
    id: "participant-song-status",
    label: "Song Status",
    slug: "song-status",
    description: "CreativeWork records associated with the participant, without exposing the internal Creator / Production workspace.",
    boundaries: ["creative-work"]
  },
  {
    id: "participant-family-connections",
    label: "Family Connections",
    slug: "family-connections",
    description: "Explicitly authorized family relationships and contributors scoped to this participant and program context.",
    boundaries: ["people", "consent", "audit"]
  }
];

export const facilityChildren: Record<FacilityParentId, readonly FacilityWorkflowNode[]> = {
  "facility-home": [
    {
      id: "dashboard-program-status",
      label: "Program Status",
      slug: "program-status",
      description: "Current ProgramRun status and the next governed lifecycle state; the UI does not manufacture lifecycle progress.",
      boundaries: ["programs", "audit"]
    },
    {
      id: "dashboard-participants",
      label: "Participants",
      slug: "participants",
      description: "Operational participant summary with a direct path to the canonical participant roster.",
      boundaries: ["programs", "people"],
      target: { parentId: "participants", childId: "participant-roster" }
    },
    {
      id: "dashboard-active-touchpoints",
      label: "Active Touchpoints",
      slug: "active-touchpoints",
      description: "Configured program touchpoints requiring attention, linked to the shared scheduling workflow.",
      boundaries: ["scheduling", "programs"],
      target: { parentId: "schedule", childId: "program-calendar" }
    },
    {
      id: "dashboard-stories-captured",
      label: "Stories Captured",
      slug: "stories-captured",
      description: "Story work associated with the ProgramRun, linked to the shared story capture workflow.",
      boundaries: ["stories", "consent"],
      target: { parentId: "stories", childId: "story-capture-queue" }
    },
    {
      id: "dashboard-songs-in-progress",
      label: "Songs in Progress",
      slug: "songs-in-progress",
      description: "CreativeWork progress appropriate to facility users, linked to Songs & Creative Works.",
      boundaries: ["creative-work"],
      target: { parentId: "songs", childId: "song-status" }
    },
    {
      id: "dashboard-concert-countdown",
      label: "Concert Countdown",
      slug: "concert-countdown",
      description: "Event-readiness context based on configured program dates and event state, linked to Concert & Events.",
      boundaries: ["programs", "scheduling"],
      target: { parentId: "events", childId: "event-details" }
    },
    {
      id: "dashboard-action-items",
      label: "Action Items",
      slug: "action-items",
      description: "Legitimate next actions derived from governed ProgramRun state and connected workflow readiness, not an independent UI checklist.",
      boundaries: ["programs", "consent", "scheduling", "audit"]
    }
  ],
  program: [
    { id: "program-scope", label: "Scope", slug: "scope", description: "Contracted or configured program scope for the selected ProgramRun.", boundaries: ["programs", "funding"] },
    { id: "program-dates", label: "Dates", slug: "dates", description: "Program-run date range and relevant governed milestones.", boundaries: ["programs", "scheduling"] },
    { id: "program-team", label: "Program Team", slug: "program-team", description: "Authorized delivery and coordination people represented through canonical people, memberships, roles, and organization relationships.", boundaries: ["people", "programs", "audit"] },
    { id: "program-funding", label: "Funding", slug: "funding", description: "Program-level funding summary only; detailed funding source and restriction work remains in Sponsors & Funding.", boundaries: ["funding"] },
    { id: "program-deliverables", label: "Deliverables", slug: "deliverables", description: "Expected outputs configured by ProgramTemplate and ProgramRun, including applicable creative works, events, keepsakes, and reports.", boundaries: ["programs", "creative-work", "reporting"] }
  ],
  participants: [
    { id: "participant-roster", label: "Participant Roster", slug: "roster", description: "Participants belonging to the selected ProgramRun, including people who have no email, account, smartphone, or independent digital access.", boundaries: ["programs", "people", "consent"] },
    { id: "add-participant", label: "Add Participant", slug: "add", description: "Add a person to the current ProgramRun through the canonical Participant/Person model without automatically creating an authenticated account.", boundaries: ["programs", "people", "audit"], action: { label: "Add participant", service: "programs" } },
    { id: "participant-detail", label: "Participant Detail", slug: "detail", description: "Selected-participant context with nested contact, participation, accessibility, consent, story, attendance, creative-work, and family views.", boundaries: ["programs", "people", "consent", "stories", "creative-work"], grandchildren: participantDetailGrandchildren },
    { id: "participant-import-export", label: "Import / Export Roster", slug: "import-export", description: "Roster import/export workflow boundary. Authoritative persistence and generated exports remain gated until production repositories are connected.", boundaries: ["programs", "people", "reporting", "audit"], action: { label: "Import or export authoritative roster", service: "programs" } }
  ],
  schedule: [
    { id: "program-calendar", label: "Program Calendar", slug: "program-calendar", description: "Program-wide view of configured touchpoints and events through the shared scheduling boundary.", boundaries: ["scheduling", "programs"] },
    { id: "group-story-session", label: "Group Story Session", slug: "group-story-session", description: "Group story-sharing Touchpoint workflow; attendance is recorded per participant/touchpoint and is not universally required.", boundaries: ["scheduling", "programs", "stories"], action: { label: "Schedule group story session", service: "scheduling" } },
    { id: "individual-interview", label: "Individual Interview", slug: "individual-interview", description: "Participant-specific interview Touchpoint using shared scheduling and story boundaries.", boundaries: ["scheduling", "programs", "stories", "consent"], action: { label: "Schedule individual interview", service: "scheduling" } },
    { id: "family-interview", label: "Family Interview", slug: "family-interview", description: "Authorized family-contributed interview or story Touchpoint, scoped to the applicable participant and consent.", boundaries: ["scheduling", "stories", "people", "consent"], action: { label: "Schedule family interview", service: "scheduling", consentScope: "designated_family_sharing" } },
    { id: "songwriting-session", label: "Songwriting Session", slug: "songwriting-session", description: "Configured individual or group creative Touchpoint using the shared creative-work workflow.", boundaries: ["scheduling", "creative-work", "programs"], action: { label: "Schedule songwriting session", service: "scheduling" } },
    { id: "rehearsal-listening", label: "Rehearsal / Listening", slug: "rehearsal-listening", description: "Listening or rehearsal Touchpoint that may be offered without becoming mandatory for every participant.", boundaries: ["scheduling", "creative-work", "programs"], action: { label: "Schedule rehearsal or listening", service: "scheduling" } },
    { id: "schedule-concert", label: "Concert", slug: "concert", description: "Scheduled concert or presentation Touchpoint with a direct path to the fuller Concert & Events workflow.", boundaries: ["scheduling", "programs"], target: { parentId: "events", childId: "event-details" } },
    { id: "schedule-keepsake-delivery", label: "Keepsake Delivery", slug: "keepsake-delivery", description: "Scheduled or completed keepsake-delivery Touchpoint with a direct path to the Keepsakes module.", boundaries: ["scheduling", "secure-delivery", "programs"], target: { parentId: "keepsakes", childId: "distribution-status" } }
  ],
  stories: [
    { id: "story-capture-queue", label: "Story Capture Queue", slug: "story-capture-queue", description: "Participant and program story work requiring attention through the shared story domain.", boundaries: ["stories", "consent", "programs"] },
    { id: "interview-schedule", label: "Interview Schedule", slug: "interview-schedule", description: "Story/interview scheduling context using the platform scheduling boundary rather than a Facility-only calendar backend.", boundaries: ["stories", "scheduling"] },
    { id: "interview-notes", label: "Interview Notes", slug: "interview-notes", description: "Interview notes in the shared story domain with authorization and consent restrictions enforced independently.", boundaries: ["stories", "consent", "audit"] },
    { id: "family-contributions", label: "Family Contributions", slug: "family-contributions", description: "Authorized family memories and source material associated with the applicable participant/story.", boundaries: ["stories", "people", "consent", "media"] },
    { id: "story-status", label: "Story Status", slug: "story-status", description: "Story-development readiness and progress without clinical, therapeutic, or autonomous-AI interpretation.", boundaries: ["stories", "programs"] }
  ],
  songs: [
    { id: "individual-songs", label: "Individual Songs", slug: "individual-songs", description: "Canonical CreativeWork records associated with individual participants where applicable.", boundaries: ["creative-work", "programs", "consent"] },
    { id: "group-community-song", label: "Group / Community Song", slug: "group-community-song", description: "Shared program CreativeWork using the same meaning-to-song engine as other Honor a Life Song work.", boundaries: ["creative-work", "programs"] },
    { id: "song-status", label: "Song Status", slug: "song-status", description: "Governed CreativeWork state appropriate to facility users.", boundaries: ["creative-work"] },
    { id: "review-readiness", label: "Review Readiness", slug: "review-readiness", description: "Whether applicable CreativeWork is ready for the appropriate shared review and approval workflow, without exposing internal production notes.", boundaries: ["creative-work", "consent"], action: { label: "Request or record governed review", service: "creative-work" } }
  ],
  families: [
    { id: "family-contacts", label: "Family Contacts", slug: "family-contacts", description: "Family contacts explicitly connected to participants and program activity with scoped access.", boundaries: ["people", "consent"] },
    { id: "family-invitations", label: "Invitations", slug: "invitations", description: "Authorized family invitation workflow boundary; no email or SMS is simulated when messaging is not connected.", boundaries: ["communications", "people", "consent", "audit"], action: { label: "Send family invitation", service: "communications", consentScope: "designated_family_sharing" } },
    { id: "family-contributions", label: "Contributions", slug: "contributions", description: "Family-submitted memories and approved source materials connected to the shared story system.", boundaries: ["stories", "people", "consent", "media"] },
    { id: "family-event-attendance", label: "Event Attendance", slug: "event-attendance", description: "Applicable family event participation and attendance without expanding family access to unrelated participant information.", boundaries: ["programs", "scheduling", "people"] }
  ],
  events: [
    { id: "event-details", label: "Event Details", slug: "event-details", description: "Configured concert, listening event, presentation, or other supported program event.", boundaries: ["programs", "scheduling"] },
    { id: "event-venue", label: "Venue", slug: "venue", description: "Venue and logistical information for the configured event.", boundaries: ["scheduling", "programs"] },
    { id: "run-of-show", label: "Run of Show", slug: "run-of-show", description: "Structured presentation and event sequence using program and creative-work context.", boundaries: ["programs", "creative-work"] },
    { id: "event-participant-list", label: "Participant List", slug: "participant-list", description: "People participating in this event; event participation does not imply that every ProgramRun participant attends.", boundaries: ["programs", "people", "scheduling"] },
    { id: "event-family-invitations", label: "Family Invitations", slug: "family-invitations", description: "Family invitation workflow connected to shared people, consent, and messaging boundaries.", boundaries: ["communications", "people", "consent"], target: { parentId: "families", childId: "family-invitations" } },
    { id: "event-accessibility", label: "Accessibility", slug: "accessibility", description: "Event accessibility and accommodation planning without creating clinical documentation.", boundaries: ["programs", "scheduling"] },
    { id: "event-media-permissions", label: "Photography / Media Permissions", slug: "photography-media-permissions", description: "Event media uses require both operator authorization and the applicable granular participant consent.", boundaries: ["consent", "media", "audit"], action: { label: "Use event photography or video", service: "media", consentScope: "event_photo_video" } },
    { id: "event-completion", label: "Event Completion", slug: "event-completion", description: "Governed event-completion state and downstream readiness; participant attendance is never inferred automatically from event completion.", boundaries: ["programs", "scheduling", "audit"], action: { label: "Record event completion", service: "programs" } }
  ],
  keepsakes: [
    { id: "digital-deliveries", label: "Digital Deliveries", slug: "digital-deliveries", description: "Secure final-delivery workflow using shared media and secure-delivery boundaries; permanent public final-song URLs are not permitted.", boundaries: ["secure-delivery", "media", "consent", "audit"], action: { label: "Issue secure digital delivery", service: "secure-delivery", consentScope: "designated_family_sharing" } },
    { id: "printed-song-cards", label: "Printed Song Cards", slug: "printed-song-cards", description: "Printed song-card fulfillment and tracking boundary only; this is not a warehouse-management system.", boundaries: ["programs", "audit"], action: { label: "Update printed song-card fulfillment", service: "programs" } },
    { id: "distribution-status", label: "Distribution Status", slug: "distribution-status", description: "Authorized keepsake distribution state with individual consent and access restrictions respected.", boundaries: ["secure-delivery", "programs", "consent"] }
  ],
  funding: [
    { id: "funding-sources", label: "Funding Sources", slug: "funding-sources", description: "Facility-funded, sponsor-funded, multi-sponsor, nonprofit/grant-funded contracted services, and restricted funding source concepts through the shared funding boundary.", boundaries: ["funding", "programs"] },
    { id: "sponsor-commitments", label: "Sponsor Commitments", slug: "sponsor-commitments", description: "Applicable sponsor commitments associated with the ProgramRun without granting sponsors participant-record access.", boundaries: ["funding", "programs", "audit"] },
    { id: "covered-activities", label: "Covered Activities", slug: "covered-activities", description: "Activities and deliverables covered by each funding source or restriction.", boundaries: ["funding", "programs"] },
    { id: "sponsor-recognition", label: "Sponsor Recognition", slug: "sponsor-recognition", description: "Approved recognition evaluated against both program authority and participant consent for any identifiable materials.", boundaries: ["funding", "consent", "media", "audit"], action: { label: "Publish sponsor acknowledgment", service: "funding", consentScope: "sponsor_acknowledgment" } },
    { id: "funding-restrictions", label: "Restrictions", slug: "restrictions", description: "Participant eligibility, allowed activities, allocation, recognition limitations, evidence requirements, and reporting obligations without building a grant-management platform.", boundaries: ["funding", "programs", "reporting"] }
  ],
  outcomes: [
    { id: "outcome-participation", label: "Participation", slug: "participation", description: "Program participation measures derived from actual participant/touchpoint Participation records.", boundaries: ["reporting", "programs"] },
    { id: "outcome-family-engagement", label: "Family Engagement", slug: "family-engagement", description: "Applicable family involvement derived from scoped family contributions, invitations, and participation records.", boundaries: ["reporting", "people", "programs"] },
    { id: "outcome-songs-completed", label: "Songs Completed", slug: "songs-completed", description: "Completed song and CreativeWork measures derived from canonical CreativeWork state.", boundaries: ["reporting", "creative-work"] },
    { id: "outcome-event-attendance", label: "Event Attendance", slug: "event-attendance", description: "Event attendance derived from event and Participation records rather than event completion alone.", boundaries: ["reporting", "programs", "scheduling"] },
    { id: "outcome-satisfaction", label: "Satisfaction", slug: "satisfaction", description: "Workflow boundary for resident, family, and facility satisfaction measurement without claiming clinical outcomes.", boundaries: ["reporting", "programs"] },
    { id: "program-outcomes", label: "Program Outcomes", slug: "program-outcomes", description: "Participation, touchpoints, stories, creative works, family engagement, event attendance, keepsakes, satisfaction, reported connection/meaning, sponsor participation, consent issues, and renewal/referral intention.", boundaries: ["reporting", "programs", "stories", "creative-work", "consent", "funding"] },
    { id: "export-report", label: "Export Report", slug: "export-report", description: "Authoritative report/export workflow boundary. No report is fabricated while reporting persistence and generation remain unconnected.", boundaries: ["reporting", "audit"], action: { label: "Generate authoritative export", service: "reporting" } }
  ]
};

export type FacilityRouteResolution = {
  parent: NavigationItem;
  child?: FacilityWorkflowNode;
  grandchild?: FacilityWorkflowNode;
  programRunId?: string;
  participantId?: string;
  contextual: boolean;
};

export function getFacilityParent(parentId: FacilityParentId) {
  const parent = workspaceNavigation.facility.find((item) => item.id === parentId);
  if (!parent) throw new Error(`Unknown Facility parent: ${parentId}`);
  return parent;
}

export function getFacilityChildren(parentId: FacilityParentId) {
  return facilityChildren[parentId];
}

export function getFacilityChild(parentId: FacilityParentId, childId: string) {
  return facilityChildren[parentId].find((item) => item.id === childId);
}

function parentIdFromSlug(slug: string): FacilityParentId | undefined {
  if (slug === "dashboard") return "facility-home";
  return workspaceNavigation.facility.find((item) => item.slug === slug)?.id as FacilityParentId | undefined;
}

export function resolveFacilityRoute(inputSegments: readonly string[]): FacilityRouteResolution | undefined {
  let segments = [...inputSegments];
  let programRunId: string | undefined;
  let contextual = false;

  if (segments[0] === "run") {
    if (!segments[1]) return undefined;
    contextual = true;
    programRunId = decodeURIComponent(segments[1]);
    segments = segments.slice(2);
  }

  if (segments.length === 0) {
    return { parent: getFacilityParent("facility-home"), programRunId, contextual };
  }

  const parentId = parentIdFromSlug(segments[0]);
  if (!parentId) return undefined;
  const parent = getFacilityParent(parentId);

  if (segments.length === 1) {
    return { parent, programRunId, contextual };
  }

  const child = facilityChildren[parentId].find((item) => item.slug === segments[1]);
  if (!child) return undefined;

  if (child.id !== "participant-detail") {
    if (segments.length !== 2) return undefined;
    return { parent, child, programRunId, contextual };
  }

  if (segments.length === 2) {
    return { parent, child, programRunId, contextual };
  }

  const participantId = decodeURIComponent(segments[2]);
  if (!participantId) return undefined;
  if (segments.length === 3) {
    return { parent, child, participantId, programRunId, contextual };
  }

  if (segments.length !== 4) return undefined;
  const grandchild = child.grandchildren?.find((item) => item.slug === segments[3]);
  if (!grandchild) return undefined;
  return { parent, child, grandchild, participantId, programRunId, contextual };
}

export function buildFacilityHref(options: {
  parentId: FacilityParentId;
  childId?: string;
  grandchildId?: string;
  programRunId?: string;
  participantId?: string;
}) {
  const { parentId, childId, grandchildId, programRunId, participantId } = options;
  const segments = ["facility"];
  if (programRunId) segments.push("run", encodeURIComponent(programRunId));

  const parent = getFacilityParent(parentId);
  if (parentId !== "facility-home") segments.push(parent.slug);

  if (childId) {
    const child = getFacilityChild(parentId, childId);
    if (!child) throw new Error(`Unknown Facility child ${childId} for ${parentId}`);
    if (parentId === "facility-home") segments.push("dashboard");
    segments.push(child.slug);

    if (child.id === "participant-detail" && participantId) {
      segments.push(encodeURIComponent(participantId));
      if (grandchildId) {
        const grandchild = child.grandchildren?.find((item) => item.id === grandchildId);
        if (!grandchild) throw new Error(`Unknown participant-detail grandchild: ${grandchildId}`);
        segments.push(grandchild.slug);
      }
    } else if (grandchildId) {
      throw new Error("Facility grandchildren are only defined beneath Participant Detail with a selected participant.");
    }
  }

  return `/${segments.join("/")}`;
}

function routeSegmentsFor(options: Parameters<typeof buildFacilityHref>[0]) {
  return buildFacilityHref(options).split("/").filter(Boolean).slice(1);
}

export function getFacilityStaticRouteSlugs(programRunId: string, participantId: string) {
  const routes: string[][] = [];
  const add = (segments: string[]) => routes.push(segments);

  (Object.keys(facilityChildren) as FacilityParentId[]).forEach((parentId) => {
    add(routeSegmentsFor({ parentId }));
    add(routeSegmentsFor({ parentId, programRunId }));

    facilityChildren[parentId].forEach((child) => {
      add(routeSegmentsFor({ parentId, childId: child.id }));
      add(routeSegmentsFor({ parentId, childId: child.id, programRunId }));

      if (child.id === "participant-detail") {
        add(routeSegmentsFor({ parentId, childId: child.id, participantId }));
        add(routeSegmentsFor({ parentId, childId: child.id, participantId, programRunId }));
        child.grandchildren?.forEach((grandchild) => {
          add(routeSegmentsFor({ parentId, childId: child.id, participantId, grandchildId: grandchild.id }));
          add(routeSegmentsFor({ parentId, childId: child.id, participantId, grandchildId: grandchild.id, programRunId }));
        });
      }
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
