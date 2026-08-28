"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNavigation, type PublicHierarchyItem } from "@/lib/public-navigation";

function pathOnly(href: string) {
  return href.split("#")[0] || "/";
}

function isActive(pathname: string, item: PublicHierarchyItem) {
  const itemPath = pathOnly(item.href);
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function TopLevelLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {publicNavigation.map((item) => (
        <Link
          key={item.id}
          className={isActive(pathname, item) ? "active" : undefined}
          href={item.href}
          aria-current={isActive(pathname, item) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function PublicNavigation() {
  const pathname = usePathname();

  return (
    <nav className="publicNav" aria-label="Public navigation">
      <div className="publicNavDesktop">
        <TopLevelLinks pathname={pathname} />
        <Link className="button small secondary" href="/login">Sign in</Link>
      </div>

      <details className="publicNavMobile">
        <summary>Menu</summary>
        <div className="publicMobilePanel">
          <TopLevelLinks pathname={pathname} />
          <Link className="button small secondary" href="/login">Sign in</Link>
        </div>
      </details>
    </nav>
  );
}
