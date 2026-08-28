import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { projectAgelessSections } from "@/lib/public-navigation";

const flexibleTouchpoints = [
  "Group story-sharing",
  "One-on-one interviews",
  "Family-contributed memories",
  "Lyric or theme review",
  "Group songwriting",
  "Rehearsal or listening",
  "Concert or presentation",
  "Keepsake delivery and feedback"
] as const;

export default function ProjectAgelessPage() {
  return (
    <PublicShell>
      <main className="contentPage">
        <p className="eyebrow">The complete $2,500 experience</p>
        <h1>Honor a Life Song Experience</h1>
        <p className="lede">A short-form participatory residency where people can share stories, connect with family, help shape songs, listen together, and return for a follow-up concert.</p>

        <div className="callout"><strong>Built around the person:</strong> Participants can join the parts of the experience that feel comfortable and meaningful to them. There is no requirement that everyone take part in every activity.</div>

        <section className="hierarchySection" aria-labelledby="project-ageless-explore">
          <div className="sectionHeading">
            <p className="eyebrow">Explore the full experience</p>
            <h2 id="project-ageless-explore">See what the experience can include</h2>
          </div>
          <div className="cardGrid hierarchyCards">
            {projectAgelessSections.map((section) => (
              <article className="card" key={section.id}>
                <h3>{section.label}</h3>
                <p>{section.description}</p>
                <Link href={section.href}>Explore {section.label.toLowerCase()} →</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="workflowDetailGrid programPrinciple" aria-labelledby="flexible-participation">
          <article className="wideCard">
            <p className="eyebrow">Flexible participation</p>
            <h2 id="flexible-participation">Every participant can have a different path.</h2>
            <p>Some residents may love group storytelling. Others may prefer a one-on-one conversation, a family contribution, a listening session, or simply being part of the final celebration.</p>
            <ul className="detailList">{flexibleTouchpoints.map((touchpoint) => <li key={touchpoint}>{touchpoint}</li>)}</ul>
          </article>
          <aside className="workflowContext">
            <p className="eyebrow">Typical engagement</p>
            <strong>Approximately two weeks to one month</strong>
            <p>Activities can happen across several visits, and participation can adapt to the needs, interests, and availability of each person.</p>
          </aside>
        </section>
      </main>
    </PublicShell>
  );
}
