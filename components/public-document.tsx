import type { ReactNode } from "react";
import { PublicShell } from "@/components/public-shell";
import styles from "./public-document.module.css";

export function PublicDocument({ kicker, title, lede, children }: { kicker: string; title: string; lede?: string; children: ReactNode }) {
  return <PublicShell>
    <article className={styles.page}>
      <p className={styles.kicker}>{kicker}</p>
      <h1>{title}</h1>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
      <div className={styles.body}>{children}</div>
    </article>
  </PublicShell>;
}
