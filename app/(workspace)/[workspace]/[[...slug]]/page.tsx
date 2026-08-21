import { WorkspaceRoute } from "@/components/workspace-route";
import { referenceFacilityContext } from "@/fixtures/reference-data";
import { getFacilityStaticRouteSlugs } from "@/lib/facility-navigation";
import { workspaceIds, workspaceNavigation, type WorkspaceId } from "@/lib/navigation";

type WorkspaceStaticParam = {
  workspace: WorkspaceId;
  slug: string[];
};

export function generateStaticParams() {
  const params: WorkspaceStaticParam[] = [];

  for (const workspace of workspaceIds) {
    if (workspace === "facility") {
      params.push(
        ...getFacilityStaticRouteSlugs(
          referenceFacilityContext.programRunId,
          referenceFacilityContext.participantId
        ).map((slug) => ({ workspace, slug }))
      );
      continue;
    }

    params.push(
      ...workspaceNavigation[workspace].map((item) => ({
        workspace,
        slug: item.slug ? item.slug.split("/") : []
      }))
    );
  }

  return params;
}

export default function WorkspacePage() {
  return <WorkspaceRoute />;
}
