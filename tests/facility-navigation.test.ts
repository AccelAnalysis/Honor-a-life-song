import { describe, expect, it } from "vitest";
import {
  buildFacilityHref,
  facilityChildren,
  facilityServiceConnections,
  getFacilityChild,
  getFacilityStaticRouteSlugs,
  resolveFacilityRoute,
  type FacilityParentId
} from "../lib/facility-navigation";
import { workspaceNavigation } from "../lib/navigation";

const expectedParents = [
  "Program Dashboard",
  "Program Overview",
  "Participants",
  "Schedule & Touchpoints",
  "Stories & Interviews",
  "Songs & Creative Works",
  "Families",
  "Concert & Events",
  "Keepsakes",
  "Sponsors & Funding",
  "Reports & Outcomes"
] as const;

const expectedChildren: Record<FacilityParentId, readonly string[]> = {
  "facility-home": ["Program Status", "Participants", "Active Touchpoints", "Stories Captured", "Songs in Progress", "Concert Countdown", "Action Items"],
  program: ["Scope", "Dates", "Program Team", "Funding", "Deliverables"],
  participants: ["Participant Roster", "Add Participant", "Participant Detail", "Import / Export Roster"],
  schedule: ["Program Calendar", "Group Story Session", "Individual Interview", "Family Interview", "Songwriting Session", "Rehearsal / Listening", "Concert", "Keepsake Delivery"],
  stories: ["Story Capture Queue", "Interview Schedule", "Interview Notes", "Family Contributions", "Story Status"],
  songs: ["Individual Songs", "Group / Community Song", "Song Status", "Review Readiness"],
  families: ["Family Contacts", "Invitations", "Contributions", "Event Attendance"],
  events: ["Event Details", "Venue", "Run of Show", "Participant List", "Family Invitations", "Accessibility", "Photography / Media Permissions", "Event Completion"],
  keepsakes: ["Digital Deliveries", "Printed Song Cards", "Distribution Status"],
  funding: ["Funding Sources", "Sponsor Commitments", "Covered Activities", "Sponsor Recognition", "Restrictions"],
  outcomes: ["Participation", "Family Engagement", "Songs Completed", "Event Attendance", "Satisfaction", "Program Outcomes", "Export Report"]
};

const expectedParticipantGrandchildren = [
  "Contact / Representative",
  "Participation Status",
  "Accessibility Notes",
  "Consent",
  "Story Contributions",
  "Touchpoint Attendance",
  "Song Status",
  "Family Connections"
] as const;

describe("Facility / Project Ageless hierarchy", () => {
  it("keeps the existing eleven top-level Facility destinations in source order", () => {
    expect(workspaceNavigation.facility.map((item) => item.label)).toEqual(expectedParents);
    expect(workspaceNavigation.facility).toHaveLength(11);
  });

  it("registers every source-defined child without omissions", () => {
    for (const [parentId, labels] of Object.entries(expectedChildren) as [FacilityParentId, readonly string[]][]) {
      expect(facilityChildren[parentId].map((item) => item.label)).toEqual(labels);
      expect(new Set(facilityChildren[parentId].map((item) => item.slug)).size).toBe(labels.length);
      expect(facilityChildren[parentId].every((item) => item.description.length > 0 && item.boundaries.length > 0)).toBe(true);
    }

    expect(Object.values(facilityChildren).flat()).toHaveLength(60);
  });

  it("keeps all eight Participant Detail grandchildren in selected-participant context", () => {
    const participantDetail = getFacilityChild("participants", "participant-detail");
    expect(participantDetail?.grandchildren?.map((item) => item.label)).toEqual(expectedParticipantGrandchildren);
    expect(participantDetail?.grandchildren).toHaveLength(8);
  });

  it("round-trips ProgramRun, parent, child, participant, and grandchild deep-link context", () => {
    const href = buildFacilityHref({
      parentId: "participants",
      childId: "participant-detail",
      participantId: "participant-9",
      grandchildId: "participant-consent",
      programRunId: "run-123"
    });

    expect(href).toBe("/facility/run/run-123/participants/detail/participant-9/consent");

    const route = resolveFacilityRoute(href.split("/").filter(Boolean).slice(1));
    expect(route?.parent.id).toBe("participants");
    expect(route?.child?.id).toBe("participant-detail");
    expect(route?.grandchild?.id).toBe("participant-consent");
    expect(route?.participantId).toBe("participant-9");
    expect(route?.programRunId).toBe("run-123");
    expect(route?.contextual).toBe(true);
  });

  it("resolves nested Facility children and rejects invalid child/grandchild routes safely", () => {
    expect(resolveFacilityRoute(["run", "run-1", "events", "photography-media-permissions"])?.child?.id).toBe("event-media-permissions");
    expect(resolveFacilityRoute(["run", "run-1", "events", "not-a-workflow"])).toBeUndefined();
    expect(resolveFacilityRoute(["participants", "detail", "participant-1", "not-a-grandchild"])).toBeUndefined();
    expect(resolveFacilityRoute(["participants", "roster", "unexpected-extra-segment"])).toBeUndefined();
  });

  it("uses the same complete registry to generate preview/deep-link routes", () => {
    const slugs = getFacilityStaticRouteSlugs("run-reference", "participant-reference");
    const keys = new Set(slugs.map((segments) => segments.join("/")));

    expect(slugs).toHaveLength(160);
    expect(keys.has("run/run-reference/schedule/family-interview")).toBe(true);
    expect(keys.has("run/run-reference/funding/sponsor-recognition")).toBe(true);
    expect(keys.has("run/run-reference/participants/detail/participant-reference/touchpoint-attendance")).toBe(true);
    expect(keys.has("participants/detail/participant-reference/family-connections")).toBe(true);
  });

  it("keeps production actions fail-closed until shared services are connected", () => {
    expect(Object.values(facilityServiceConnections).every((connected) => connected === false)).toBe(true);

    const actions = Object.values(facilityChildren)
      .flatMap((children) => children.flatMap((child) => [child, ...(child.grandchildren ?? [])]))
      .filter((node) => node.action);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((node) => node.action && facilityServiceConnections[node.action.service] === false)).toBe(true);
  });

  it("keeps every top-level Facility destination backed by the shared child registry used by both responsive navigation modes", () => {
    const parentIds = workspaceNavigation.facility.map((item) => item.id as FacilityParentId);
    expect(parentIds.every((id) => facilityChildren[id] !== undefined)).toBe(true);
  });
});
