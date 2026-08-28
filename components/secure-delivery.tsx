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

const KEEPSAKE_PRESENTATION = {
  dedication: "For someone unforgettable",
  title: "The Porch Light Stayed On",
  subtitle: "A private Honor a Life Song keepsake"
} as const;

function SafeState({ state }: { state: DeliveryResolutionState }) {
  const messages: Record<Exclude<DeliveryResolutionState, "available">, { title: string; body: string; tone: "notice" | "warning" }> = {
    invalid: { title: "This link can’t be opened.", body: "Check the original link or contact SongKeep.", tone: "warning" },
    expired: { title: "This link has expired.", body: "Ask for a new private link.", tone: "warning" },
    revoked: { title: "This link is no longer available.", body: "Contact SongKeep if you need help.", tone: "warning" },
    verification_required: { title: "Verify to continue.", body: "Confirm this keepsake was shared with you.", tone: "notice" },
    access_denied: { title: "Access unavailable.", body: "This account can’t open this keepsake.", tone: "warning" },
    consent_blocked: { title: "This keepsake is restricted.", body: "Sharing permissions have changed.", tone: "warning" },
    asset_unavailable: { title: "Still being prepared.", body: "Your files aren’t ready yet.", tone: "notice" },
    service_unavailable: { title: "Private listening is unavailable.", body: "Contact SongKeep for help.", tone: "notice" }
  };

  const message = messages[state as Exclude<DeliveryResolutionState, "available">];
  return <section className={`${styles.stateCard} ${message.tone === "warning" ? styles.warning : ""}`} role="status" aria-live="polite">
    <div className={styles.stateMark} aria-hidden="true"><span /><span /><span /><span /><span /></div>
    <p className={styles.eyebrow}>SongKeep</p>
    <h1>{message.title}</h1>
    <p>{message.body}</p>
    {state === "verification_required" ? <button className={styles.primaryAction} type="button" disabled>Verify</button> : null}
    <Link className={styles.secondaryAction} href="/">Home</Link>
  </section>;
}

function assetIsAuthorized(asset: DeliveryAssetGrant, authorizedAssetIds: string[]) {
  return authorizedAssetIds.includes(asset.id);
}

function PrivateSongPage({ context }: { context: DeliveryAccessContext }) {
  const resolution = resolveDeliveryAccess(context);
  const audio = context.assets.find((asset) => asset.kind === "final_audio" && assetIsAuthorized(asset, resolution.authorizedAssetIds));
  const lyrics = context.assets.find((asset) => asset.kind === "approved_lyrics" && assetIsAuthorized(asset, resolution.authorizedAssetIds));
  const approvedStoryAssets = context.assets.filter((asset) => (asset.kind === "approved_photo" || asset.kind === "approved_story") && assetIsAuthorized(asset, resolution.authorizedAssetIds));
  const downloadableAssets = context.assets.filter((asset) => assetIsAuthorized(asset, resolution.authorizedAssetIds) && asset.actions.includes("download"));
  const shareDecision = canUseControlledSharing(context);

  return <article className={styles.keepsake}>
    <header className={styles.releaseHero}>
      <div className={styles.albumArtwork} aria-label="Song artwork">
        <div className={styles.artworkGlow} />
        <div className={styles.artworkWave} aria-hidden="true">{Array.from({ length: 17 }, (_, index) => <span key={index} />)}</div>
        <span className={styles.artworkLabel}>SongKeep</span>
      </div>

      <div className={styles.releaseCopy}>
        <span className={styles.privateBadge}>Private keepsake</span>
        <p className={styles.dedication}>{KEEPSAKE_PRESENTATION.dedication}</p>
        <h1>{KEEPSAKE_PRESENTATION.title}</h1>
        <p className={styles.releaseSubtitle}>{KEEPSAKE_PRESENTATION.subtitle}</p>

        <section className={styles.listenHero} id="listen" aria-labelledby="listen-heading">
          <div className={styles.playerTopline}>
            <button type="button" disabled aria-describedby="listen-service-note" aria-label={`Play ${KEEPSAKE_PRESENTATION.title}`}><span aria-hidden="true">▶</span></button>
            <div><h2 id="listen-heading">Listen</h2><p>{audio?.label ?? "Recording not ready"}</p></div>
          </div>
          <div className={styles.playerWave} aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <span key={index} />)}</div>
          <div className={styles.playerTime}><span>0:00</span><span>Private recording</span><span>—:—</span></div>
          <p className={styles.serviceNote} id="listen-service-note">Online playback isn’t available yet.</p>
        </section>
      </div>
    </header>

    {context.entryMechanism === "qr" ? <div className={styles.qrNotice} role="note"><strong>Opened from your keepsake</strong></div> : null}

    <nav className={styles.sectionNav} aria-label="Private song page sections">
      {privateSongSections.map((section) => <a key={section} href={`#${section.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`}>{section}</a>)}
    </nav>

    <div className={styles.keepsakeBody}>
      <section className={styles.lyricsFeature} id="lyrics" aria-labelledby="lyrics-heading">
        <p className={styles.eyebrow}>Words</p>
        <h2 id="lyrics-heading">Lyrics</h2>
        {lyrics ? <div className={styles.lyricPaper}><span>{lyrics.label}</span><div className={styles.lyricLines} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></div> : <p className={styles.empty}>Not included.</p>}
      </section>

      <section className={styles.storyFeature} id="photos-approved-story" aria-labelledby="story-heading">
        <div className={styles.storyArtwork} aria-hidden="true"><span>Story</span></div>
        <div><p className={styles.eyebrow}>Behind the song</p><h2 id="story-heading">Photos &amp; Story</h2>{approvedStoryAssets.length > 0 ? <div className={styles.assetChips}>{approvedStoryAssets.map((asset) => <span key={asset.id}>{asset.label}</span>)}</div> : <p className={styles.empty}>Not included.</p>}</div>
      </section>

      <section className={styles.actionsFeature} aria-label="Keepsake actions">
        <section id="download" aria-labelledby="download-heading">
          <p className={styles.eyebrow}>Keep</p>
          <h2 id="download-heading">Download</h2>
          <div className={styles.actionList}>{downloadableAssets.map((asset) => {
            const decision = authorizeDeliveryAsset(context, { deliveryId: context.deliveryId, assetId: asset.id, action: "download" });
            return <button type="button" disabled key={asset.id}><span>↓</span><strong>{asset.label}</strong><small>{decision.allowed ? "Coming soon" : "Unavailable"}</small></button>;
          })}</div>
        </section>

        <section id="share-controls" aria-labelledby="share-heading">
          <p className={styles.eyebrow}>Share</p>
          <h2 id="share-heading">Share Privately</h2>
          <button className={styles.shareButton} type="button" disabled><span>↗</span><strong>Share</strong><small>{shareDecision.allowed ? "Coming soon" : "Unavailable"}</small></button>
        </section>
      </section>
    </div>

    <section className={styles.confirmation} aria-labelledby="confirmation-heading">
      <div><p className={styles.eyebrow}>Received</p><h2 id="confirmation-heading">Received with care.</h2></div>
      <button type="button" disabled={!secureDeliveryServiceAvailability.confirmationPersistence}>Confirm</button>
    </section>

    <footer className={styles.deliveryFooter}><span>SongKeep</span><span>Made from a story. Kept as a song.</span></footer>
  </article>;
}

export function SecureDelivery({ context }: { context: DeliveryAccessContext }) {
  const resolution = resolveDeliveryAccess(context);
  return <main className={styles.deliveryShell}>
    <div className={styles.brandRow}><Link className={styles.brand} href="/">SongKeep</Link><span>Private listening</span></div>
    {resolution.state === "available" ? <PrivateSongPage context={context} /> : <SafeState state={resolution.state} />}
  </main>;
}
