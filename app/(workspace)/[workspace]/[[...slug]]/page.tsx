import { WorkspaceRoute } from "@/components/workspace-route";
import { referenceAdminRecordIds } from "@/fixtures/reference-data";
import { getAdminStaticRouteSlugs } from "@/lib/admin-navigation";
import { workspaceIds, workspaceNavigation } from "@/lib/navigation";

export function generateStaticParams() {
  const params = workspaceIds.flatMap((workspace) =>
    workspaceNavigation[workspace].map((item) => ({
      workspace,
      slug: item.slug ? item.slug.split("/") : []
    }))
  );

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
