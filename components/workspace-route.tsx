"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminAccessGate } from "@/components/admin-access-gate";
import { AdminWorkspace } from "@/components/admin-workspace";
import { SongKeepLockup } from "@/components/brand";
import { CreatorWorkspace } from "@/components/creator-workspace";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { FacilityWorkspace } from "@/components/facility-workspace";
import { OrganizationWorkspace } from "@/components/organization-workspace";
import { referenceFacilityContext } from "@/fixtures/reference-data";
import { buildAdminHref, resolveAdminRoute, type AdminParentId } from "@/lib/admin-navigation";
import {
  buildCreatorHref,
  creatorParentCarriesWorkContext,
  resolveCreatorRoute,
  type CreatorParentId
} from "@/lib/creator-navigation";
import {
  buildCustomerHref,
  customerParentCarriesOrderContext,
  resolveCustomerRoute,
  type CustomerParentId
} from "@/lib/customer-navigation";
import { buildFacilityHref, resolveFacilityRoute, type FacilityParentId } from "@/lib/facility-navigation";
import { getNavigation, isWorkspaceId, type NavigationItem, type WorkspaceId } from "@/lib/navigation";
import styles from "./workspace-route.module.css";

function workspaceDisplayName(workspace: WorkspaceId) {
  if (workspace === "customer") return "Memories";
  if (workspace === "organization") return "Organization";
  if (workspace === "facility") return "Project Ageless";
  if (workspace === "creator") return "Creator Studio";
  return "Operations";
}

function flatHref(workspace: WorkspaceId, item: NavigationItem) {
  return `/${workspace}${item.slug ? `/${item.slug}` : ""}`;
}

function displayNodeLabel(id: string, label: string) {
  if (id === "people-facilities") return "Organizations";
  if (id === "people-facility-staff") return "Organization Team";
  return label;
}

export function WorkspaceRoute() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const candidate = parts[0] ?? "";

  if (!isWorkspaceId(candidate)) {
    return <main className="centeredPage"><section className="authCard"><h1>Page not found</h1><Link href="/">Home</Link></section></main>;
  }

  const workspace = candidate as WorkspaceId;
  const nav = getNavigation(workspace);
  const nestedParts = parts.slice(1);
  const adminRoute = workspace === "admin" ? resolveAdminRoute(nestedParts) : undefined;
  const creatorRoute = workspace === "creator" ? resolveCreatorRoute(nestedParts) : undefined;
  const customerRoute = workspace === "customer" ? resolveCustomerRoute(nestedParts) : undefined;
  const facilityRoute = workspace === "facility" ? resolveFacilityRoute(nestedParts) : undefined;
  const flatSlug = nestedParts.join("/");
  const hasNestedHierarchy = workspace === "admin" || workspace === "creator" || workspace === "customer" || workspace === "facility";
  const flatItem = hasNestedHierarchy ? undefined : nav.find((item) => item.slug === flatSlug);
  const routeInvalid = workspace === "admin"
    ? !adminRoute
    : workspace === "creator"
      ? !creatorRoute
      : workspace === "customer"
        ? !customerRoute
        : workspace === "facility"
          ? !facilityRoute
          : !flatItem && flatSlug.length > 0;
  const activeItem = adminRoute?.parent ?? creatorRoute?.parent ?? customerRoute?.parent ?? facilityRoute?.parent ?? flatItem ?? nav[0];
  const facilityProgramRunId = facilityRoute?.programRunId ?? referenceFacilityContext.programRunId;

  const itemHref = (item: NavigationItem) => {
    if (workspace === "admin") return buildAdminHref({ parentId: item.id as AdminParentId });
    if (workspace === "creator") {
      const parentId = item.id as CreatorParentId;
      const creativeWorkId = creatorRoute?.creativeWorkId && creatorParentCarriesWorkContext(parentId) ? creatorRoute.creativeWorkId : undefined;
      return buildCreatorHref({ parentId, creativeWorkId });
    }
    if (workspace === "customer") {
      const parentId = item.id as CustomerParentId;
      const orderId = customerRoute?.orderId && customerParentCarriesOrderContext(parentId) ? customerRoute.orderId : undefined;
      return buildCustomerHref({ parentId, orderId });
    }
    if (workspace === "facility") {
      return buildFacilityHref({ parentId: item.id as FacilityParentId, programRunId: facilityProgramRunId });
    }
    return flatHref(workspace, item);
  };

  const activeNode = facilityRoute?.grandchild
    ?? facilityRoute?.child
    ?? creatorRoute?.grandchild
    ?? creatorRoute?.child
    ?? customerRoute?.grandchild
    ?? customerRoute?.child
    ?? adminRoute?.child;
  const activeNodeLabel = activeNode ? displayNodeLabel(activeNode.id, activeNode.label) : undefined;
  const headingLabel = routeInvalid ? "Page not found" : activeNodeLabel ?? activeItem.label;
  const headingDescription = routeInvalid ? "This page is not available." : activeItem.description;
  const workspaceName = workspaceDisplayName(workspace);
  const eyebrow = facilityRoute && activeNode
    ? `${workspaceName} / ${activeItem.label} / ${facilityRoute.child?.label}${facilityRoute.grandchild ? ` / ${facilityRoute.grandchild.label}` : ""}`
    : adminRoute && activeNode
      ? `${workspaceName} / ${activeItem.label} / ${activeNodeLabel}`
      : creatorRoute && activeNode
        ? `${workspaceName} / ${activeItem.label} / ${creatorRoute.child?.label}${creatorRoute.grandchild ? ` / ${creatorRoute.grandchild.label}` : ""}`
        : customerRoute && activeNode
          ? `${workspaceName} / ${activeItem.label} / ${customerRoute.child?.label}${customerRoute.grandchild ? ` / ${customerRoute.grandchild.label}` : ""}`
          : `${workspaceName} / ${activeItem.label}`;
  const accountHref = workspace === "organization" ? "/organization/account" : "/login";
  const customerFacing = workspace === "organization" || workspace === "customer";

  return <div className="workspaceShell" data-workspace={workspace}>
    <header className="workspaceHeader">
      <Link className="workspaceBrand" href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
      <div className="workspaceIdentity"><span>{workspaceName}</span></div>
      <Link className="workspaceAccount" href={accountHref}>Account</Link>
    </header>
    <aside className="workspaceNav"><nav aria-label={`${workspaceName} navigation`}>{nav.map((item) => <Link aria-current={activeItem.id === item.id ? "page" : undefined} className={activeItem.id === item.id ? "active" : ""} href={itemHref(item)} key={item.id}><span>{item.label}</span></Link>)}</nav></aside>
    <main className="workspaceMain">
      <div className="pageHeading"><div>{customerFacing ? null : <p className="eyebrow">{eyebrow}</p>}<h1>{headingLabel}</h1>{customerFacing ? null : <p>{headingDescription}</p>}</div></div>
      {routeInvalid
        ? <section className="unavailable large"><strong>This page isn’t available.</strong></section>
        : workspace === "admin" && adminRoute
          ? <AdminAccessGate><AdminWorkspace route={adminRoute} /></AdminAccessGate>
          : workspace === "creator" && creatorRoute
            ? <CreatorWorkspace route={creatorRoute} />
            : workspace === "customer" && customerRoute
              ? <CustomerWorkspace route={customerRoute} />
              : workspace === "facility" && facilityRoute
                ? <FacilityWorkspace route={facilityRoute} />
                : workspace === "organization"
                  ? <OrganizationWorkspace sectionId={activeItem.id} />
                  : <section className="unavailable large"><strong>{activeItem.label} is coming soon.</strong></section>}
    </main>
    <nav className="mobileNav" aria-label={`${workspaceName} mobile navigation`}>
      {nav.slice(0, 3).map((item) => <Link aria-current={activeItem.id === item.id ? "page" : undefined} className={activeItem.id === item.id ? "active" : ""} href={itemHref(item)} key={item.id}>{item.label}</Link>)}
      <details className={styles.mobileMore}><summary>More</summary><div>{nav.slice(3).map((item) => <Link aria-current={activeItem.id === item.id ? "page" : undefined} className={activeItem.id === item.id ? "active" : ""} href={itemHref(item)} key={item.id}>{item.label}</Link>)}</div></details>
    </nav>
  </div>;
}
