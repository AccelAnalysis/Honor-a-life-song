import Link from "next/link";
import { PublicDocument } from "@/components/public-document";

export default function PrivacyPage() {
  return <PublicDocument kicker="SongKeep" title="Privacy Policy" lede="Your story is yours. This page explains what SongKeep keeps, and what stays with you.">
    <h2>What you share</h2>
    <p>If you create an account, SongKeep stores the name, email, and organization details you enter. A group booking also stores the experience, date request, and invoice details you submit.</p>
    <p>On Try a song, interview notes and the lyric you shape stay in that browser until you create an account. Playing a preview does not require an account, and a preview starts only when you press play. Choosing a personal plan starts a sign-in. That step does not take a payment.</p>
    <h2>How SongKeep uses it</h2>
    <p>SongKeep uses what you share to shape a song, run an experience, and follow up on a booking or invoice you requested. Participant and family choices about recording, photos, video, and sharing stay attached to that experience.</p>
    <h2>Who can see it</h2>
    <p>A group account is visible to the people that organization invites. A personal song account is for the person who created it. SongKeep does not sell stories, lyrics, or contact details.</p>
    <h2>Questions</h2>
    <p>Write to <a href="mailto:help@honoralifesong.com">help@honoralifesong.com</a>, or visit <Link href="/contact">Contact</Link>.</p>
  </PublicDocument>;
}
