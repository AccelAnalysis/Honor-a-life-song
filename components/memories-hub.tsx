"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { UserExperienceAccess } from "@/domain/organization-account";
import { listUserExperienceAccess } from "@/lib/firebase/organization-invitations";
import styles from "./memories-hub.module.css";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function MemoriesHub() {
  const { user, status, configurationError } = useAuth();
  const [access, setAccess] = useState<UserExperienceAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    listUserExperienceAccess(user.uid)
      .then((items) => { if (!cancelled) setAccess(items); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open your memories."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, user]);

  if (status === "loading" || loading) return <main className={styles.shell}><p>Opening SongKeep…</p></main>;
  if (status === "unavailable") return <main className={styles.shell}><section><h1>SongKeep is unavailable here.</h1><p>{configurationError}</p></section></main>;
  if (status === "signed_out" || !user) return <main className={styles.shell}><section><p className={styles.eyebrow}>SongKeep</p><h1>Sign in to continue.</h1><Link className={styles.primary} href="/login?next=%2Fmemories">Sign in</Link></section></main>;

  return <main className={styles.shell}>
    <header><Link className={styles.brand} href="/">SongKeep</Link><span>Memories</span></header>
    <section className={styles.intro}><p className={styles.eyebrow}>Your collection</p><h1>Songs worth keeping.</h1></section>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {access.length ? <section className={styles.list} aria-label="Claimed experiences">{access.map((item) => <article key={item.id}>
      <div><p className={styles.eyebrow}>{item.organizationName}</p><h2>{item.experienceTitle}</h2><p>{item.participantName} · {formatDate(item.acceptedAt)}</p></div>
      <div className={styles.itemAction}><span>{item.entitlementIds.length} {item.entitlementIds.length === 1 ? "item" : "items"}</span>{item.deliveryToken ? <Link className={styles.primary} href={`/song/${item.deliveryToken}`}>Open</Link> : <small>Being prepared</small>}</div>
    </article>)}</section> : <section className={styles.empty}><h2>Nothing here yet.</h2><p>Use a private SongKeep invitation to add memories.</p></section>}
    <footer>Private materials only.</footer>
  </main>;
}
