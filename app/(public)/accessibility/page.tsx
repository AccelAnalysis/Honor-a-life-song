import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function AccessibilityPage() {
  return <PublicDocument kicker="SongKeep" title="Accessibility" lede="SongKeep should be usable with a keyboard, a screen reader, and without unexpected sound.">
    <p>Pages use headings, labels, and visible focus. Audio does not start on its own. The play button names the song, and a public preview stops after a short listen.</p>
    <p>You can move through the main controls with a keyboard. The control you are on shows an outline.</p>
    <p>If something blocks you, write to <a href="mailto:help@honoralifesong.com">help@honoralifesong.com</a> and say what you were trying to do. You can also visit <Link href="/contact">Contact</Link>.</p>
  </PublicDocument>;
}
