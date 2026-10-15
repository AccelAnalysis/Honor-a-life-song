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
        <div className="footerColumns">
          <nav aria-label="Explore">
            <h2>Explore</h2>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/start">Get started</Link></li>
              <li><Link href="/try">Try a song</Link></li>
              <li><Link href="/how-it-works">How it works</Link></li>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/begin">Plan an experience</Link></li>
            </ul>
          </nav>
          <nav aria-label="SongKeep">
            <h2>SongKeep</h2>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/login">Sign in</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h2>Legal</h2>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/accessibility">Accessibility</Link></li>
            </ul>
          </nav>
        </div>
        <p className="footerNote">© 2026 SongKeep</p>
      </footer>
    </div>
  );
}
