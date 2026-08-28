import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { projectAgelessSections } from "@/lib/public-navigation";

const flexibleTouchpoints = [
  "Group story-sharing",
  "One-on-one interviews",
  "Family memories",
  "Song review",
  "Group songwriting",
  "Listening",
  "Concert",
  "Keepsakes"
] as const;

export default function ProjectAgelessPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">$2,500 full experience</p>
        <h1>Honor a Life Song Experience</h1>
        <p className="lede">Resident stories become original songs, then return to the community in a follow-up concert.</p>
        <div className="callout"><strong>Flexible by design.</strong> Each person joins in the way that feels right.</div>

        <section className="hierarchySection" aria-labelledby="project-ageless-explore">
          <div className="sectionHeading"><h2 id="project-ageless-explore">Explore</h2></div>
          <div className="cardGrid hierarchyCards">
            {projectAgelessSections.map((section) => (
              <article className="card" key={section.id}>
                <h3>{section.label}</h3>
                <Link href={section.href}>Open →</Link>
              </article>
            ))}
          </div>
        </section>

        <details className="wideCard">
          <summary>Ways to participate</summary>
          <ul className="detailList">{flexibleTouchpoints.map((touchpoint) => <li key={touchpoint}>{touchpoint}</li>)}</ul>
        </details>
      </main>
    </PublicShell>
  );
}
