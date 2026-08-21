export const workspaceIds = ["customer", "facility", "creator", "admin"] as const;
export type WorkspaceId = (typeof workspaceIds)[number];
export type Availability = "chassis" | "structured" | "planned";

export type NavigationItem = {
  id: string;
  label: string;
  slug: string;
  description: string;
  availability: Availability;
  unavailableReason?: string;
};

const planned = "Business workflow and authoritative persistence are intentionally deferred beyond the operating-chassis slice.";
const structured = "The source-defined workflow hierarchy is implemented. Authoritative production actions remain gated until their shared services are connected.";

export const workspaceNavigation: Record<WorkspaceId, NavigationItem[]> = {
  customer: [
    { id: "customer-home", label: "Dashboard", slug: "", description: "Current journey, next action, messages and recent activity.", availability: "chassis" },
    { id: "journey", label: "My Song Journey", slug: "journey", description: "Request through story, lyrics, production and delivery.", availability: "structured", unavailableReason: structured },
    { id: "story", label: "Story & Memories", slug: "story", description: "Guided story capture, timeline, people, places and approved uploads.", availability: "structured", unavailableReason: structured },
    { id: "interviews", label: "Interviews", slug: "interviews", description: "Scheduling, preparation and interview status.", availability: "structured", unavailableReason: structured },
    { id: "reviews", label: "Lyrics & Review", slug: "reviews", description: "Versioned lyric review, feedback, revisions and approvals.", availability: "structured", unavailableReason: structured },
    { id: "family", label: "Family & Collaborators", slug: "family", description: "Invitations, contributions and scoped collaborator access.", availability: "structured", unavailableReason: structured },
    { id: "messages", label: "Messages", slug: "messages", description: "Transactional and service communications.", availability: "structured", unavailableReason: structured },
    { id: "files", label: "Files & Keepsakes", slug: "files", description: "Final song, lyric sheet, song card and secure delivery assets.", availability: "structured", unavailableReason: structured },
    { id: "orders", label: "Payments & Orders", slug: "orders", description: "Order summary, deposits, balances, receipts and approved add-ons.", availability: "structured", unavailableReason: structured },
    { id: "permissions", label: "Consent & Permissions", slug: "permissions", description: "Review authorized uses, restrictions and withdrawal paths.", availability: "structured", unavailableReason: structured }
  ],
  facility: [
    { id: "facility-home", label: "Program Dashboard", slug: "", description: "Program status, participants, touchpoints, songs, event readiness and action items.", availability: "chassis" },
    { id: "program", label: "Program Overview", slug: "program", description: "Scope, dates, program team, funding and deliverables.", availability: "planned", unavailableReason: planned },
    { id: "participants", label: "Participants", slug: "participants", description: "Roster, participant detail, accessibility, consent and family connections.", availability: "planned", unavailableReason: planned },
    { id: "schedule", label: "Schedule & Touchpoints", slug: "schedule", description: "Flexible story sessions, interviews, songwriting, rehearsals, events and delivery.", availability: "planned", unavailableReason: planned },
    { id: "stories", label: "Stories & Interviews", slug: "stories", description: "Story capture queue, interview notes and family contributions.", availability: "planned", unavailableReason: planned },
    { id: "songs", label: "Songs & Creative Works", slug: "songs", description: "Individual and group works with review readiness.", availability: "planned", unavailableReason: planned },
    { id: "families", label: "Families", slug: "families", description: "Family contacts, invitations, contributions and event attendance.", availability: "planned", unavailableReason: planned },
    { id: "events", label: "Concert & Events", slug: "events", description: "Venue, run of show, participants, invitations, accessibility and media permissions.", availability: "planned", unavailableReason: planned },
    { id: "keepsakes", label: "Keepsakes", slug: "keepsakes", description: "Digital and physical delivery tracking.", availability: "planned", unavailableReason: planned },
    { id: "funding", label: "Sponsors & Funding", slug: "funding", description: "Funding sources, allocations, restrictions and approved recognition.", availability: "planned", unavailableReason: planned },
    { id: "outcomes", label: "Reports & Outcomes", slug: "outcomes", description: "Participation, family engagement, completed works, attendance and satisfaction.", availability: "planned", unavailableReason: planned }
  ],
  creator: [
    { id: "creator-home", label: "Creator Dashboard", slug: "", description: "Assigned work, due dates, review queues, revisions and production readiness.", availability: "chassis" },
    { id: "work", label: "My Work", slug: "work", description: "Assignments by lifecycle state.", availability: "planned", unavailableReason: planned },
    { id: "story", label: "Story Workspace", slug: "story", description: "Interview notes, source materials, themes, facts and sensitive-content flags.", availability: "planned", unavailableReason: planned },
    { id: "song", label: "Song Workspace", slug: "song", description: "Lyrics, versions, feedback, notes, approvals and files.", availability: "planned", unavailableReason: planned },
    { id: "production", label: "Production", slug: "production", description: "Composition through quality review and finalization.", availability: "planned", unavailableReason: planned },
    { id: "media", label: "Media", slug: "media", description: "Working files, final audio, lyric documents and delivery assets.", availability: "planned", unavailableReason: planned },
    { id: "calendar", label: "Calendar", slug: "calendar", description: "Assigned interviews, sessions and production commitments.", availability: "planned", unavailableReason: planned },
    { id: "messages", label: "Messages", slug: "messages", description: "Customer, family, facility and internal workflow communications.", availability: "planned", unavailableReason: planned }
  ],
  admin: [
    { id: "admin-home", label: "Executive Dashboard", slug: "", description: "Requests, orders, programs, completed songs, revenue, capacity and alerts.", availability: "chassis" },
    { id: "requests", label: "Requests / CRM-Lite", slug: "requests", description: "Inquiries, qualification, consultations, quotes and conversion.", availability: "planned", unavailableReason: planned },
    { id: "programs", label: "Orders & Programs", slug: "programs", description: "Individual orders, Project Ageless runs, exceptions and closed work.", availability: "planned", unavailableReason: planned },
    { id: "people", label: "Users & Organizations", slug: "people", description: "Customers, collaborators, facilities, creators, partners and sponsors.", availability: "planned", unavailableReason: planned },
    { id: "catalog", label: "Catalog & Pricing", slug: "catalog", description: "Packages, program templates, add-ons, deposits, revisions and turnaround targets.", availability: "planned", unavailableReason: planned },
    { id: "finance", label: "Payments & Finance", slug: "finance", description: "Payments, invoices, refunds, sponsor funding and reconciliation.", availability: "planned", unavailableReason: planned },
    { id: "scheduling", label: "Scheduling", slug: "scheduling", description: "Interviews, facility visits, sessions, events and creator availability.", availability: "planned", unavailableReason: planned },
    { id: "communications", label: "Communications", slug: "communications", description: "Templates, email, SMS, failures and communication history.", availability: "planned", unavailableReason: planned },
    { id: "consent", label: "Consent & Compliance", slug: "consent", description: "Consent records, restrictions, withdrawals, retention and audit history.", availability: "planned", unavailableReason: planned },
    { id: "reports", label: "Reports & Analytics", slug: "reports", description: "Commercial, operational, program and funding reporting.", availability: "planned", unavailableReason: planned },
    { id: "monitoring", label: "Monitoring & Incidents", slug: "monitoring", description: "Operational health, failures, incidents and recovery workflows.", availability: "planned", unavailableReason: planned },
    { id: "settings", label: "Platform Configuration", slug: "settings", description: "Roles, permissions, program templates, statuses, notifications and feature flags.", availability: "planned", unavailableReason: planned }
  ]
};

export function isWorkspaceId(value: string): value is WorkspaceId {
  return workspaceIds.includes(value as WorkspaceId);
}

export function getNavigation(workspace: WorkspaceId) {
  return workspaceNavigation[workspace];
}
