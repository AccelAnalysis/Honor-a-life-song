"use client";

import { useRef, useState } from "react";
import styles from "./sonic-signature.module.css";

interface SonicSignatureProps {
  compact?: boolean;
  label?: string;
  inverse?: boolean;
}

const NOTES = [
  { frequency: 261.63, offset: 0, duration: 1.15, gain: 0.16 },
  { frequency: 329.63, offset: 0.42, duration: 1.25, gain: 0.13 },
  { frequency: 392, offset: 0.88, duration: 1.45, gain: 0.12 },
  { frequency: 523.25, offset: 1.48, duration: 1.75, gain: 0.1 }
] as const;

function scheduleVoice(context: AudioContext, frequency: number, start: number, duration: number, peakGain: number) {
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(frequency * 2, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1900, start);
  filter.Q.setValueAtTime(0.7, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.045);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  overtone.start(start);
  oscillator.stop(start + duration + 0.05);
  overtone.stop(start + duration + 0.05);
}

export function SonicSignature({ compact = false, label = "Hear the Honor a Life Song sound", inverse = false }: SonicSignatureProps) {
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  async function playSignature() {
    if (playing) return;

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      setUnsupported(true);
      return;
    }

    const context = contextRef.current ?? new AudioContextConstructor();
    contextRef.current = context;

    if (context.state === "suspended") await context.resume();

    const now = context.currentTime + 0.05;
    NOTES.forEach((note) => scheduleVoice(context, note.frequency, now + note.offset, note.duration, note.gain));

    setPlaying(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPlaying(false), 3500);
  }

  return (
    <div className={`${styles.signature} ${compact ? styles.compact : ""} ${inverse ? styles.inverse : ""}`}>
      <button type="button" onClick={playSignature} aria-pressed={playing} disabled={playing}>
        <span className={styles.playIcon} aria-hidden="true">{playing ? "♪" : "▶"}</span>
        <span>{playing ? "Listening…" : label}</span>
      </button>
      <div className={`${styles.pulse} ${playing ? styles.pulseActive : ""}`} aria-hidden="true">
        {[0.35, 0.62, 0.9, 0.5, 0.78, 0.42, 0.68, 0.3].map((height, index) => (
          <span key={index} style={{ height: `${Math.round(height * 100)}%` }} />
        ))}
      </div>
      {unsupported ? <span className={styles.fallback} role="status">Audio preview is not supported in this browser.</span> : null}
    </div>
  );
}
