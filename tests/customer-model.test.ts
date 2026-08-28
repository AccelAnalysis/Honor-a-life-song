import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  experienceOfferings,
  getExperienceOffering,
  normalizeExperienceOfferingId
} from "../domain/experience";
import { safeReturnPath } from "../lib/safe-return-path";

const organizationDomain = readFileSync(resolve(process.cwd(), "domain/organization-account.ts"), "utf8");
const organizationRepository = readFileSync(resolve(process.cwd(), "lib/firebase/organization-account.ts"), "utf8");
const invitationRepository = readFileSync(resolve(process.cwd(), "lib/firebase/organization-invitations.ts"), "utf8");
const firestoreRules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
const storageRules = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");
const publicHome = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const memoriesHub = readFileSync(resolve(process.cwd(), "components/memories-hub.tsx"), "utf8");

describe("governing customer model", () => {
  it("defines exactly two organization-owned experience templates", () => {
    expect(experienceOfferings).toEqual([
      expect.objectContaining({
        id: "single-song-group-event",
        priceCents: 20_000,
        buyer: "organization",
        templateKind: "group_event",
        participantMode: "group",
        creativeOutput: "One shared song",
        presentation: "Event presentation"
      }),
      expect.objectContaining({
        id: "honor-a-life-song-experience",
        priceCents: 250_000,
        buyer: "organization",
        templateKind: "full_program",
        participantMode: "named_roster",
        creativeOutput: "Multiple participant songs",
        presentation: "Follow-up concert"
      })
    ]);
  });

  it("maps legacy offering identifiers without preserving the old purchase model", () => {
    expect(normalizeExperienceOfferingId("individual-legacy-song")).toBe("single-song-group-event");
    expect(normalizeExperienceOfferingId("complete-honor-a-life-song-experience")).toBe("honor-a-life-song-experience");
    expect(getExperienceOffering("individual-legacy-song")?.buyer).toBe("organization");
    expect(getExperienceOffering("unknown")).toBeUndefined();
  });

  it("places participants, consent, assets, and access under an organization experience", () => {
    expect(organizationDomain).toContain("experienceId: EntityId");
    expect(organizationDomain).toContain("permissionReadiness: ExperiencePermissionReadiness");
    expect(organizationDomain).toContain("consentRecordId: EntityId");
    expect(organizationDomain).toContain('ExperienceAssetAudience = "organization" | "participant" | "designated_family"');
    expect(organizationDomain).toContain("export interface UserExperienceAccess");
  });

  it("requires active consent before creating participant or family entitlements", () => {
    expect(organizationRepository).toContain('record.state === "active"');
    expect(organizationRepository).toContain("requiredScopes.every");
    expect(organizationRepository).toContain("authorizedRecipientEmails.includes(recipientEmail)");
    expect(organizationRepository).toContain("designatedFamilyEmails");
    expect(organizationRepository).toContain("Every material permission revision invalidates earlier releases");
    expect(organizationRepository).toContain('status: readyForDelivery ? "active" : "pending"');
    expect(organizationRepository).toContain('status: readyForDelivery ? "ready" : "processing"');
  });

  it("requires a verified invited email for organization and experience claims", () => {
    expect(invitationRepository.match(/if \(!input\.emailVerified\)/g)).toHaveLength(2);
    expect(firestoreRules).toContain("request.auth.token.email_verified == true");
    expect(firestoreRules).toContain("matchesVerifiedSignedInEmail(invitation.data.recipientEmail)");
    expect(firestoreRules).toContain("acceptedInvitation.data.status == 'accepted'");
  });

  it("separates organization files from participant files", () => {
    expect(storageRules).toContain("/organizations/{orgId}/organization/{allPaths=**}");
    expect(storageRules).toContain("/organizations/{orgId}/participants/{participantId}/{allPaths=**}");
    expect(storageRules).toContain("allow read, write: if platformAdmin()");
    expect(firestoreRules).toContain("resource.data.organizationVisible == true");
  });

  it("keeps the primary public acquisition path organization-facing", () => {
    expect(publicHome).toContain("Bring an unforgettable story-to-song experience to the people you serve");
    expect(publicHome).toContain("Choose an experience");
    expect(publicHome).not.toContain("Purchase an individual song");
  });

  it("gives participants and families a lightweight private memories path", () => {
    expect(memoriesHub).toContain("simple, private home");
    expect(memoriesHub).toContain("permissioned");
    expect(memoriesHub).not.toContain("Payments & Orders");
    expect(memoriesHub).not.toContain("Customer workspace");
  });
});

describe("safe return routing", () => {
  it("allows internal routes and preserves their query and fragment", () => {
    expect(safeReturnPath("/claim?org=one#access")).toBe("/claim?org=one#access");
  });

  it.each([
    "https://attacker.example/claim",
    "//attacker.example/claim",
    "/\\attacker.example/claim",
    "\\\\attacker.example\\claim",
    "claim"
  ])("rejects unsafe return target %s", (value) => {
    expect(safeReturnPath(value)).toBeNull();
  });
});
