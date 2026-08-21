import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const loginSource = readFileSync(resolve(process.cwd(), "components/login-route.tsx"), "utf8");
const loginReferenceSource = readFileSync(resolve(process.cwd(), "components/login-reference.tsx"), "utf8");
const deliverySource = readFileSync(resolve(process.cwd(), "components/secure-delivery.tsx"), "utf8");
const signatureSource = readFileSync(resolve(process.cwd(), "components/brand/sonic-signature.tsx"), "utf8");

describe("consumer experience composition", () => {
  it("makes the public home visual and listening-led", () => {
    expect(homeSource).toContain("consumerHeroMedia");
    expect(homeSource).toContain("SonicSignature");
    expect(homeSource).toContain("songGallery");
    expect(homeSource).toContain("studioImage");
    expect(homeSource).toContain("Reference image:");
  });

  it("keeps architecture vocabulary out of the customer login", () => {
    expect(loginSource).not.toContain("Chassis active");
    expect(loginSource).not.toContain("Service boundary");
    expect(loginSource).not.toContain("Membership(s)");
    expect(loginSource).not.toContain("Identity / Access");
    expect(loginSource).toContain("Welcome back to your song");
    expect(loginSource).toContain("/reference/identity/login");
  });

  it("preserves the identity architecture in a separate reference route", () => {
    expect(loginReferenceSource).toContain("Identity / Login workflow authority");
    expect(loginReferenceSource).toContain("Memberships");
    expect(loginReferenceSource).toContain("Permitted workspaces");
  });

  it("presents secure delivery as a private musical keepsake", () => {
    expect(deliverySource).toContain("Private keepsake");
    expect(deliverySource).toContain("albumArtwork");
    expect(deliverySource).toContain("playerWave");
    expect(deliverySource).toContain("Received with care");
  });
});

describe("consumer audio safety", () => {
  it("requires a user gesture and never autoplays the sonic signature", () => {
    expect(signatureSource).toContain("onClick={playSignature}");
    expect(signatureSource).not.toContain("autoPlay");
    expect(signatureSource).not.toContain("autoplay");
  });
});
