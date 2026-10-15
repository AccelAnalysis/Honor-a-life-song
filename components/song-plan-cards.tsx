"use client";

import Link from "next/link";
import { useState } from "react";
import { formatOfferingPrice } from "@/domain/booking";
import { experienceOfferings, type ExperienceOffering } from "@/domain/experience";
import { groupAccountHref } from "@/domain/consumer-song-flow";
import { formatPlanPrice, individualSongAddOns, individualSongPlans } from "@/domain/individual-song-plans";
import styles from "./song-plan-cards.module.css";

type PlanAudience = "individual" | "group";

function planBenefits(offering: ExperienceOffering): string[] {
  return [offering.creativeOutput, offering.storyCapture, offering.presentation, offering.postEvent];
}

export function SongPlanCards({ source = "draft" }: { source?: "draft" | "pricing" }) {
  const [audience, setAudience] = useState<PlanAudience>("individual");
  const individual = audience === "individual";

  return <section className={styles.plans} aria-labelledby="song-plans-heading">
    <div className={styles.heading}>
      <h2 id="song-plans-heading">Choose a plan</h2>
      <p>{individual
        ? source === "pricing" ? "A personal song for one person." : "A personal song from the notes you just shaped."
        : "A song for a group, a concert, or an album."}</p>
      <div className={styles.switch} role="group" aria-label="Plan type">
        <button type="button" aria-pressed={individual} onClick={() => setAudience("individual")}>Individual</button>
        <button type="button" aria-pressed={!individual} onClick={() => setAudience("group")}>Group</button>
      </div>
    </div>
    {individual ? <>
      <div className={styles.row}>
        {individualSongPlans.map((plan) => {
          const featured = plan.featured === true;
          const href = source === "pricing" ? `/create?plan=${plan.id}` : `/create-account?next=%2Ftry&plan=${plan.id}`;
          return <article className={featured ? `${styles.card} ${styles.featured}` : styles.card} key={plan.id}>
            {plan.badge ? <p className={styles.badge}>{plan.badge}</p> : null}
            {plan.id === "song-keep-signature" ? <p className={styles.fanfare}>Songwriter&apos;s Touch™</p> : null}
            <h3>{plan.name}</h3>
            <p className={styles.price}>{formatPlanPrice(plan.priceCents)}</p>
            <Link className={styles.cta} href={href}>{source === "pricing" ? `Start ${plan.name}` : `Choose ${plan.name}`}</Link>
            <ul>
              {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
          </article>;
        })}
      </div>
      <div className={styles.addons} aria-labelledby="song-addons-heading">
        <h3 id="song-addons-heading">Optional add-ons</h3>
        <ul>
          {individualSongAddOns.map((addOn) => <li key={addOn.id}><span>{addOn.name}</span><b>{formatPlanPrice(addOn.priceCents)}</b></li>)}
        </ul>
      </div>
    </> : <div className={styles.row}>
      {experienceOfferings.map((offering) => {
        const featured = offering.id === "honor-a-life-song-experience";
        return <article className={featured ? `${styles.card} ${styles.featured}` : styles.card} key={offering.id}>
          <h3>{offering.name}</h3>
          <p className={styles.price}>{formatOfferingPrice(offering.priceCents)}</p>
          <Link className={styles.cta} href={groupAccountHref(offering.id)}>Create a group account</Link>
          <ul>
            {planBenefits(offering).map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>
        </article>;
      })}
    </div>}
  </section>;
}
