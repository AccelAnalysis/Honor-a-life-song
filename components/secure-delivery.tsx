import Link from "next/link";
import {
  authorizeDeliveryAsset,
  canUseControlledSharing,
  privateSongSections,
  resolveDeliveryAccess,
  type DeliveryAccessContext,
  type DeliveryAssetGrant,
  type DeliveryResolutionState
} from "@/domain/delivery";
import { secureDeliveryServiceAvailability } from "@/services/secure-delivery";
import styles from "./secure-delivery.module.css";

function SafeState({ state }: { state: DeliveryResolutionState }) {
  const messages: Record<Exclude<DeliveryResolutionState, "available">, { title: string; body: string; tone: "notice" | "warning" }> = {
    invalid: {
      title: "This delivery link cannot be opened",
      body: "The secure link is not valid. Check the original delivery message or contact Honor a Life Song for help.",
      tone: "warning"
    },
    expired: {
      title: "This delivery link is no longer available",
      body: "Protected files cannot be played or downloaded from this link. An authorized team member can help with next steps.",
      tone: "warning"
    },
    revoked: {
      title: "This delivery link is no longer available",
      body: "Protected files cannot be played or downloaded from this link. An authorized team member can help with next steps.",
      tone: "warning"
    },
    verification_required: {
      title: "Verify access to continue",
      body: "This delivery requires recipient verification before any private song or keepsake material can be shown.",
      tone: "notice"
    },
    access_denied: {
      title: "This delivery cannot be opened",
      body: "Access is not available for this delivery context. No protected song or participant information has been displayed.",
      tone: "warning"
    },
    consent_blocked: {
      title: "This delivery is currently restricted",
      body: "Current permissions do not allow the requested private delivery use. Protected content remains unavailable.",
      tone: "warning"
    },
    asset_unavailable: {
      title: "Approved delivery files are not available",
      body: "The secure delivery record resolved, but there are no approved final assets available for this recipient.",
      tone: "notice"
    },
    service_unavailable: {
      title: "Secure delivery is not connected yet",
      body: "The production token, entitlement, media-authorization, and audit services are not connected in this chassis environment. No access decision has been simulated.",
      tone: "notice"
    }
  };

  const message = messages[state as Exclude<DeliveryResolutionState, "available">];
  return (
    <section className={`${styles.stateCard} ${message.tone === "warning" ? styles.warning : ""}`} role="status" aria-live="polite">
      <p className={styles.eyebrow}>Secure Delivery</p>
      <h1>{message.title}</h1>
      <p>{message.body}</p>
      {state === "verification_required" && (
        <div className={styles.integrationNote}>
          <strong>Access Verification workflow</strong>
          <span>Identity/recipient verification is a shared service boundary and is not production-connected here. Verification must be followed by fresh token, entitlement, consent, and asset checks.</span>
        </div>
      )}
      <Link className={styles.secondaryAction} href="/">Return to Honor a Life Song</Link>
    </section>
  );
}

function assetIsAuthorized(asset: DeliveryAssetGrant, authorizedAssetIds: string[]) {
  return authorizedAssetIds.includes(asset.id);
}

function PrivateSongPage({ context }: { context: DeliveryAccessContext }) {
  const resolution = resolveDeliveryAccess(context);
  const audio = context.assets.find((asset) => asset.kind === "final_audio" && assetIsAuthorized(asset, resolution.authorizedAssetIds));
  const lyrics = context.assets.find((asset) => asset.kind === "approved_lyrics" && assetIsAuthorized(asset, resolution.authorizedAssetIds));
  const approvedStoryAssets = context.assets.filter(
    (asset) => (asset.kind === "approved_photo" || asset.kind === "approved_story") && assetIsAuthorized(asset, resolution.authorizedAssetIds)
  );
  const downloadableAssets = context.assets.filter(
    (asset) => assetIsAuthorized(asset, resolution.authorizedAssetIds) && asset.actions.includes("download")
  );
  const shareDecision = canUseControlledSharing(context);

  return (
    <article className={styles.keepsake}>
      <header className={styles.keepsakeHeader}>
        <div>
          <p className={styles.eyebrow}>Private Song Page · Reference Chassis</p>
          <h1>Your Honor a Life Song keepsake</h1>
          <p className={styles.lede}>A private presentation surface for approved final song and keepsake assets. This reference view contains no production participant or media data.</p>
        </div>
        <span className={styles.privateBadge}>Private delivery</span>
      </header>

      {context.entryMechanism === "qr" && (
        <div className={styles.qrNotice} role="note">
          <strong>QR Keepsake entry · P1 structural preview</strong>
          <span>The QR code is only an entry mechanism. It resolves into this same secure route and never bypasses token, entitlement, consent, or asset authorization.</span>
        </div>
      )}

      <nav className={styles.sectionNav} aria-label="Private song page sections">
        {privateSongSections.map((section) => <a key={section} href={`#${section.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`}>{section}</a>)}
      </nav>

      <section className={styles.featureCard} id="listen" aria-labelledby="listen-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.step}>01</p>
          <div><h2 id="listen-heading">Listen</h2><p>Approved final audio only.</p></div>
        </div>
        {audio ? (
          <div className={styles.mediaPlaceholder}>
            <div>
              <strong>{audio.label}</strong>
              <span>Final recording approval is referenced; the storage key is never exposed.</span>
            </div>
            <button type="button" disabled aria-describedby="listen-service-note">Play</button>
          </div>
        ) : <p className={styles.empty}>No authorized final audio is included in this delivery.</p>}
        <p className={styles.serviceNote} id="listen-service-note">Playback remains disabled until the secure media service can issue short-lived, recipient-authorized access.</p>
      </section>

      <section className={styles.featureCard} id="download" aria-labelledby="download-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.step}>02</p>
          <div><h2 id="download-heading">Download</h2><p>Each file is re-authorized against this delivery before access.</p></div>
        </div>
        <div className={styles.assetList}>
          {downloadableAssets.map((asset) => {
            const decision = authorizeDeliveryAsset(context, { deliveryId: context.deliveryId, assetId: asset.id, action: "download" });
            return (
              <div className={styles.assetRow} key={asset.id}>
                <div><strong>{asset.label}</strong><span>{decision.allowed ? "Eligible for secure delivery authorization" : "Unavailable"}</span></div>
                <button type="button" disabled>Download</button>
              </div>
            );
          })}
        </div>
        <p className={styles.serviceNote}>No permanent public URL is generated. Download and audit persistence remain unavailable until their production adapters are connected.</p>
      </section>

      <section className={styles.featureCard} id="lyrics" aria-labelledby="lyrics-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.step}>03</p>
          <div><h2 id="lyrics-heading">Lyrics</h2><p>Recipient-facing approved version only.</p></div>
        </div>
        {lyrics ? (
          <div className={styles.approvedPanel}>
            <span>Approved version</span>
            <strong>{lyrics.label}</strong>
            <p>Drafts, review comments, comparison views, and rejected versions remain in the creator/customer workflows and are not exposed here.</p>
          </div>
        ) : <p className={styles.empty}>Approved lyrics are not included in this delivery package.</p>}
      </section>

      <section className={styles.featureCard} id="photos-approved-story" aria-labelledby="story-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.step}>04</p>
          <div><h2 id="story-heading">Photos / Approved Story</h2><p>Only the explicitly approved keepsake subset.</p></div>
        </div>
        {approvedStoryAssets.length > 0 ? (
          <div className={styles.assetList}>
            {approvedStoryAssets.map((asset) => <div className={styles.assetRow} key={asset.id}><div><strong>{asset.label}</strong><span>Approved final keepsake selection</span></div><span className={styles.included}>Included</span></div>)}
          </div>
        ) : <p className={styles.empty}>No approved photo or story material is included in this delivery.</p>}
        <p className={styles.serviceNote}>Source interviews, family submissions, private notes, and other unapproved materials are intentionally excluded.</p>
      </section>

      <section className={styles.featureCard} id="share-controls" aria-labelledby="share-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.step}>05</p>
          <div><h2 id="share-heading">Share Controls</h2><p>Controlled sharing is separate from public marketing permission.</p></div>
        </div>
        <div className={styles.assetRow}>
          <div><strong>Controlled family sharing</strong><span>{shareDecision.allowed ? "Consent/policy gate satisfied; share-link service still required." : "Not authorized for this delivery."}</span></div>
          <button type="button" disabled>Create controlled access</button>
        </div>
        <p className={styles.serviceNote}>No social publishing, public embed, open forwarding, or public tribute link is created by this surface.</p>
      </section>

      <section className={styles.confirmation} aria-labelledby="confirmation-heading">
        <div>
          <p className={styles.eyebrow}>Delivery Confirmation</p>
          <h2 id="confirmation-heading">Confirm receipt when authoritative persistence is connected</h2>
          <p>Opening this page does not mark the song journey Delivered or Closed. Confirmation is a separate delivery event governed by the workflow and audit boundaries.</p>
        </div>
        <button type="button" disabled={!secureDeliveryServiceAvailability.confirmationPersistence}>Confirm delivery</button>
      </section>

      <footer className={styles.deliveryFooter}>
        <span>Secure Delivery reference mode</span>
        <span>Token values, storage keys, and internal authorization details are not displayed.</span>
      </footer>
    </article>
  );
}

export function SecureDelivery({ context }: { context: DeliveryAccessContext }) {
  const resolution = resolveDeliveryAccess(context);
  return (
    <main className={styles.deliveryShell}>
      <div className={styles.brandRow}><Link className={styles.brand} href="/">Honor a Life Song</Link><span>Secure Keepsake</span></div>
      {resolution.state === "available" ? <PrivateSongPage context={context} /> : <SafeState state={resolution.state} />}
    </main>
  );
}
