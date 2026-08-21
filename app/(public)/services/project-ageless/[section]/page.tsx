import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { PublicWorkflowDetail } from "@/components/public-workflow-detail";
import { getProjectAgelessSection, projectAgelessSections } from "@/lib/public-navigation";

export function generateStaticParams() {
  return projectAgelessSections.map((section) => ({ section: section.slug }));
}

export default function ProjectAgelessSectionPage({ params }: { params: { section: string } }) {
  const item = getProjectAgelessSection(params.section);
  if (!item) notFound();

  return (
    <PublicShell>
      <PublicWorkflowDetail
        eyebrow="Project Ageless"
        parentLabel="Project Ageless"
        parentHref="/services/project-ageless"
        item={item}
        siblings={projectAgelessSections}
      />
    </PublicShell>
  );
}
