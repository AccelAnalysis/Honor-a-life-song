export const workspaceIds = ["customer", "organization", "facility", "creator", "admin"] as const;
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
    { id: "customer-home", label: "Dashboard", slug: "", description: "See your current song, progress, next step, messages, and recent updates.", availability: "chassis" },
    { id: "journey", label: "My Song Journey", slug: "journey", description: "Follow your song from the first request through story, lyrics, production, and delivery.", availability: "structured", unavailableReason: structured },
    { id: "story", label: "Story & Memories", slug: "story", description: "Share memories, people, places, important moments, and supporting photos or files.", availability: "structured", unavailableReason: structured },
    { id: "interviews", label: "Interviews", slug: "interviews", description: "Schedule, prepare for, and keep track of your story conversations.", availability: "structured", unavailableReason: structured },
    { id: "reviews", label: "Lyrics & Review", slug: "reviews", description: "Review lyrics, share feedback, request revisions, and approve the song.", availability: "structured", unavailableReason: structured },
    { id: "family", label: "Family & Collaborators", slug: "family", description: "Invite family members, collect contributions, and manage who can take part.", availability: "structured", unavailableReason: structured },
    { id: "messages", label: "Messages", slug: "messages", description: "Read messages about your song and next steps.", availability: "structured", unavailableReason: structured },
    { id: "files", label: "Files & Keepsakes", slug: "files", description: "Access the final song, lyric sheet, song card, and other keepsakes.", availability: "structured", unavailableReason: structured },
    { id: "orders", label: "Payments & Orders", slug: "orders", description: "Review your order, payments, receipts, balances, and add-ons.", availability: "structured", unavailableReason: structured },
    { id: "permissions", label: "Consent & Permissions", slug: "permissions", description: "Review and manage choices about recording, sharing, performance, photos, video, and public use.", availability: "structured", unavailableReason: structured }
  ],
  organization: [
    { id: "organization-home", label: "Home", slug: "", description: "See your next experience, recent memories, agreements that need attention, and future dates.", availability: "structured" },
    { id: "organization-experiences", label: "Experiences", slug: "experiences", description: "Manage upcoming experiences and revisit the events your organization has already completed.", availability: "structured" },
    { id: "organization-library", label: "Songs & Memories", slug: "library", description: "Return to songs, lyrics, event videos, photos, reports, and keepsakes from completed experiences.", availability: "structured" },
    { id: "organization-account", label: "Account", slug: "account", description: "Manage your organization, authorized team, agreements, and billing information.", availability: "structured" },
    { id: "organization-help", label: "Help", slug: "help", description: "Get help with your account, an upcoming experience, or completed event materials.", availability: "structured" }
  ],
  facility: [
    { id: "facility-home", label: "Program Dashboard", slug: "", description: "See program status, participants, activities, songs, event readiness, and next actions.", availability: "chassis" },
    { id: "program", label: "Program Overview", slug: "program", description: "Review program scope, dates, team, funding, and deliverables.", availability: "structured", unavailableReason: structured },
    { id: "participants", label: "Participants", slug: "participants", description: "Manage the participant roster, accessibility needs, permissions, story participation, and family connections.", availability: "structured", unavailableReason: structured },
    { id: "schedule", label: "Schedule & Activities", slug: "schedule", description: "Plan story sessions, interviews, songwriting, rehearsals, events, and keepsake delivery.", availability: "structured", unavailableReason: structured },
    { id: "stories", label: "Stories & Interviews", slug: "stories", description: "Keep track of story conversations, interview notes, and family contributions.", availability: "structured", unavailableReason: structured },
    { id: "songs", label: "Songs & Creative Works", slug: "songs", description: "Follow individual and group songs as they move toward review and completion.", availability: "structured", unavailableReason: structured },
    { id: "families", label: "Families", slug: "families", description: "Manage family contacts, invitations, contributions, and event attendance.", availability: "structured", unavailableReason: structured },
    { id: "events", label: "Concert & Events", slug: "events", description: "Plan the venue, run of show, participants, invitations, accessibility, and media permissions.", availability: "structured", unavailableReason: structured },
    { id: "keepsakes", label: "Keepsakes", slug: "keepsakes", description: "Track digital and physical keepsake delivery.", availability: "structured", unavailableReason: structured },
    { id: "funding", label: "Sponsors & Funding", slug: "funding", description: "Track funding sources, commitments, restrictions, and approved sponsor recognition.", availability: "structured", unavailableReason: structured },
    { id: "outcomes", label: "Reports & Outcomes", slug: "outcomes", description: "Review participation, family engagement, completed songs, attendance, satisfaction, and program results.", availability: "structured", unavailableReason: structured }
  ],
  creator: [
    { id: "creator-home", label: "Creator Dashboard", slug: "", description: "See assigned work, due dates, reviews, revisions, and songs ready for production.", availability: "chassis" },
    { id: "work", label: "My Work", slug: "work", description: "Review your assignments by current stage and priority.", availability: "structured", unavailableReason: structured },
    { id: "story", label: "Story Workspace", slug: "story", description: "Work with interview notes, source material, themes, important facts, pronunciations, and sensitive details.", availability: "structured", unavailableReason: structured },
    { id: "song", label: "Song Workspace", slug: "song", description: "Develop lyrics, review feedback, manage versions, approvals, notes, and files.", availability: "structured", unavailableReason: structured },
    { id: "production", label: "Production", slug: "production", description: "Move approved songs through composition, arrangement, recording, editing, mixing, and final review.", availability: "structured", unavailableReason: structured },
    { id: "media", label: "Media", slug: "media", description: "Manage working files, final audio, lyric documents, and delivery materials.", availability: "structured", unavailableReason: structured },
    { id: "calendar", label: "Calendar", slug: "calendar", description: "See assigned interviews, sessions, deadlines, and production commitments.", availability: "structured", unavailableReason: structured },
    { id: "messages", label: "Messages", slug: "messages", description: "Keep customer, family, facility, and internal project communication together.", availability: "structured", unavailableReason: structured }
  ],
  admin: [
    { id: "admin-home", label: "Executive Dashboard", slug: "", description: "See requests, orders, programs, completed songs, revenue, capacity, and alerts.", availability: "structured", unavailableReason: structured },
    { id: "requests", label: "Requests & Leads", slug: "requests", description: "Manage new inquiries, qualification, consultations, quotes, and conversions.", availability: "structured", unavailableReason: structured },
    { id: "programs", label: "Orders & Programs", slug: "programs", description: "Manage individual orders, Project Ageless programs, exceptions, and closed work.", availability: "structured", unavailableReason: structured },
    { id: "people", label: "Users & Organizations", slug: "people", description: "Manage customers, families, organization accounts, facilities, creators, partners, and sponsors.", availability: "structured", unavailableReason: structured },
    { id: "catalog", label: "Catalog & Pricing", slug: "catalog", description: "Manage packages, program options, add-ons, deposits, revision limits, and turnaround targets.", availability: "structured", unavailableReason: structured },
    { id: "finance", label: "Payments & Finance", slug: "finance", description: "Manage payments, invoices, refunds, sponsor funding, and reconciliation.", availability: "structured", unavailableReason: structured },
    { id: "scheduling", label: "Scheduling", slug: "scheduling", description: "Coordinate interviews, facility visits, sessions, events, and creator availability.", availability: "structured", unavailableReason: structured },
    { id: "communications", label: "Communications", slug: "communications", description: "Manage message templates, email, SMS, delivery failures, and communication history.", availability: "structured", unavailableReason: structured },
    { id: "consent", label: "Consent & Compliance", slug: "consent", description: "Manage participant permissions, restrictions, withdrawals, retention, and audit history separately from organization service agreements.", availability: "structured", unavailableReason: structured },
    { id: "reports", label: "Reports & Analytics", slug: "reports", description: "Review commercial, operational, program, and funding results.", availability: "structured", unavailableReason: structured },
    { id: "monitoring", label: "Monitoring & Incidents", slug: "monitoring", description: "Review operational health, failures, incidents, and recovery activity.", availability: "structured", unavailableReason: structured },
    { id: "settings", label: "Settings", slug: "settings", description: "Manage roles, permissions, program settings, statuses, notifications, and feature availability.", availability: "structured", unavailableReason: structured }
  ]
};

export function isWorkspaceId(value: string): value is WorkspaceId {
  return workspaceIds.includes(value as WorkspaceId);
}

export function getNavigation(workspace: WorkspaceId) {
  return workspaceNavigation[workspace];
}
