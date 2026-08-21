import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function ServicesPage() {
  return <PublicShell><main className="contentPage"><p className="eyebrow">Services</p><h1>Ways to honor a story through song</h1><div className="cardGrid"><article className="card"><h2>Individual & Family Songs</h2><p>One purchaser or family can guide a song through interview, story development, lyric review, production and secure delivery.</p></article><article className="card"><h2>Project Ageless</h2><p>Facilities can coordinate participants, flexible program touchpoints, family connections, songs, concerts, keepsakes and outcomes.</p><Link href="/services/project-ageless">View Project Ageless →</Link></article><article className="card"><h2>Community Programs</h2><p>Future programs use configurable templates over the same shared people, story, consent, creative-work and delivery services.</p></article></div></main></PublicShell>;
}
