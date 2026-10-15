import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function AboutPage() {
  return <PublicDocument kicker="SongKeep" title="About" lede="SongKeep turns stories into songs people can hear and keep.">
    <p>A family, a community, or a team can share the moments that matter. SongKeep shapes those notes into a song, then brings people together to hear it.</p>
    <p>Honor a Life Song is the group experience: shared stories, original songs, and a time to hear them together. A personal song starts from notes you already have. A songwriter checks those lines before the song is finished.</p>
    <p>You can <Link href="/try">try a song</Link> before an account, compare plans on <Link href="/pricing">Pricing</Link>, or <Link href="/begin">plan an experience</Link> for a group. The path from story to song is on <Link href="/how-it-works">How it works</Link>.</p>
  </PublicDocument>;
}