"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { UserExperienceAccess } from "@/domain/organization-account";
import { listUserExperienceAccess } from "@/lib/firebase/organization-invitations";
import styles from "./memories-hub.module.css";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
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

  if (status === "loading" || loading) return <main className={styles.shell}><p>Opening your memories…</p></main>;
  if (status === "unavailable") return <main className={styles.shell}><section><h1>Private access is unavailable here.</h1><p>{configurationError}</p></section></main>;
  if (status === "signed_out" || !user) return <main className={styles.shell}><section><p className={styles.eyebrow}>Private memories</p><h1>Sign in to return to what was shared with you.</h1><Link className={styles.primary} href="/login?next=%2Fmemories">Sign in</Link></section></main>;

  return <main className={styles.shell}>
    <header><Link className={styles.brand} href="/">Honor a Life Song</Link><span>My memories</span></header>
    <section className={styles.intro}><p className={styles.eyebrow}>Songs &amp; event memories</p><h1>Keep close what was shared with you.</h1><p>This is a simple, private home for experiences claimed through a participant or family invitation.</p></section>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {access.length ? <section className={styles.list} aria-label="Claimed experiences">{access.map((item) => <article key={item.id}>
      <div><p className={styles.eyebrow}>{item.organizationName}</p><h2>{item.experienceTitle}</h2><p>Shared for {item.participantName} · Connected {formatDate(item.acceptedAt)}</p></div>
      <div className={styles.itemAction}><span>{item.entitlementIds.length} permissioned {item.entitlementIds.length === 1 ? "item" : "items"}</span>{item.deliveryToken ? <Link className={styles.primary} href={`/song/${item.deliveryToken}`}>Open private keepsake</Link> : <small>Private delivery is being prepared.</small>}</div>
    </article>)}</section> : <section className={styles.empty}><h2>No claimed experiences yet.</h2><p>Use the participant or family access link shared by the organization that hosted the experience.</p></section>}
    <footer>Only materials specifically released to this account appear here. Sharing permissions can change or be withdrawn.</footer>
  </main>;
}
