import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function ContactPage() {
  return <PublicDocument kicker="SongKeep" title="Contact" lede="Write to SongKeep about a song, an account, or an experience.">
    <p>Email <a href="mailto:help@honoralifesong.com">help@honoralifesong.com</a>.</p>
    <ul>
      <li><Link href="/try">Try a song</Link> from interview notes.</li>
      <li><Link href="/pricing">Pricing</Link> for a personal song or a group experience.</li>
      <li><Link href="/begin">Plan an experience</Link> for a group.</li>
    </ul>
  </PublicDocument>;
}
