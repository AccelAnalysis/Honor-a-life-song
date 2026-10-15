import { SongPlanCards } from "@/components/song-plan-cards";
import { PublicShell } from "@/components/public-shell";
import styles from "./pricing.module.css";

export default function PricingPage() {
  return <PublicShell>
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>SongKeep</p>
        <h1>Pricing</h1>
        <p>Personal songs and group experiences, side by side.</p>
      </header>
      <SongPlanCards source="pricing" />
    </div>
  </PublicShell>;
}
