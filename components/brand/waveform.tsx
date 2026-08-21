import styles from "./brand-sensory.module.css";

const SHAPE = [
  0.28, 0.5, 0.72, 0.42, 0.88, 0.56, 0.34, 0.66,
  0.92, 0.48, 0.74, 0.38, 0.58, 0.84, 0.46, 0.7,
  0.32, 0.6, 0.9, 0.52, 0.78, 0.4, 0.64, 0.3
] as const;

export function Waveform({ progress = 0 }: { progress?: number }) {
  const normalized = Math.max(0, Math.min(1, progress));
  const activeCount = Math.round(normalized * SHAPE.length);

  return (
    <div className={styles.waveform} aria-hidden="true">
      {SHAPE.map((height, index) => (
        <span
          // The stable index is intentional: SHAPE is a fixed visual token.
          key={index}
          className={`${styles.waveBar} ${index < activeCount ? styles.waveBarActive : ""}`}
          style={{ height: `${Math.round(height * 100)}%` }}
        />
      ))}
    </div>
  );
}
