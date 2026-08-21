import { WorkspaceRoute } from "@/components/workspace-route";
import { referenceFacilityContext } from "@/fixtures/reference-data";
import { getFacilityStaticRouteSlugs } from "@/lib/facility-navigation";
import { workspaceIds, workspaceNavigation } from "@/lib/navigation";

export function generateStaticParams() {
  return workspaceIds.flatMap((workspace) => {
    if (workspace === "facility") {
      return getFacilityStaticRouteSlugs(
        referenceFacilityContext.programRunId,
        referenceFacilityContext.participantId
      ).map((slug) => ({ workspace, slug }));
    }

    return workspaceNavigation[workspace].map((item) => ({
      workspace,
      slug: item.slug ? item.slug.split("/") : []
    }));
  });
}

export default function WorkspacePage() {
  return <WorkspaceRoute />;
}
