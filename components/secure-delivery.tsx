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
    invalid: {
      title: "This delivery link cannot be opened",
      body: "Check the original message or contact Honor a Life Song for help opening this private keepsake.",
      tone: "warning"
    },
    expired: {
      title: "This private song link has expired",
      body: "The song and keepsake files remain protected. An authorized team member can help create a new way to enter.",
      tone: "warning"
    },
    revoked: {
      title: "This private song link is no longer available",
      body: "The song and keepsake files remain protected. Contact Honor a Life Song if you believe you should still have access.",
      tone: "warning"
    },
    verification_required: {
      title: "A quick verification will open this song",
      body: "Confirm that this keepsake was shared with you before any private music, lyrics, or photographs appear.",
      tone: "notice"
    },
    access_denied: {
      title: "This delivery cannot be opened",
      body: "This account does not currently have access. No private song or participant information has been displayed.",
      tone: "warning"
    },
    consent_blocked: {
      title: "This delivery is currently restricted",
      body: "The permissions for this private keepsake have changed, so the song and related materials remain unavailable.",
      tone: "warning"
    },
    asset_unavailable: {
      title: "This keepsake is still being prepared",
      body: "There are no final song or keepsake files ready to share here yet.",
      tone: "notice"
    },
    service_unavailable: {
      title: "Private listening isn’t available yet",
      body: "Contact Honor a Life Song if you need help accessing a finished song or keepsake.",
      tone: "notice"
    }
  };

  const message = messages[state as Exclude<DeliveryResolutionState, "available">];
  return (
    <section className={`${styles.stateCard} ${message.tone === "warning" ? styles.warning : ""}`} role="status" aria-live="polite">
      <div className={styles.stateMark} aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <p className={styles.eyebrow}>Honor a Life Song</p>
      <h1>{message.title}</h1>
      <p>{message.body}</p>
      {state === "verification_required" ? <button className={styles.primaryAction} type="button" disabled>Verify access</button> : null}
      <Link className={styles.secondaryAction} href="/">Return home</Link>
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
      <header className={styles.releaseHero}>
        <div className={styles.albumArtwork} aria-label="Song artwork">
          <div className={styles.artworkGlow} />
          <div className={styles.artworkWave} aria-hidden="true">{Array.from({ length: 17 }, (_, index) => <span key={index} />)}</div>
          <span className={styles.artworkLabel}>Honor a Life Song</span>
        </div>

        <div className={styles.releaseCopy}>
          <span className={styles.privateBadge}>Private keepsake</span>
          <p className={styles.dedication}>{KEEPSAKE_PRESENTATION.dedication}</p>
          <h1>{KEEPSAKE_PRESENTATION.title}</h1>
          <p className={styles.releaseSubtitle}>{KEEPSAKE_PRESENTATION.subtitle}</p>

          <section className={styles.listenHero} id="listen" aria-labelledby="listen-heading">
            <div className={styles.playerTopline}>
              <button type="button" disabled aria-describedby="listen-service-note" aria-label={`Play ${KEEPSAKE_PRESENTATION.title}`}>
                <span aria-hidden="true">▶</span>
              </button>
              <div>
                <h2 id="listen-heading">Listen</h2>
                <p>{audio?.label ?? "The final recording is not included here yet"}</p>
              </div>
            </div>
            <div className={styles.playerWave} aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <span key={index} />)}</div>
            <div className={styles.playerTime}><span>0:00</span><span>Private final recording</span><span>—:—</span></div>
            <p className={styles.serviceNote} id="listen-service-note">This recording isn’t available to play online yet.</p>
          </section>
        </div>
      </header>

      {context.entryMechanism === "qr" ? (
        <div className={styles.qrNotice} role="note"><strong>Opened from a keepsake QR code</strong><span>This QR code opens the same private song page.</span></div>
      ) : null}

      <nav className={styles.sectionNav} aria-label="Private song page sections">
        {privateSongSections.map((section) => <a key={section} href={`#${section.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`}>{section}</a>)}
      </nav>

      <div className={styles.keepsakeBody}>
        <section className={styles.lyricsFeature} id="lyrics" aria-labelledby="lyrics-heading">
          <p className={styles.eyebrow}>The words</p>
          <h2 id="lyrics-heading">Lyrics</h2>
          {lyrics ? (
            <div className={styles.lyricPaper}>
              <span>{lyrics.label}</span>
              <div className={styles.lyricLines} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
              <p>Your lyric sheet is part of this private keepsake.</p>
            </div>
          ) : <p className={styles.empty}>Lyrics are not included in this delivery.</p>}
        </section>

        <section className={styles.storyFeature} id="photos-approved-story" aria-labelledby="story-heading">
          <div className={styles.storyArtwork} aria-hidden="true"><span>Story</span></div>
          <div>
            <p className={styles.eyebrow}>Behind the song</p>
            <h2 id="story-heading">Photos & Story</h2>
            {approvedStoryAssets.length > 0 ? (
              <div className={styles.assetChips}>{approvedStoryAssets.map((asset) => <span key={asset.id}>{asset.label}</span>)}</div>
            ) : <p className={styles.empty}>No photos or story details are included in this delivery.</p>}
            <p>Only the photos and story details chosen for this keepsake appear here.</p>
          </div>
        </section>

        <section className={styles.actionsFeature} aria-label="Keepsake actions">
          <section id="download" aria-labelledby="download-heading">
            <p className={styles.eyebrow}>Keep it close</p>
            <h2 id="download-heading">Download</h2>
            <div className={styles.actionList}>
              {downloadableAssets.map((asset) => {
                const decision = authorizeDeliveryAsset(context, { deliveryId: context.deliveryId, assetId: asset.id, action: "download" });
                return <button type="button" disabled key={asset.id}><span>↓</span><strong>{asset.label}</strong><small>{decision.allowed ? "Download will be available here" : "Unavailable"}</small></button>;
              })}
            </div>
          </section>

          <section id="share-controls" aria-labelledby="share-heading">
            <p className={styles.eyebrow}>Invite someone in</p>
            <h2 id="share-heading">Share Privately</h2>
            <button className={styles.shareButton} type="button" disabled><span>↗</span><strong>Share privately</strong><small>{shareDecision.allowed ? "Private sharing will be available here" : "Sharing isn’t available for this delivery"}</small></button>
            <p className={styles.serviceNote}>Sharing a private keepsake does not make it public.</p>
          </section>
        </section>
      </div>

      <section className={styles.confirmation} aria-labelledby="confirmation-heading">
        <div>
          <p className={styles.eyebrow}>Delivery Confirmation</p>
          <h2 id="confirmation-heading">Received with care.</h2>
          <p>Confirming receipt lets Honor a Life Song know your keepsake arrived safely.</p>
        </div>
        <button type="button" disabled={!secureDeliveryServiceAvailability.confirmationPersistence}>Confirm receipt</button>
      </section>

      <footer className={styles.deliveryFooter}><span>Honor a Life Song</span><span>Made from a story. Kept as a song.</span></footer>
    </article>
  );
}

export function SecureDelivery({ context }: { context: DeliveryAccessContext }) {
  const resolution = resolveDeliveryAccess(context);
  return (
    <main className={styles.deliveryShell}>
      <div className={styles.brandRow}><Link className={styles.brand} href="/">Honor a Life Song</Link><span>Private listening</span></div>
      {resolution.state === "available" ? <PrivateSongPage context={context} /> : <SafeState state={resolution.state} />}
    </main>
  );
}
