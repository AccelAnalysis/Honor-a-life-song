import Link from "next/link";

const links = [["How It Works", "/how-it-works"], ["Services", "/services"], ["Project Ageless", "/services/project-ageless"]] as const;

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="publicShell"><header className="publicHeader"><Link className="brand" href="/">Honor a Life Song</Link><nav aria-label="Public navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<Link className="button small secondary" href="/login">Login</Link></nav></header><main>{children}</main><footer><strong>Honor a Life Song</strong><span>Human-led story-to-song platform</span><span>Privacy · Terms · Accessibility · Contact</span></footer></div>;
}
