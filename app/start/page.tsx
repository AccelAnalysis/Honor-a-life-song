import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { startChoices } from "@/domain/consumer-song-flow";
import styles from "./start.module.css";

export default function StartPage() {
  return <PublicShell>
    <div className={styles.page}>
      <p className={styles.kicker}>SongKeep</p>
      <h1>Get started</h1>
      <p>Choose a song for one person, or a song for a group.</p>
      <div className={styles.choices}>
        {startChoices.map((choice) => <Link href={choice.href} key={choice.id}>
          <strong>{choice.label}</strong>
          <span>{choice.detail}</span>
        </Link>)}
      </div>
      <p className={styles.quiet}><Link href="/pricing">Pricing</Link> is here when you want it.</p>
    </div>
  </PublicShell>;
}
