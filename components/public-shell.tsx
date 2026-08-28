import Link from "next/link";
import { SongKeepLockup } from "@/components/brand";
import { PublicNavigation } from "@/components/public-navigation";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="publicShell">
      <header className="publicHeader">
        <Link className="brandLink" href="/" aria-label="SongKeep home">
          <SongKeepLockup variant="app" />
        </Link>
        <PublicNavigation />
      </header>
      <main>{children}</main>
      <footer>
        <div className="footerBrand">
          <SongKeepLockup variant="app" inverse />
          <span>Stories become songs worth keeping.</span>
        </div>
        <div className="footerLinks" aria-label="Site information">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Accessibility</span>
          <span>Contact</span>
        </div>
      </footer>
    </div>
  );
}
