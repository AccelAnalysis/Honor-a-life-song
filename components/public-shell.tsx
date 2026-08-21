import Link from "next/link";
import { PublicNavigation } from "@/components/public-navigation";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="publicShell">
      <header className="publicHeader">
        <Link className="brand" href="/">Honor a Life Song</Link>
        <PublicNavigation />
      </header>
      <main>{children}</main>
      <footer>
        <strong>Honor a Life Song</strong>
        <span>Human-led story-to-song platform</span>
        <span>Privacy · Terms · Accessibility · Contact</span>
      </footer>
    </div>
  );
}
