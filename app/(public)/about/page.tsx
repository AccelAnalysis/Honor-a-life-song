import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function AboutPage() {
  return <PublicDocument kicker="SongKeep" title="About" lede="SongKeep turns stories into songs people can hear and keep.">
    <p>A family, a community, or a team can share the moments that matter. SongKeep shapes those notes into a song, then brings people together to hear it.</p>
    <p>You can <Link href="/try">try a song</Link> before an account, compare plans on <Link href="/pricing">Pricing</Link>, or <Link href="/begin">plan an experience</Link> for a group. The path from story to song is on <Link href="/how-it-works">How it works</Link>.</p>
  </PublicDocument>;
}