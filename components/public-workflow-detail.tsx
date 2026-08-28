import Link from "next/link";
import type { PublicWorkflowItem } from "@/lib/public-navigation";

export function PublicWorkflowDetail({
  eyebrow,
  parentLabel,
  parentHref,
  item,
  siblings
}: {
  eyebrow: string;
  parentLabel: string;
  parentHref: string;
  item: PublicWorkflowItem;
  siblings: readonly PublicWorkflowItem[];
}) {
  const index = siblings.findIndex((candidate) => candidate.slug === item.slug);
  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  return (
    <main className="contentPage workflowDetail">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href={parentHref}>{parentLabel}</Link><span aria-hidden="true">/</span><span aria-current="page">{item.label}</span>
      </nav>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{item.label}</h1>
      <p className="lede">{item.summary}</p>

      <section className="workflowDetailGrid" aria-labelledby="included-heading">
        <article className="wideCard">
          <h2 id="included-heading">What to expect</h2>
          <ul className="detailList">
            {item.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        </article>
        <aside className="workflowContext">
          <p className="eyebrow">At a glance</p>
          <strong>{parentLabel}</strong>
          <p>{item.description}</p>
          <Link href={parentHref}>Explore {parentLabel.toLowerCase()} →</Link>
        </aside>
      </section>

      <nav className="workflowPager" aria-label={`${parentLabel} sequence`}>
        {previous ? <Link href={previous.href}><small>Previous</small><strong>← {previous.label}</strong></Link> : <span />}
        {next ? <Link href={next.href}><small>Next</small><strong>{next.label} →</strong></Link> : <span />}
      </nav>
    </main>
  );
}
