import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const publicNavigationSource = readFileSync(resolve(process.cwd(), "lib/public-navigation.ts"), "utf8");
const loginSource = readFileSync(resolve(process.cwd(), "components/login-route.tsx"), "utf8");
const loginReferenceSource = readFileSync(resolve(process.cwd(), "components/login-reference.tsx"), "utf8");
const deliverySource = readFileSync(resolve(process.cwd(), "components/secure-delivery.tsx"), "utf8");
const signatureSource = readFileSync(resolve(process.cwd(), "components/brand/sonic-signature.tsx"), "utf8");

describe("consumer experience composition", () => {
  it("makes the public home visual and listening-led without build notes", () => {
    expect(homeSource).toContain("consumerHeroMedia");
    expect(homeSource).toContain("SonicSignature");
    expect(homeSource).toContain("songGallery");
    expect(homeSource).toContain("studioImage");
    expect(homeSource).toContain("Photo:");
    expect(homeSource).toContain("SongKeep");
    expect(homeSource).not.toContain("Reference boundary:");
    expect(homeSource).not.toContain("referenceNotice consumerBoundary");
  });

  it("uses customer-facing labels in public navigation", () => {
    expect(publicNavigationSource).toContain("Every Life Has a Song");
    expect(publicNavigationSource).toContain("Plan an Experience");
    expect(publicNavigationSource).not.toContain("Hero / Value Proposition");
    expect(publicNavigationSource).not.toContain("Request a Song CTA");
    expect(publicNavigationSource).not.toContain("canonical Program Lead");
  });

  it("keeps architecture vocabulary out of the customer login", () => {
    expect(loginSource).not.toContain("Chassis active");
    expect(loginSource).not.toContain("Service boundary");
    expect(loginSource).not.toContain("Membership(s)");
    expect(loginSource).not.toContain("Identity / Access");
    expect(loginSource).not.toContain("reference environment");
    expect(loginSource).not.toContain("simulated");
    expect(loginSource).not.toContain("/reference/identity/login");
    expect(loginSource).toContain("SongKeep");
    expect(loginSource).toContain("Sign in to continue.");
  });

  it("preserves the identity architecture in a separate internal reference route", () => {
    expect(loginReferenceSource).toContain("Identity / Login workflow authority");
    expect(loginReferenceSource).toContain("Memberships");
    expect(loginReferenceSource).toContain("Permitted workspaces");
  });

  it("presents secure delivery as a private musical keepsake without build notes", () => {
    expect(deliverySource).toContain("Private keepsake");
    expect(deliverySource).toContain("albumArtwork");
    expect(deliverySource).toContain("playerWave");
    expect(deliverySource).toContain("Received with care");
    expect(deliverySource).not.toContain("reference environment");
    expect(deliverySource).not.toContain("About this reference delivery");
    expect(deliverySource).not.toContain("fail-closed");
  });
});

describe("consumer audio safety", () => {
  it("requires a user gesture and never autoplays the sonic signature", () => {
    expect(signatureSource).toContain("onClick={playSignature}");
    expect(signatureSource).not.toContain("autoPlay");
    expect(signatureSource).not.toContain("autoplay");
  });
});
