import { PublicDocument } from "@/components/public-document";
import styles from "@/components/public-document.module.css";

export default function AboutPage() {
  return <PublicDocument kicker="SongKeep" title="About" lede="SongKeep turns stories into songs people can hear and keep.">
    <p className={styles.quiet}>Honor a Life Song is the group experience.</p>
  </PublicDocument>;
}
