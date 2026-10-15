import Link from "next/link";
import { formatOfferingPrice } from "@/domain/booking";
import { experienceOfferings, type ExperienceOffering } from "@/domain/experience";
import styles from "./song-plan-cards.module.css";

function planBenefits(offering: ExperienceOffering): string[] {
  return [offering.creativeOutput, offering.storyCapture, offering.presentation, offering.postEvent];
}

export function SongPlanCards() {
  return <section className={styles.plans} aria-labelledby="song-plans-heading">
    <div className={styles.heading}>
      <h2 id="song-plans-heading">Choose a plan</h2>
      <p>You have a draft. These SongKeep packages are the next step when you want the song finished for a group, a concert, or an album.</p>
    </div>
    <div className={styles.row}>
      {experienceOfferings.map((offering) => {
        const featured = offering.id === "honor-a-life-song-experience";
        return <article className={featured ? `${styles.card} ${styles.featured}` : styles.card} key={offering.id}>
          <h3>{offering.name}</h3>
          <p className={styles.price}>{formatOfferingPrice(offering.priceCents)}</p>
          <Link className={styles.cta} href={`/begin?offering=${offering.id}`}>Choose {offering.shortName}</Link>
          <ul>
            {planBenefits(offering).map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>
        </article>;
      })}
    </div>
  </section>;
}
