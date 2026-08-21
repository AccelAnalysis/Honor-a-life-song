import Link from "next/link";
import { PublicNavigation } from "@/components/public-navigation";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="publicShell">
      <header className="publicHeader">
        <Link className="brand" href="/" aria-label="Honor a Life Song home">Honor a Life Song</Link>
        <PublicNavigation />
      </header>
      <main>{children}</main>
      <footer>
        <strong>Honor a Life Song</strong>
        <span>Human-created songs from the stories that matter.</span>
        <span>Privacy · Terms · Accessibility · Contact</span>
      </footer>
    </div>
  );
}
