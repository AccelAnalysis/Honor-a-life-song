import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function TermsPage() {
  return <PublicDocument kicker="SongKeep" title="Terms of Service" lede="These terms cover using SongKeep to hear a song, shape one, or plan an experience.">
    <h2>Using SongKeep</h2>
    <p>You may play the public previews, try a lyric from your notes, and read the plans on <Link href="/pricing">Pricing</Link>. On Try a song, verse ideas are arranged from the notes you paste. You edit them. They are not a finished recording. Do not share someone else’s private story without their permission.</p>
    <h2>Plans</h2>
    <p>Individual plans are personal songs. Choosing one starts a SongKeep sign-in. SongKeep confirms that price before any charge.</p>
    <p>Group plans are for an organization or gathering. <Link href="/begin">Plan an experience</Link> sends a request. The date is confirmed with you, and the invoice follows that request.</p>
    <h2>Stories and songs</h2>
    <p>The stories you share remain yours. SongKeep uses them to create the song you asked for, within the permissions you give. Previews on the site are short SongKeep sketches for listening.</p>
    <h2>Questions</h2>
    <p>Write to <a href="mailto:help@honoralifesong.com">help@honoralifesong.com</a>, or visit <Link href="/contact">Contact</Link>.</p>
  </PublicDocument>;
}
