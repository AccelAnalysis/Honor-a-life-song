"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listUserOrganizations } from "@/lib/firebase/organization-account";
import { customerMessage } from "@/lib/customer-messages";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";
import { SongKeepLockup } from "./brand";
import { AccountRegistrationForm, type AccountRegistrationResult } from "./account-registration-form";
import { safeReturnPath } from "@/lib/safe-return-path";
import { getExperienceOffering } from "@/domain/experience";
import { formatOfferingPrice } from "@/domain/booking";
import styles from "./create-account-route.module.css";

export function CreateAccountRoute() {
  const router = useRouter(), params = useSearchParams();
  const { user, status } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const next = safeReturnPath(params.get("next"));
  const nextUrl = next ? new URL(next, "https://songkeep.invalid") : null;
  const accessOnly = Boolean(nextUrl && ["/accept-invitation", "/claim", "/participate"].includes(nextUrl.pathname));
  const offering = getExperienceOffering(nextUrl?.searchParams.get("offering") ?? params.get("offering") ?? undefined);
  const addGroup = params.get("addGroup") === "1";
  useEffect(() => {
    if (status === "loading") return;
    if (!user || registering || addGroup) { setChecking(false); return; }
    let cancelled = false;
    setChecking(true);
    listUserOrganizations(user.uid).then(items => {
      if (cancelled) return;
      if (items.length || accessOnly) router.replace(next ?? "/organization");
      else setChecking(false);
    }).catch(cause => { if (!cancelled) { setError(customerMessage(cause)); setChecking(false); } });
    return () => { cancelled = true; };
  }, [user, status, registering, addGroup, accessOnly, next, router]);
  async function complete({ organizationId }: AccountRegistrationResult) {
    if (nextUrl) {
      if (organizationId) nextUrl.searchParams.set(nextUrl.pathname === "/organization/invoices" ? "organization" : nextUrl.pathname.startsWith("/organization") ? "org" : "organizationId", organizationId);
      router.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    } else router.replace(organizationId ? `/organization?org=${encodeURIComponent(organizationId)}` : "/memories");
  }
  return <main className={styles.shell}>
    <section className={styles.story}>
      <Link href="/" className={styles.brand} aria-label="SongKeep home"><SongKeepLockup variant="full" inverse /></Link>
      <div><p className={styles.kicker}>SongKeep</p><h1>Make something worth keeping.</h1><p>Your songs, events, and invoices. All in one place.</p></div>
    </section>
    <section className={styles.formSide} aria-labelledby="create-account-title"><div className={styles.formInner}>
      <Link href="/" className={styles.formBrand} aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
      <p className={styles.kicker}>Your account</p><h2 id="create-account-title">{accessOnly ? "Create your sign-in." : user ? "Add your group." : "Who should SongKeep work with?"}</h2>
      <p className={styles.intro}>{accessOnly ? "Use the email address that received your invitation." : "Set up your account now. We’ll ask about the event next."}</p>
      {offering ? <p className={styles.selectedOffer}><strong>{offering.name}</strong><span>{formatOfferingPrice(offering.priceCents)} · {offering.creativeOutput}</span><Link href="/services">Change experience</Link></p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {checking && !registering ? <p role="status">Opening your account…</p> : <AccountRegistrationForm onBusyChange={setRegistering} onComplete={complete} accessOnly={accessOnly} offeringId={offering?.id} signInHref={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} />}
    </div></section>
  </main>;
}
