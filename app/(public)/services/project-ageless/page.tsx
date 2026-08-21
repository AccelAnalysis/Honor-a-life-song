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
        <p className="eyebrow">Flagship facility program</p>
        <h1>Project Ageless</h1>
        <p className="lede">A short-form participatory residency where residents can join the combination of story sharing, interviews, family contributions, songwriting, listening, presentation and keepsake delivery that fits the program and the person.</p>

        <div className="callout"><strong>One platform:</strong> Project Ageless is a configurable program running on Honor a Life Song’s shared meaning-to-song engine—not a separate application or duplicate song workflow.</div>

        <section className="hierarchySection" aria-labelledby="project-ageless-explore">
          <div className="sectionHeading">
            <p className="eyebrow">Explore the program</p>
            <h2 id="project-ageless-explore">Project Ageless public workflow</h2>
          </div>
          <div className="cardGrid hierarchyCards">
            {projectAgelessSections.map((section) => (
              <article className="card" key={section.id}>
                <h3>{section.label}</h3>
                <p>{section.description}</p>
                <Link href={section.href}>Open {section.label.toLowerCase()} →</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="workflowDetailGrid programPrinciple" aria-labelledby="flexible-participation">
          <article className="wideCard">
            <p className="eyebrow">Core operating principle</p>
            <h2 id="flexible-participation">Flexible participation</h2>
            <p>Project Ageless does not require every participant to attend every activity. Participation is recorded at the touchpoint level so different residents can have different valid paths through the same program run.</p>
            <ul className="detailList">{flexibleTouchpoints.map((touchpoint) => <li key={touchpoint}>{touchpoint}</li>)}</ul>
          </article>
          <aside className="workflowContext">
            <p className="eyebrow">Typical engagement</p>
            <strong>Approximately two weeks to one month</strong>
            <p>Interviews and other activities can occur across several touches, and the same residents do not have to participate at every stage.</p>
          </aside>
        </section>
      </main>
    </PublicShell>
  );
}
