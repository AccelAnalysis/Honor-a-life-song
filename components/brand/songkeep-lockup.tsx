import styles from "./songkeep-lockup.module.css";

type SongKeepLockupProps = {
  variant?: "mark" | "app" | "full";
  inverse?: boolean;
  className?: string;
};

export function SongKeepLockup({ variant = "app", inverse = false, className }: SongKeepLockupProps) {
  const classes = [styles.lockup, styles[variant], inverse ? styles.inverse : "", className ?? ""].filter(Boolean).join(" ");
  const label = variant === "full" ? "SongKeep — Your Story. Your Song. Always." : "SongKeep";

  return (
    <span className={classes} aria-label={label}>
      <svg className={styles.mark} viewBox="0 0 72 72" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="songkeep-mark-gradient" x1="8" y1="14" x2="64" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#D53FA3" />
            <stop offset="0.38" stopColor="#834AB4" />
            <stop offset="0.68" stopColor="#4858BE" />
            <stop offset="1" stopColor="#1C8BD3" />
          </linearGradient>
        </defs>
        <path
          d="M35.6 61.4C22.2 51.8 10.8 43.4 8.8 31.2C7.2 21.6 12.8 14.1 21.4 13.4C27.3 12.9 31.7 15.6 35.1 20.4"
          fill="none"
          stroke="url(#songkeep-mark-gradient)"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M36 21.1V10.6C36 8.1 38.8 7 40.4 9C43.2 12.5 45.9 14.2 50.7 16.2C58.8 19.5 62.6 24.6 62.6 31.7C62.6 35 61.8 37.8 60.8 39.8"
          fill="none"
          stroke="url(#songkeep-mark-gradient)"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M36 21V41.2C36 48 31.3 52.3 25.7 52.3C20.9 52.3 17.4 49.5 17.4 45.6C17.4 41.6 21.2 38.8 26.2 38.8C30 38.8 33.2 40.1 36 42.1"
          fill="none"
          stroke="url(#songkeep-mark-gradient)"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M60.7 39.8C58.4 47.5 49.1 54.4 35.6 61.4"
          fill="none"
          stroke="#1572C6"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50.7" cy="47.7" r="3.5" fill="#141648" />
        <path d="M48.9 51.1H52.5L54 58H47.4L48.9 51.1Z" fill="#141648" />
      </svg>

      {variant !== "mark" ? (
        <span className={styles.words} aria-hidden="true">
          <span className={styles.wordmark}><span>Song</span><span>Keep</span></span>
          {variant === "full" ? (
            <span className={styles.tagline}><span>Your Story.</span> <em>Your Song.</em> <span>Always.</span></span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
