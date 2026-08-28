import Link from "next/link";
import { PublicNavigation } from "@/components/public-navigation";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="publicShell">
      <header className="publicHeader">
        <Link className="brand" href="/" aria-label="SongKeep home">SongKeep</Link>
        <PublicNavigation />
      </header>
      <main>{children}</main>
      <footer>
        <strong>SongKeep</strong>
        <span>Stories become songs worth keeping.</span>
        <span>Privacy · Terms · Accessibility · Contact</span>
      </footer>
    </div>
  );
}
