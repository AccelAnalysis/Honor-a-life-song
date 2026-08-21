import { describe, expect, it } from "vitest";
import { homeSections, howItWorksSteps, projectAgelessSections, publicNavigation } from "../lib/public-navigation";

const expectedHome = [
  "Hero / Value Proposition",
  "How It Works",
  "Featured Stories / Songs",
  "Program Highlights",
  "Testimonials",
  "Request a Song CTA"
];

const expectedHowItWorks = [
  "Share Your Story",
  "Interview / Story Capture",
  "Songwriting Process",
  "Review & Revisions",
  "Production",
  "Delivery / Keepsakes"
];

const expectedProjectAgeless = [
  "Program Overview",
  "Facility Benefits",
  "Participant Experience",
  "Family Experience",
  "Concert / Presentation",
  "Sponsorship",
  "Request a Facility Program"
];

describe("public source hierarchy", () => {
  it("preserves the exact Home children from the platform shell", () => {
    expect(homeSections.map((item) => item.label)).toEqual(expectedHome);
    expect(new Set(homeSections.map((item) => item.href)).size).toBe(homeSections.length);
  });

  it("preserves the six route-backed How It Works children", () => {
    expect(howItWorksSteps.map((item) => item.label)).toEqual(expectedHowItWorks);
    expect(new Set(howItWorksSteps.map((item) => item.slug)).size).toBe(howItWorksSteps.length);
    expect(howItWorksSteps.every((item) => item.href.startsWith("/how-it-works/"))).toBe(true);
  });

  it("preserves the seven Project Ageless grandchildren under Services", () => {
    expect(projectAgelessSections.map((item) => item.label)).toEqual(expectedProjectAgeless);
    expect(new Set(projectAgelessSections.map((item) => item.slug)).size).toBe(projectAgelessSections.length);
    expect(projectAgelessSections.every((item) => item.href.startsWith("/services/project-ageless/"))).toBe(true);

    const services = publicNavigation.find((item) => item.id === "services");
    const projectAgeless = services?.children?.find((item) => item.id === "project-ageless");
    expect(projectAgeless?.children?.map((item) => item.label)).toEqual(expectedProjectAgeless);
  });

  it("keeps the facility request at the canonical Program Lead integration boundary", () => {
    const request = projectAgelessSections.find((item) => item.slug === "request-facility-program");
    expect(request?.integrationNote).toContain("Program Lead / Inquiry");
    expect(request?.integrationNote).toContain("does not fabricate a separate form backend");
  });
});
