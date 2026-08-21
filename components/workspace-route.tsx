"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminWorkspace } from "@/components/admin-workspace";
import { referenceContext } from "@/fixtures/reference-data";
import { buildAdminHref, resolveAdminRoute, type AdminParentId } from "@/lib/admin-navigation";
import { getNavigation, isWorkspaceId, type NavigationItem, type WorkspaceId } from "@/lib/navigation";
import styles from "./workspace-route.module.css";

function titleize(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function availabilityLabel(item: NavigationItem) {
  if (item.availability === "chassis") return null;
  return item.availability === "structured" ? "Structured" : "Planned";
}

function flatHref(workspace: WorkspaceId, item: NavigationItem) {
  return `/${workspace}${item.slug ? `/${item.slug}` : ""}`;
}

export function WorkspaceRoute() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const candidate = parts[0] ?? "";

  if (!isWorkspaceId(candidate)) {
    return <main className="centeredPage"><section className="authCard"><h1>Workspace not found</h1><Link href="/">Return home</Link></section></main>;
  }

  const workspace = candidate as WorkspaceId;
  const nav = getNavigation(workspace);
  const nestedParts = parts.slice(1);
  const adminRoute = workspace === "admin" ? resolveAdminRoute(nestedParts) : undefined;
  const flatSlug = nestedParts.join("/");
  const flatItem = workspace === "admin" ? undefined : nav.find((item) => item.slug === flatSlug);
  const routeInvalid = workspace === "admin" ? !adminRoute : !flatItem && flatSlug.length > 0;
  const activeItem = adminRoute?.parent ?? flatItem ?? nav[0];
  const context = referenceContext[workspace];

  const itemHref = (item: NavigationItem) => workspace === "admin"
    ? buildAdminHref({ parentId: item.id as AdminParentId })
    : flatHref(workspace, item);

  const activeNode = adminRoute?.child;
  const headingLabel = routeInvalid ? "Workflow not found" : activeNode?.label ?? activeItem.label;
  const headingDescription = routeInvalid
    ? "This route is not part of the governed workspace hierarchy. No fallback workflow was selected."
    : activeNode?.description ?? activeItem.description;
  const eyebrow = adminRoute && activeNode
    ? `${titleize(workspace)} / ${activeItem.label} / ${activeNode.label}`
    : `${titleize(workspace)} / ${activeItem.label}`;
  const structuredAdminRoute = workspace === "admin" && !routeInvalid;

  return <div className="workspaceShell">
    <header className="workspaceHeader"><Link className="brand inverse" href="/">Honor a Life Song</Link><div className="workspaceIdentity"><span>{titleize(workspace)} workspace</span><small>REFERENCE CHASSIS</small></div><Link href="/login">Access</Link></header>
    <aside className="workspaceNav"><div className="contextCard"><span>{context.label}</span><strong>{context.value}</strong></div><nav aria-label={`${workspace} workspace navigation`}>{nav.map((item) => <Link aria-current={activeItem.id === item.id ? "page" : undefined} className={activeItem.id === item.id ? "active" : ""} href={itemHref(item)} key={item.id}><span>{item.label}</span>{availabilityLabel(item) && <small>{availabilityLabel(item)}</small>}</Link>)}</nav></aside>
    <main className="workspaceMain">
      <div className="referenceBanner"><strong>REFERENCE CHASSIS</strong><span>Synthetic context only. No production participant, customer, facility, payment or media data is connected.</span></div>
      <div className="pageHeading"><div><p className="eyebrow">{eyebrow}</p><h1>{headingLabel}</h1><p>{headingDescription}</p></div><span className={`status ${structuredAdminRoute ? styles.structuredStatus : activeItem.availability}`}>{structuredAdminRoute ? "Workflow structure active" : activeItem.availability === "chassis" ? "Chassis active" : activeItem.availability === "structured" ? "Workflow structured" : "Workflow planned"}</span></div>
      {routeInvalid
        ? <section className="unavailable large"><strong>Invalid nested workspace route</strong><span>The requested child or selected-record route is not registered in the source-defined hierarchy.</span><p>Use the governed workspace navigation instead of falling back to an unrelated destination.</p></section>
        : workspace === "admin" && adminRoute
          ? <AdminWorkspace route={adminRoute} />
          : activeItem.availability === "chassis"
            ? <section className="dashboardGrid"><article className="metric"><span>Workspace</span><strong>{titleize(workspace)}</strong></article><article className="metric"><span>Route contract</span><strong>Active</strong></article><article className="metric"><span>Authorization</span><strong>Interface only</strong></article><article className="metric"><span>Live services</span><strong>Not connected</strong></article><article className="wideCard"><h2>What the chassis guarantees</h2><ul><li>Stable route and navigation ownership</li><li>Responsive workspace composition</li><li>Shared context boundary</li><li>Explicit progressive availability</li><li>No simulated backend service behavior</li></ul></article></section>
            : <section className="unavailable large"><strong>{activeItem.label} is reserved in the operating chassis</strong><span>{activeItem.unavailableReason}</span><p>Later implementation should supply this module through the governed domain and service contracts without changing the surrounding workspace composition.</p></section>}
    </main>
    <nav className="mobileNav" aria-label="Mobile workspace navigation">
      {nav.slice(0, 3).map((item) => <Link aria-current={activeItem.id === item.id ? "page" : undefined} className={activeItem.id === item.id ? "active" : ""} href={itemHref(item)} key={item.id}>{item.label}</Link>)}
      <details className={styles.mobileMore}><summary>More</summary><div>{nav.slice(3).map((item) => <Link aria-current={activeItem.id === item.id ? "page" : undefined} className={activeItem.id === item.id ? "active" : ""} href={itemHref(item)} key={item.id}>{item.label}</Link>)}</div></details>
    </nav>
  </div>;
}
