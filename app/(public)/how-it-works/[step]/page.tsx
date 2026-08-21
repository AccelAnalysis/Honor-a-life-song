import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { PublicWorkflowDetail } from "@/components/public-workflow-detail";
import { getHowItWorksStep, howItWorksSteps } from "@/lib/public-navigation";

export function generateStaticParams() {
  return howItWorksSteps.map((step) => ({ step: step.slug }));
}

export default function HowItWorksStepPage({ params }: { params: { step: string } }) {
  const item = getHowItWorksStep(params.step);
  if (!item) notFound();

  return (
    <PublicShell>
      <PublicWorkflowDetail
        eyebrow="How It Works"
        parentLabel="How It Works"
        parentHref="/how-it-works"
        item={item}
        siblings={howItWorksSteps}
      />
    </PublicShell>
  );
}
