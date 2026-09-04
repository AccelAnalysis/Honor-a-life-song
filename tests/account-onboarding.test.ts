import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { bookingReturnPath, contactName, canPlanExperience } from "../domain/account-onboarding";
import { experienceOfferings } from "../domain/experience";
import { customerMessage } from "../lib/customer-messages";
const read = (name: string) => readFileSync(name, "utf8");
describe("account-first booking", () => {
  it("preserves chosen offer and explicit organization without putting personal information in URLs", () => {
    const url = bookingReturnPath({ offeringId:"songkeep-legacy-album",organizationId:"org-1",sourceExperienceId:"past-1",query:new URLSearchParams("email=private@example.com&password=secret&firstName=Lee&utm_source=partner") });
    expect(url).toContain("offering=songkeep-legacy-album"); expect(url).toContain("organizationId=org-1"); expect(url).toContain("sourceExperience=past-1"); expect(url).toContain("utm_source=partner");
    expect(url).not.toMatch(/email|password|firstName|secret|private/);
  });
  it("collects first and last names separately", () => {
    expect(contactName("  Lee ", " Chan ")).toBe("Lee Chan"); expect(() => contactName("Lee", " ")).toThrow();
    const source = read("components/account-registration-form.tsx"); expect(source).toContain('name="firstName"'); expect(source).toContain('name="lastName"');
  });
  it("shares registration across standalone and embedded booking, and gates event details", () => {
    expect(read("components/create-account-route.tsx")).toContain("AccountRegistrationForm");
    const source = read("components/booking-route.tsx"); expect(source).toContain("AccountRegistrationForm"); expect(source).toContain("!accountReady");
    expect(source).not.toMatch(/preview-only|staticPreview|Preview Complete|Saved to your relationship/);
    expect(read("lib/firebase/customer-lifecycle.ts")).toContain("runTransaction");
  });
  it("does not let a viewer or coordinator become an organization buyer", () => {
    expect(canPlanExperience("organization_admin")).toBe(true); expect(canPlanExperience("viewer")).toBe(false); expect(canPlanExperience("coordinator")).toBe(false);
  });
  it("keeps package song limits and invoice scope synchronized", () => {
    const catalog = JSON.parse(read("functions/catalog.json"));
    for (const offer of experienceOfferings) { expect(offer.maxSongs).toBe(catalog[offer.id].maxSongs); expect(offer.priceCents).toBe(catalog[offer.id].priceCents ?? catalog[offer.id].amountCents); }
    expect(experienceOfferings[1].creativeOutput).toBe("Up to 6 songs"); expect(experienceOfferings[2].creativeOutput).toBe("Up to 10 songs");
    expect(catalog[experienceOfferings[1].id].scope).toContain("up to 6"); expect(catalog[experienceOfferings[2].id].scope.toLowerCase()).toContain("up to 10");
  });
  it("removes the distracting internal relationship section from package selection", () => {
    expect(read("app/(public)/services/page.tsx")).not.toMatch(/One continuous relationship|The experience does not end|Loyalty &amp; advocacy/);
  });
  it("does not expose technical failures to customers", () => {
    expect(customerMessage({ code:"auth/email-already-in-use" })).toContain("Sign in");
    expect(customerMessage(new Error("FirebaseError: Missing index and SDK configuration"))).not.toMatch(/Firebase|index|SDK/);
    expect(customerMessage(new Error("The passwords do not match."))).toBe("The passwords do not match.");
  });
  it("keeps photo motion optional and never adds automatic audio", () => {
    const motion = read("components/marketing-image-sequence.tsx");
    expect(motion).toContain("prefers-reduced-motion"); expect(motion).toContain("Pause photos"); expect(motion).toContain("document.hidden"); expect(motion).toContain("9479826"); expect(motion).not.toContain("autoPlay");
  });
});
