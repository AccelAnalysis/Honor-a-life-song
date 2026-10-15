"use client";

import { customerMessage } from "@/lib/customer-messages";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { nativeCheckoutEnabled, openIndividualCheckout } from "@/lib/firebase/native-services";
import { channelsAwaitingConsent, checkoutConsentInput, emailConsentCopy, smsConsentCopy, type CommunicationPreferences } from "@/domain/communication-consent";
import { getCommunicationPreferences, saveCommunicationConsent } from "@/lib/firebase/communication-consent";
import { PrivateExperienceMaterials } from "@/components/authorized-asset";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import {
  formatLifecycleMoney,
  type IndividualPurchaseRequest,
  type PostExperienceProduct
} from "@/domain/customer-lifecycle";
import type { UserExperienceAccess } from "@/domain/organization-account";
import {
  createIndividualPurchaseRequest,
  listPostExperienceProducts,
  listUserPurchaseRequests
} from "@/lib/firebase/customer-lifecycle";
import { listUserExperienceAccess } from "@/lib/firebase/organization-invitations";
import styles from "./memories-hub.module.css";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function purchaseStatusCopy(purchase: IndividualPurchaseRequest, paymentReturned: boolean) {
  if (purchase.fulfillmentHold) return "SongKeep is reviewing this purchase before release.";
  if (["paid", "in_fulfillment", "fulfilled"].includes(purchase.status)) return "Your payment is confirmed. Open your song from the private materials for this experience.";
  if (paymentReturned) return "Checkout has returned. SongKeep confirms payment on this page before your song is released.";
  return `Current status: ${titleize(purchase.status)}.`;
}

export function MemoriesHub() {
  const params = useSearchParams();
  const purchaseId = params.get("purchase");
  const paymentReturned = params.get("payment") === "returned";
  const { user, status, configurationError } = useAuth();
  const [access, setAccess] = useState<UserExperienceAccess[]>([]);
  const [products, setProducts] = useState<PostExperienceProduct[]>([]);
  const [purchases, setPurchases] = useState<IndividualPurchaseRequest[]>([]);
  const [preferences, setPreferences] = useState<CommunicationPreferences | null>(null);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [mobilePhone, setMobilePhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listUserExperienceAccess(user.uid),
      listPostExperienceProducts(),
      listUserPurchaseRequests(user.uid),
      getCommunicationPreferences(user.uid)
    ]).then(([nextAccess, nextProducts, nextPurchases, nextPreferences]) => {
      if (cancelled) return;
      setAccess(nextAccess);
      setProducts(nextProducts);
      setPurchases(nextPurchases);
      setPreferences(nextPreferences);
    }).catch((loadError) => {
      if (!cancelled) setError(customerMessage(loadError, "We could not open your memories."));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, user]);

  const awaitingMessages = channelsAwaitingConsent(preferences);
  const focusedPurchase = purchases.find((item) => item.id === purchaseId) ?? null;
  const purchasesByAccess = useMemo(() => {
    const map = new Map<string, IndividualPurchaseRequest[]>();
    purchases.forEach((purchase) => map.set(purchase.accessId, [...(map.get(purchase.accessId) ?? []), purchase]));
    return map;
  }, [purchases]);

  async function refreshPurchases() {
    if (user) setPurchases(await listUserPurchaseRequests(user.uid));
  }

  async function handlePurchase(accessItem: UserExperienceAccess, product: PostExperienceProduct) {
    if (!user) return;
    const decision = checkoutConsentInput({ preferences, emailOptIn, smsOptIn, phone: mobilePhone });
    if (!decision.ok) { setError(decision.message); return; }
    setBusy(`${accessItem.id}-${product.id}`);
    setError(null);
    setNotice(null);
    try {
      if (decision.patch) {
        await saveCommunicationConsent({ source: "checkout", ...decision.patch });
        setPreferences(await getCommunicationPreferences(user.uid));
        setEmailOptIn(false);
        setSmsOptIn(false);
      }
      const result = await createIndividualPurchaseRequest({
        userId: user.uid,
        accessId: accessItem.id,
        productId: product.id
      });
      await refreshPurchases();
      if (nativeCheckoutEnabled && product.priceCents) {
        const checkout = await openIndividualCheckout(result.request.id);
        if (checkout.url) window.location.assign(checkout.url);
        return;
      }
      setNotice(`${product.name} was requested. SongKeep will connect pricing or an invoice to this account.`);
    } catch (purchaseError) {
      setError(customerMessage(purchaseError, "We could not start this purchase."));
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading" || loading) return <main className={styles.shell}><p role="status">Opening SongKeep…</p></main>;
  if (status === "unavailable") return <main className={styles.shell}><section><h1>SongKeep is unavailable here.</h1><p>{configurationError}</p></section></main>;
  if (status === "signed_out" || !user) return <main className={styles.shell}><section className={styles.signedOut}><SongKeepLockup variant="full" /><p className={styles.eyebrow}>Private collection</p><h1>Sign in to continue.</h1><Link className={styles.primary} href="/login?next=%2Fmemories">Sign in</Link></section></main>;

  return <main className={styles.shell}>
    <header><Link className={styles.brand} href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link><span>Memories &amp; products</span></header>
    <section className={styles.intro}><p className={styles.eyebrow}>Your collection</p><h1>Songs worth keeping.</h1><p>Private materials and products created from experiences shared with you live here. Keepsakes from your experience that made it possible.</p></section>
    {error ? <div className={styles.alert} role="alert"><strong>Something needs attention.</strong><span>{error}</span></div> : null}
    {notice ? <div className={styles.notice} role="status"><strong>Request saved.</strong><span>{notice}</span></div> : null}
    {purchaseId ? <section className={styles.purchaseStatus} aria-labelledby="purchase-status-title">
      <p className={styles.eyebrow}>Your purchase</p>
      <h2 id="purchase-status-title">{focusedPurchase ? focusedPurchase.productName : "We are confirming your checkout."}</h2>
      <p>{focusedPurchase ? purchaseStatusCopy(focusedPurchase, paymentReturned) : "SongKeep confirms payment on this page before your song is released."}</p>
      <ol>
        <li>Use this page to see the status of this purchase.</li>
        <li>Open private materials for the experience when your payment is confirmed.</li>
      </ol>
      {focusedPurchase ? <PrivateExperienceMaterials accessId={focusedPurchase.accessId} /> : null}
    </section> : null}
    {access.length && (awaitingMessages.length || !preferences?.phone) ? <section className={styles.messageChoices} aria-label="Optional messages">
      <div><p className={styles.eyebrow}>Optional</p><h2>Messages about your purchase</h2><p>These choices are separate, and you can complete a purchase either way. SongKeep asks here only for a channel you have not already accepted.</p></div>
      {awaitingMessages.includes("email") ? <label className={styles.consentChoice}><input type="checkbox" checked={emailOptIn} onChange={(event) => setEmailOptIn(event.target.checked)} /><span>Email<small>{emailConsentCopy.language}</small></span></label> : null}
      {awaitingMessages.includes("sms") ? <label className={styles.consentChoice}><input type="checkbox" checked={smsOptIn} onChange={(event) => setSmsOptIn(event.target.checked)} /><span>Text messages<small>{smsConsentCopy.language}</small></span></label> : null}
      {!preferences?.phone ? <label className={styles.phoneField}><span>Mobile number <small>{awaitingMessages.includes("sms") ? "Needed only if you agree to text messages" : "Add a number for text delivery"}</small></span><input type="tel" value={mobilePhone} onChange={(event) => setMobilePhone(event.target.value)} autoComplete="tel" inputMode="tel" maxLength={40} /></label> : null}
    </section> : null}

    {access.length ? <section className={styles.list} aria-label="Claimed SongKeep experiences">{access.map((item) => {
      const eligibleProducts = products.filter((product) => product.audiences.includes(item.recipient));
      const itemPurchases = purchasesByAccess.get(item.id) ?? [];
      return <article className={focusedPurchase?.accessId === item.id ? `${styles.experience} ${styles.purchaseFocus}` : styles.experience} key={item.id}>
        <div className={styles.experienceHeading}>
          <div><p className={styles.eyebrow}>{item.organizationName}</p><h2>{item.experienceTitle}</h2><p>{item.participantName} · Added {formatDate(item.acceptedAt)}</p></div>
          <div className={styles.itemAction}><PrivateExperienceMaterials accessId={item.id} /></div>
        </div>

        <section className={styles.store} aria-labelledby={`store-${item.id}`}>
          <div className={styles.storeHeading}><div><p className={styles.eyebrow}>From this experience</p><h3 id={`store-${item.id}`}>Take more of the memory home.</h3></div><span>Source: {item.organizationName}</span></div>
          {eligibleProducts.length ? <div className={styles.productList}>{eligibleProducts.map((product) => {
            const existing = itemPurchases.find((purchase) => purchase.productId === product.id && !["cancelled", "refunded"].includes(purchase.status));
            return <div className={styles.product} key={product.id}>
              <div><small>{titleize(product.kind)}</small><strong>{product.name}</strong><p>{product.description}</p></div>
              <div className={styles.productAction}><b>{formatLifecycleMoney(product.priceCents)}</b>{existing && (!["invoice_requested", "payment_pending"].includes(existing.status) || !nativeCheckoutEnabled) ? <span>{titleize(existing.status)}</span> : <button type="button" disabled={busy === `${item.id}-${product.id}`} onClick={() => handlePurchase(item, product)}>{busy === `${item.id}-${product.id}` ? "Saving…" : nativeCheckoutEnabled && product.priceCents ? (existing ? "Resume payment" : "Purchase") : "Request"}</button>}</div>
            </div>;
          })}</div> : <p className={styles.quiet}>SongKeep has not released any individual products for this experience yet.</p>}
          <p className={styles.integrityNote}>A checkout return does not mark an item paid. SongKeep confirms payment before fulfillment.</p>
        </section>
      </article>;
    })}</section> : <section className={styles.empty}><h2>Nothing here yet.</h2><p>Use a private participant or family invitation after an organization experience to add memories and eligible products.</p></section>}
    <footer>Private materials only. Access and products remain subject to the participant’s permissions.</footer>
  </main>;
}
