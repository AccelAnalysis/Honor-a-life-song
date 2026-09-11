import {
  referenceAdminRecordIds,
  referenceCreatorContext,
  referenceCustomerContext,
  referenceFacilityContext
} from "../fixtures/reference-data";
import { getAdminStaticRouteSlugs } from "./admin-navigation";
import { getCreatorStaticRouteSlugs } from "./creator-navigation";
import { getCustomerStaticRouteSlugs } from "./customer-navigation";
import { getFacilityStaticRouteSlugs } from "./facility-navigation";
import { workspaceIds, workspaceNavigation, type WorkspaceId } from "./navigation";

type WorkspaceStaticParam = {
  workspace: WorkspaceId;
  slug: string[];
};

export function getWorkspaceStaticParams() {
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

  // Explicit pages own these URLs. Generating them here overwrites their prerendered output.
  const explicitRoutes = new Set([
    "organization", "organization/account", "organization/experiences", "organization/growth",
    "organization/invoices", "organization/relationship", "admin/catalog", "admin/communications",
    "admin/consent", "admin/deliverables", "admin/invoices", "admin/reports", "admin/requests",
    "creator/deliverables", "memories/store", "participate"
  ]);
  const seen = new Set<string>();
  return params.filter((entry) => {
    const key = `${entry.workspace}/${entry.slug.join("/")}`;
    if (explicitRoutes.has(key.replace(/\/$/, "")) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
