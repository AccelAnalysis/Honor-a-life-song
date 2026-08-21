import { WorkspaceRoute } from "@/components/workspace-route";
import {
  referenceAdminRecordIds,
  referenceCreatorContext,
  referenceCustomerContext,
  referenceFacilityContext
} from "@/fixtures/reference-data";
import { getAdminStaticRouteSlugs } from "@/lib/admin-navigation";
import { getCreatorStaticRouteSlugs } from "@/lib/creator-navigation";
import { getCustomerStaticRouteSlugs } from "@/lib/customer-navigation";
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

  params.push(...getCreatorStaticRouteSlugs(referenceCreatorContext.creativeWorkId).map((slug) => ({
    workspace: "creator" as const,
    slug
  })));

  params.push(...getCustomerStaticRouteSlugs(referenceCustomerContext.orderId).map((slug) => ({
    workspace: "customer" as const,
    slug
  })));

  params.push(...getAdminStaticRouteSlugs(referenceAdminRecordIds).map((slug) => ({
    workspace: "admin" as const,
    slug
  })));

  const seen = new Set<string>();
  return params.filter((entry) => {
    const key = `${entry.workspace}/${entry.slug.join("/")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function WorkspacePage() {
  return <WorkspaceRoute />;
}
