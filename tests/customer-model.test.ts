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
const lifecycleDomain = readFileSync(resolve(process.cwd(), "domain/customer-lifecycle.ts"), "utf8");
const organizationRepository = readFileSync(resolve(process.cwd(), "lib/firebase/organization-account.ts"), "utf8");
const lifecycleRepository = readFileSync(resolve(process.cwd(), "lib/firebase/customer-lifecycle.ts"), "utf8");
const invitationRepository = readFileSync(resolve(process.cwd(), "lib/firebase/organization-invitations.ts"), "utf8");
const firestoreRules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
const storageRules = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");
const publicHome = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const memoriesHub = readFileSync(resolve(process.cwd(), "components/memories-hub.tsx"), "utf8");
const accountCreation = readFileSync(resolve(process.cwd(), "components/create-account-route.tsx"), "utf8");

describe("governing customer model", () => {
  it("defines exactly three organization-owned experience templates", () => {
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
      }),
      expect.objectContaining({
        id: "songkeep-legacy-album",
        priceCents: 600_000,
        buyer: "organization",
        templateKind: "legacy_album",
        participantMode: "album_subject"
      })
    ]);
  });

  it("maps legacy offering identifiers without preserving an old direct-consumer purchase model", () => {
    expect(normalizeExperienceOfferingId("individual-legacy-song")).toBe("single-song-group-event");
    expect(normalizeExperienceOfferingId("complete-honor-a-life-song-experience")).toBe("honor-a-life-song-experience");
    expect(normalizeExperienceOfferingId("legacy-album")).toBe("songkeep-legacy-album");
    expect(getExperienceOffering("individual-legacy-song")?.buyer).toBe("organization");
    expect(getExperienceOffering("unknown")).toBeUndefined();
  });

  it("keeps organizations, contacts, experiences, participants, permissions, and commerce distinct", () => {
    expect(lifecycleDomain).toContain("OrganizationRelationshipProfile");
    expect(lifecycleDomain).toContain("OrganizationExperienceRequest");
    expect(lifecycleDomain).toContain("ParticipantPermissionInvitation");
    expect(lifecycleDomain).toContain("IndividualPurchaseRequest");
    expect(accountCreation).toContain("The person and the organization remain separate");
    expect(organizationDomain).toContain("experienceId: EntityId");
  });

  it("requires active consent before existing delivery entitlements are created", () => {
    expect(organizationRepository).toContain('record.state === "active"');
    expect(organizationRepository).toContain("requiredScopes.every");
    expect(organizationRepository).toContain("authorizedRecipientEmails.includes(recipientEmail)");
    expect(organizationRepository).toContain("Every material permission revision invalidates earlier releases");
  });

  it("requires verified invited email for organization, experience, and permission claims", () => {
    expect(invitationRepository.match(/if \(!input\.emailVerified\)/g)).toHaveLength(2);
    expect(firestoreRules).toContain("request.auth.token.email_verified == true");
    expect(firestoreRules).toContain("matchesVerifiedSignedInEmail(resource.data.recipientEmail)");
    expect(firestoreRules).toContain("validPermissionResponse");
  });

  it("separates organization files from participant files", () => {
    expect(storageRules).toContain("/organizations/{orgId}/organization/{allPaths=**}");
    expect(storageRules).toContain("/organizations/{orgId}/participants/{participantId}/{allPaths=**}");
    expect(storageRules).toContain("allow read, write: if platformAdmin()");
    expect(firestoreRules).toContain("resource.data.organizationVisible == true");
  });

  it("keeps public acquisition organization-facing across all three offers", () => {
    expect(publicHome).toContain("SongKeep creates meaningful music experiences for the people your organization serves.");
    expect(publicHome).toContain("Three ways to begin");
    expect(publicHome).toContain("$200");
    expect(publicHome).toContain("$2,500");
    expect(publicHome).toContain("$6,000");
    expect(publicHome).not.toContain("Purchase an individual song");
  });

  it("turns accepted participant/family access into source-attributed individual commerce", () => {
    expect(memoriesHub).toContain("createIndividualPurchaseRequest");
    expect(memoriesHub).toContain("Every purchase stays connected to the organization event");
    expect(lifecycleRepository).toContain("accessId: input.accessId");
    expect(firestoreRules).toContain("validPurchaseRequestCreate");
    expect(memoriesHub).not.toContain("Payments & Orders");
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
