"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { referenceContext } from "@/fixtures/reference-data";
import { getNavigation, isWorkspaceId, type WorkspaceId } from "@/lib/navigation";

function titleize(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  const activeSlug = parts.slice(1).join("/");
  const activeItem = nav.find((item) => item.slug === activeSlug) ?? nav[0];
  const context = referenceContext[workspace];

  return <div className="workspaceShell">
    <header className="workspaceHeader"><Link className="brand inverse" href="/">Honor a Life Song</Link><div className="workspaceIdentity"><span>{titleize(workspace)} workspace</span><small>REFERENCE CHASSIS</small></div><Link href="/login">Access</Link></header>
    <aside className="workspaceNav"><div className="contextCard"><span>{context.label}</span><strong>{context.value}</strong></div><nav aria-label={`${workspace} workspace navigation`}>{nav.map((item) => <Link className={activeItem.id === item.id ? "active" : ""} href={`/${workspace}${item.slug ? `/${item.slug}` : ""}`} key={item.id}><span>{item.label}</span>{item.availability !== "chassis" && <small>Planned</small>}</Link>)}</nav></aside>
    <main className="workspaceMain"><div className="referenceBanner"><strong>REFERENCE CHASSIS</strong><span>Synthetic context only. No production participant, customer, facility, payment or media data is connected.</span></div><div className="pageHeading"><div><p className="eyebrow">{titleize(workspace)} / {activeItem.label}</p><h1>{activeItem.label}</h1><p>{activeItem.description}</p></div><span className={`status ${activeItem.availability}`}>{activeItem.availability === "chassis" ? "Chassis active" : "Workflow planned"}</span></div>{activeItem.availability === "chassis" ? <section className="dashboardGrid"><article className="metric"><span>Workspace</span><strong>{titleize(workspace)}</strong></article><article className="metric"><span>Route contract</span><strong>Active</strong></article><article className="metric"><span>Authorization</span><strong>Interface only</strong></article><article className="metric"><span>Live services</span><strong>Not connected</strong></article><article className="wideCard"><h2>What the chassis guarantees</h2><ul><li>Stable route and navigation ownership</li><li>Responsive workspace composition</li><li>Shared context boundary</li><li>Explicit progressive availability</li><li>No simulated backend service behavior</li></ul></article></section> : <section className="unavailable large"><strong>{activeItem.label} is reserved in the operating chassis</strong><span>{activeItem.unavailableReason}</span><p>Later implementation should supply this module through the governed domain and service contracts without changing the surrounding workspace composition.</p></section>}</main>
    <nav className="mobileNav" aria-label="Mobile workspace navigation">{nav.slice(0, 3).map((item) => <Link className={activeItem.id === item.id ? "active" : ""} href={`/${workspace}${item.slug ? `/${item.slug}` : ""}`} key={item.id}>{item.label}</Link>)}<Link href={`/${workspace}/${nav[3]?.slug ?? ""}`}>More</Link></nav>
  </div>;
}
