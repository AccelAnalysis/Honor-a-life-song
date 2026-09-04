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
const organizationOnboarding = readFileSync(resolve(process.cwd(), "lib/firebase/organization-onboarding.ts"), "utf8");
const organizationRepository = readFileSync(resolve(process.cwd(), "lib/firebase/organization-account.ts"), "utf8");
const invitationRepository = readFileSync(resolve(process.cwd(), "lib/firebase/organization-invitations.ts"), "utf8");
const postExperienceRepository = readFileSync(resolve(process.cwd(), "lib/firebase/post-experience.ts"), "utf8");
const firestoreRules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
const storageRules = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");
const publicHome = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const memoriesHub = readFileSync(resolve(process.cwd(), "components/memories-hub.tsx"), "utf8");
const storefront = readFileSync(resolve(process.cwd(), "components/post-experience-storefront.tsx"), "utf8");

describe("governing customer model", () => {
  it("defines three organization-owned experience templates", () => {
    expect(experienceOfferings).toEqual([
      expect.objectContaining({
        id: "single-song-group-event",
        priceCents: 20_000,
        buyer: "organization",
        templateKind: "group_event",
        participantMode: "group",
        creativeOutput: "One original shared song",
        presentation: "Event presentation"
      }),
      expect.objectContaining({
        id: "honor-a-life-song-experience",
        priceCents: 250_000,
        buyer: "organization",
        templateKind: "full_program",
        participantMode: "named_roster",
        creativeOutput: "Multiple original participant songs",
        presentation: "Follow-up concert"
      }),
      expect.objectContaining({
        id: "songkeep-legacy-album",
        priceCents: 600_000,
        buyer: "organization",
        templateKind: "legacy_album",
        participantMode: "named_roster",
        requiresConsultation: true
      })
    ]);
  });

  it("maps legacy offering identifiers without preserving the old purchase model", () => {
    expect(normalizeExperienceOfferingId("individual-legacy-song")).toBe("single-song-group-event");
    expect(normalizeExperienceOfferingId("complete-honor-a-life-song-experience")).toBe("honor-a-life-song-experience");
    expect(normalizeExperienceOfferingId("legacy-album")).toBe("songkeep-legacy-album");
    expect(getExperienceOffering("individual-legacy-song")?.buyer).toBe("organization");
    expect(getExperienceOffering("unknown")).toBeUndefined();
  });

  it("keeps the organization and its primary contact separate", () => {
    expect(organizationDomain).toContain("primaryContactUserId?: EntityId");
    expect(organizationDomain).toContain("title?: string");
    expect(organizationDomain).toContain("directPhone?: string");
    expect(organizationDomain).toContain("preferredContactMethod?: PreferredContactMethod");
    expect(organizationDomain).toContain("isPrimaryContact?: boolean");
    expect(organizationOnboarding).toContain("The organization is the durable commercial customer");
    expect(organizationOnboarding).toContain('role: "organization_admin"');
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

  it("keeps the public acquisition path organization-facing across all three offers", () => {
    expect(publicHome).toContain("SongKeep creates meaningful music experiences for the people your organization serves.");
    expect(publicHome).toContain("Choose an experience");
    expect(publicHome).toContain("$200 Group Event");
    expect(publicHome).toContain("$2,500 Honor a Life Song");
    expect(publicHome).toContain("$6,000 Legacy Album");
    expect(publicHome).not.toContain("Purchase an individual song");
  });

  it("converts claimed experience access into source-attributed individual commerce", () => {
    expect(memoriesHub).toContain("Products from this experience");
    expect(storefront).toContain("Take the experience with you.");
    expect(storefront).toContain("createPostExperiencePurchaseIntent");
    expect(postExperienceRepository).toContain("organizationId: input.access.organizationId");
    expect(postExperienceRepository).toContain("experienceId: input.access.experienceId");
    expect(postExperienceRepository).toContain("participantId: input.access.participantId");
    expect(firestoreRules).toContain("validPostExperiencePurchaseIntentCreate");
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
