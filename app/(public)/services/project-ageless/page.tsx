import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function ProjectAgelessPage() {
  return <PublicShell><main className="contentPage"><p className="eyebrow">Flagship facility program</p><h1>Project Ageless</h1><p className="lede">A short-form participatory residency where residents can join any combination of story sharing, interviews, family contributions, songwriting, listening, performance and keepsake delivery.</p><div className="callout"><strong>Architectural rule:</strong> Project Ageless is a configurable program running on the Honor a Life Song platform—not a separate application.</div><Link className="button primary" href="/facility">Preview the facility chassis</Link></main></PublicShell>;
}
