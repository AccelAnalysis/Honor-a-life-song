"use client";

import { useEffect, useRef } from "react";
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
  const playingRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);

  function showPlaying(active: boolean) {
    playingRef.current = active;

    if (buttonRef.current) {
      buttonRef.current.disabled = active;
      buttonRef.current.setAttribute("aria-pressed", String(active));
    }
    if (iconRef.current) iconRef.current.textContent = active ? "♪" : "▶";
    if (labelRef.current) labelRef.current.textContent = active ? "Listening…" : label;
    pulseRef.current?.classList.toggle(styles.pulseActive, active);
  }

  function announce(message = "") {
    if (statusRef.current) statusRef.current.textContent = message;
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void contextRef.current?.close();
  }, []);

  async function playSignature() {
    if (playingRef.current) return;

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      announce("Audio preview could not be played in this browser.");
      return;
    }

    announce();
    showPlaying(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => showPlaying(false), 3500);

    try {
      const context = contextRef.current ?? new AudioContextConstructor();
      contextRef.current = context;

      if (context.state === "suspended") await context.resume();

      const now = context.currentTime + 0.05;
      NOTES.forEach((note) => scheduleVoice(context, note.frequency, now + note.offset, note.duration, note.gain));
    } catch {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      showPlaying(false);
      announce("Audio preview could not be played in this browser.");
    }
  }

  return (
    <div className={`${styles.signature} ${compact ? styles.compact : ""} ${inverse ? styles.inverse : ""}`}>
      <button ref={buttonRef} type="button" onClick={playSignature} aria-pressed="false">
        <span ref={iconRef} className={styles.playIcon} aria-hidden="true">▶</span>
        <span ref={labelRef}>{label}</span>
      </button>
      <div ref={pulseRef} className={styles.pulse} aria-hidden="true">
        {[0.35, 0.62, 0.9, 0.5, 0.78, 0.42, 0.68, 0.3].map((height, index) => (
          <span key={index} style={{ height: `${Math.round(height * 100)}%` }} />
        ))}
      </div>
      <span ref={statusRef} className={styles.fallback} role="status" aria-live="polite" />
    </div>
  );
}
