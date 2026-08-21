"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioContextVariant, AudioEntitlementModel, AudioPlayerState, TrackMetadataModel } from "@/lib/brand-sensory.types";
import { audioRestrictionMessage, canPlayAudio } from "@/lib/media-presentation";
import { TrackMetadata } from "./track-metadata";
import { Waveform } from "./waveform";
import styles from "./brand-sensory.module.css";

interface AudioPlayerProps {
  src?: string;
  metadata: TrackMetadataModel;
  entitlement: AudioEntitlementModel;
  variant?: AudioContextVariant;
  compact?: boolean;
  previewEndSeconds?: number;
  onStateChange?: (state: AudioPlayerState) => void;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function AudioPlayer({
  src,
  metadata,
  entitlement,
  variant = "customer-final",
  compact = false,
  previewEndSeconds,
  onStateChange
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>(src ? "idle" : "unavailable");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const permitted = canPlayAudio(entitlement);
  const restriction = audioRestrictionMessage(entitlement);
  const effectiveDuration = previewEndSeconds && duration
    ? Math.min(duration, previewEndSeconds)
    : duration;
  const progress = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;

  function transition(nextState: AudioPlayerState) {
    setState(nextState);
    onStateChange?.(nextState);
  }

  useEffect(() => {
    if (!permitted) transition("restricted");
    else if (!src) transition("unavailable");
    // onStateChange is intentionally not a dependency: consumers should not cause
    // player state resets by recreating a callback during render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitted, src]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !permitted) return;

    try {
      if (audio.paused) {
        transition("loading");
        await audio.play();
        transition("playing");
      } else {
        audio.pause();
        transition("paused");
      }
    } catch {
      transition("error");
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || effectiveDuration <= 0) return;
    const next = Math.max(0, Math.min(value, effectiveDuration));
    audio.currentTime = next;
    setCurrentTime(next);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = audio.currentTime;

    if (previewEndSeconds && next >= previewEndSeconds) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      transition("ended");
      return;
    }

    setCurrentTime(next);
  }

  const disabled = !src || !permitted;
  const label = state === "playing" ? `Pause ${metadata.title}` : `Play ${metadata.title}`;

  return (
    <section
      className={`${styles.player} ${compact ? styles.compactPlayer : ""}`}
      data-audio-variant={variant}
      aria-label={`${metadata.title} audio player`}
    >
      <audio
        ref={audioRef}
        src={permitted ? src : undefined}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
          transition("ready");
        }}
        onTimeUpdate={handleTimeUpdate}
        onPause={() => state === "playing" && transition("paused")}
        onEnded={() => transition("ended")}
        onError={() => transition("error")}
      />

      <TrackMetadata metadata={metadata} />
      <Waveform progress={progress} />

      <div className={styles.controls}>
        <button className={styles.playButton} type="button" onClick={togglePlayback} disabled={disabled} aria-label={label}>
          {state === "playing" ? "Pause" : "Play"}
        </button>
        <input
          className={styles.progress}
          type="range"
          min={0}
          max={effectiveDuration || 0}
          step={0.1}
          value={Math.min(currentTime, effectiveDuration || 0)}
          onChange={(event) => seek(Number(event.currentTarget.value))}
          disabled={disabled || effectiveDuration <= 0}
          aria-label={`Playback position for ${metadata.title}`}
        />
        <span className={styles.time} aria-live="off">
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </span>
      </div>

      {restriction ? <div className={styles.restriction} role="status">{restriction}</div> : null}
      {state === "error" ? <div className={styles.restriction} role="alert">Audio could not be played. Try again or request support.</div> : null}
    </section>
  );
}
