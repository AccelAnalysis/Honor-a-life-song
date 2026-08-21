import { WorkspaceRoute } from "@/components/workspace-route";
import { workspaceIds, workspaceNavigation } from "@/lib/navigation";

export function generateStaticParams() {
  return workspaceIds.flatMap((workspace) =>
    workspaceNavigation[workspace].map((item) => ({
      workspace,
      slug: item.slug ? item.slug.split("/") : []
    }))
  );
}

export default function WorkspacePage() {
  return <WorkspaceRoute />;
}
