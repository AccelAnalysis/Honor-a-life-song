"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { SongKeepLockup } from "@/components/brand";
import type { UserExperienceAccess } from "@/domain/organization-account";
import {
  buildPostExperiencePaymentLink,
  postExperienceProducts,
  type PostExperienceProductId
} from "@/domain/post-experience";
import { createPostExperiencePurchaseIntent } from "@/lib/firebase/post-experience";
import { listUserExperienceAccess } from "@/lib/firebase/organization-invitations";
import styles from "./post-experience-storefront.module.css";

const referenceAccess: UserExperienceAccess = {
  id: "reference-access",
  organizationId: "reference-organization",
  organizationName: "Your Organization",
  experienceId: "reference-experience",
  experienceTitle: "Honor a Life Song Experience",
  participantId: "reference-participant",
  participantName: "Your participant",
  recipient: "participant",
  entitlementIds: ["reference-song", "reference-lyrics"],
  acceptedAt: new Date().toISOString()
};

export function PostExperienceStorefront() {
  const searchParams = useSearchParams();
  const { user, status, configurationError } = useAuth();
  const isStaticPreview = process.env.NEXT_PUBLIC_HALS_STATIC_PREVIEW === "1";
  const requestedAccessId = searchParams.get("access");
  const [accessItems, setAccessItems] = useState<UserExperienceAccess[]>(isStaticPreview ? [referenceAccess] : []);
  const [loading, setLoading] = useState(!isStaticPreview);
  const [busyProduct, setBusyProduct] = useState<PostExperienceProductId | null>(null);
  const [requestedProduct, setRequestedProduct] = useState<PostExperienceProductId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaticPreview) return;
    if (!user) {
      setLoading(status === "loading");
      return;
    }
    let cancelled = false;
    setLoading(true);
    listUserExperienceAccess(user.uid)
      .then((items) => { if (!cancelled) setAccessItems(items); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this experience."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isStaticPreview, status, user]);

  const selectedAccess = useMemo(
    () => accessItems.find((item) => item.id === requestedAccessId) ?? accessItems[0],
    [accessItems, requestedAccessId]
  );

  async function startPurchase(productId: PostExperienceProductId) {
    if (!selectedAccess) return;
    setBusyProduct(productId);
    setError(null);
    try {
      if (isStaticPreview) {
        setRequestedProduct(productId);
        return;
      }
      if (!user) throw new Error("Sign in to continue.");
      const purchaseIntentId = await createPostExperiencePurchaseIntent({
        userId: user.uid,
        access: selectedAccess,
        productId
      });
      const paymentLink = buildPostExperiencePaymentLink({
        productId,
        purchaseIntentId,
        customerEmail: user.email ?? undefined
      });
      if (paymentLink) {
        window.location.assign(paymentLink);
        return;
      }
      setRequestedProduct(productId);
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "We could not start this purchase.");
    } finally {
      setBusyProduct(null);
    }
  }

  if (!isStaticPreview && (status === "loading" || loading)) return <main className={styles.centered}><p>Opening your SongKeep collection…</p></main>;
  if (!isStaticPreview && status === "unavailable") return <main className={styles.centered}><section><h1>SongKeep is unavailable here.</h1><p>{configurationError}</p></section></main>;
  if (!isStaticPreview && (status === "signed_out" || !user)) return <main className={styles.centered}><section><SongKeepLockup variant="full" /><h1>Sign in to continue.</h1><Link className={styles.primaryAction} href={`/login?next=${encodeURIComponent(`/memories/store${requestedAccessId ? `?access=${requestedAccessId}` : ""}`)}`}>Sign in</Link></section></main>;
  if (!selectedAccess) return <main className={styles.centered}><section><h1>No experience is available.</h1><p>Claim a private SongKeep invitation before purchasing products from an organization event.</p><Link className={styles.primaryAction} href="/memories">Back to memories</Link></section></main>;

  const requested = requestedProduct ? postExperienceProducts.find((product) => product.id === requestedProduct) : undefined;

  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link href="/" aria-label="SongKeep home"><SongKeepLockup variant="app" /></Link>
      <Link className={styles.backLink} href="/memories">My memories</Link>
    </header>

    <section className={styles.hero} aria-labelledby="store-title">
      <p className={styles.eyebrow}>{selectedAccess.organizationName}</p>
      <h1 id="store-title">Take the experience with you.</h1>
      <p>Products here come from <strong>{selectedAccess.experienceTitle}</strong> and remain connected to {selectedAccess.participantName}’s approved access.</p>
    </section>

    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {requested ? <section className={styles.confirmation} role="status">
      <div><p className={styles.eyebrow}>Request received</p><h2>{requested.name}</h2><p>SongKeep will confirm the released materials, price, and secure payment or fulfillment details. This request remains attributed to the organization experience.</p></div>
      <button type="button" onClick={() => setRequestedProduct(null)}>Choose another product</button>
    </section> : null}

    <section className={styles.products} aria-label="Products from this experience">
      {postExperienceProducts.map((product) => <article key={product.id}>
        <div>
          <p className={styles.productType}>From your experience</p>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <ul>{product.includes.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className={styles.productAction}>
          <span>Price confirmed before payment</span>
          <button type="button" disabled={busyProduct !== null || selectedAccess.entitlementIds.length === 0} onClick={() => startPurchase(product.id)}>
            {busyProduct === product.id ? "Starting…" : "Request this product"}
          </button>
        </div>
      </article>)}
    </section>

    <aside className={styles.permissionNote}>
      <strong>Access follows permission.</strong>
      <p>Purchasing a product does not expand who may see, download, perform, or publicly share the underlying song, story, photo, or video.</p>
    </aside>
  </main>;
}
