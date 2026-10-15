import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function AccessibilityPage() {
  return <PublicDocument kicker="SongKeep" title="Accessibility" lede="SongKeep should be usable with a keyboard, a screen reader, and without unexpected sound.">
    <p>Pages use headings, labels, and visible focus. Audio does not start on its own. A preview plays when you press play.</p>
    <p>If something blocks you, write to <a href="mailto:help@honoralifesong.com">help@honoralifesong.com</a> and say what you were trying to do. You can also visit <Link href="/contact">Contact</Link>.</p>
  </PublicDocument>;
}
