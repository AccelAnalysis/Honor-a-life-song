import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(resolve(process.cwd(), "components/secure-delivery.tsx"), "utf8");
const styleSource = readFileSync(resolve(process.cwd(), "components/secure-delivery.module.css"), "utf8");
const pageSource = readFileSync(resolve(process.cwd(), "app/(delivery)/song/[deliveryToken]/page.tsx"), "utf8");

describe("secure delivery accessibility contract", () => {
  it("announces protected delivery states without relying on color alone", () => {
    expect(componentSource).toContain('role="status"');
    expect(componentSource).toContain('aria-live="polite"');
    expect(componentSource).toContain('invalid: { title: "This link can’t be opened."');
    expect(componentSource).toContain('expired: { title: "This link has expired."');
    expect(componentSource).toContain('revoked: { title: "This link is no longer available."');
    expect(componentSource).toContain('consent_blocked: { title: "This keepsake is restricted."');
  });

  it("provides semantic section navigation and labelled delivery regions", () => {
    expect(componentSource).toContain('aria-label="Private song page sections"');
    expect(componentSource).toContain('aria-labelledby="listen-heading"');
    expect(componentSource).toContain('aria-labelledby="download-heading"');
    expect(componentSource).toContain('aria-labelledby="lyrics-heading"');
    expect(componentSource).toContain('aria-labelledby="story-heading"');
    expect(componentSource).toContain('aria-labelledby="share-heading"');
    expect(componentSource).toContain('aria-labelledby="confirmation-heading"');
  });

  it("keeps unavailable media controls understandable to assistive technology", () => {
    expect(componentSource).toContain('disabled aria-describedby="listen-service-note"');
    expect(componentSource).toContain('id="listen-service-note"');
    expect(componentSource).not.toContain("autoPlay");
    expect(componentSource).not.toContain("autoplay");
  });

  it("retains visible keyboard focus and mobile responsive behavior", () => {
    expect(styleSource).toContain(":focus-visible");
    expect(styleSource).toContain("outline:3px");
    expect(styleSource).toContain("min-height:44px");
    expect(styleSource).toContain("@media(max-width:720px)");
  });
});

describe("secure delivery presentation leakage controls", () => {
  it("does not render storage keys or raw route credentials", () => {
    expect(componentSource).not.toContain("storageKey");
    expect(componentSource).not.toContain("deliveryToken");
  });

  it("marks the delivery route as non-indexable and non-cacheable metadata", () => {
    expect(pageSource).toContain("index: false");
    expect(pageSource).toContain("follow: false");
    expect(pageSource).toContain("nocache: true");
  });
});
