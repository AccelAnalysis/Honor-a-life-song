import { describe, expect, it } from "vitest";
import { homeSections, howItWorksSteps, projectAgelessSections, publicNavigation } from "../lib/public-navigation";

const expectedHome = [
  "Every Life Has a Song",
  "How It Works",
  "Songs & Stories",
  "Programs",
  "What People Share",
  "Begin a Song"
];

const expectedHowItWorks = [
  "Share Your Story",
  "Interview & Story Capture",
  "Songwriting",
  "Review & Revisions",
  "Production",
  "Delivery & Keepsakes"
];

const expectedProjectAgeless = [
  "Program Overview",
  "Facility Benefits",
  "Participant Experience",
  "Family Experience",
  "Concert & Presentation",
  "Sponsorship",
  "Request a Facility Program"
];

describe("public navigation", () => {
  it("uses customer-facing Home labels without changing the section count", () => {
    expect(homeSections.map((item) => item.label)).toEqual(expectedHome);
    expect(new Set(homeSections.map((item) => item.href)).size).toBe(homeSections.length);
    expect(homeSections).toHaveLength(6);
  });

  it("keeps the six route-backed How It Works steps", () => {
    expect(howItWorksSteps.map((item) => item.label)).toEqual(expectedHowItWorks);
    expect(new Set(howItWorksSteps.map((item) => item.slug)).size).toBe(howItWorksSteps.length);
    expect(howItWorksSteps.every((item) => item.href.startsWith("/how-it-works/"))).toBe(true);
  });

  it("keeps the seven Project Ageless pages under Services", () => {
    expect(projectAgelessSections.map((item) => item.label)).toEqual(expectedProjectAgeless);
    expect(new Set(projectAgelessSections.map((item) => item.slug)).size).toBe(projectAgelessSections.length);
    expect(projectAgelessSections.every((item) => item.href.startsWith("/services/project-ageless/"))).toBe(true);

    const services = publicNavigation.find((item) => item.id === "services");
    const projectAgeless = services?.children?.find((item) => item.id === "project-ageless");
    expect(projectAgeless?.children?.map((item) => item.label)).toEqual(expectedProjectAgeless);
  });

  it("describes facility requests in customer language", () => {
    const request = projectAgelessSections.find((item) => item.slug === "request-facility-program");
    expect(request?.summary).toContain("Tell us about your facility");
    expect(request?.description).not.toContain("canonical");
    expect(request?.description).not.toContain("integration");
  });
});
