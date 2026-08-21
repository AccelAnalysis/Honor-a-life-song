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

function MenuTree({ items, pathname, depth = 0 }: { items: readonly PublicHierarchyItem[]; pathname: string; depth?: number }) {
  return (
    <ul className={`publicMenuTree depth${depth}`}>
      {items.map((item) => (
        <li key={item.id} className={item.children?.length ? "hasChildren" : undefined}>
          <Link className={isActive(pathname, item) ? "active" : undefined} href={item.href}>
            <span>{item.label}</span>
            {item.children?.length ? <span aria-hidden="true">›</span> : null}
          </Link>
          {item.children?.length ? <MenuTree items={item.children} pathname={pathname} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function PublicNavigation() {
  const pathname = usePathname();

  return (
    <nav className="publicNav" aria-label="Public navigation">
      <div className="publicNavDesktop">
        {publicNavigation.map((item) => (
          <div className="publicNavGroup" key={item.id}>
            <Link className={isActive(pathname, item) ? "active" : undefined} href={item.href} aria-current={isActive(pathname, item) ? "page" : undefined}>
              {item.label}
            </Link>
            {item.children?.length ? <MenuTree items={item.children} pathname={pathname} /> : null}
          </div>
        ))}
        <Link className="button small secondary" href="/login">Login</Link>
      </div>

      <details className="publicNavMobile">
        <summary>Explore</summary>
        <div className="publicMobilePanel">
          <MenuTree items={publicNavigation} pathname={pathname} />
          <Link className="button small secondary" href="/login">Login</Link>
        </div>
      </details>
    </nav>
  );
}
