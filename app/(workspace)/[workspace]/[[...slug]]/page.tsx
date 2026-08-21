import { WorkspaceRoute } from "@/components/workspace-route";
import { referenceCreatorContext } from "@/fixtures/reference-data";
import { getCreatorStaticRouteSlugs } from "@/lib/creator-navigation";
import { workspaceIds, workspaceNavigation } from "@/lib/navigation";

export function generateStaticParams() {
  const params = workspaceIds.flatMap((workspace) =>
    workspaceNavigation[workspace].map((item) => ({
      workspace,
      slug: item.slug ? item.slug.split("/") : []
    }))
  );

  params.push(...getCreatorStaticRouteSlugs(referenceCreatorContext.creativeWorkId).map((slug) => ({
    workspace: "creator" as const,
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
