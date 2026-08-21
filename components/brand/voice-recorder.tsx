"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceRecorderState } from "@/lib/brand-sensory.types";
import { AudioPlayer } from "./audio-player";
import styles from "./brand-sensory.module.css";

interface VoiceRecorderProps {
  label?: string;
  disabled?: boolean;
  onRecordingReady?: (recording: Blob) => void;
  onStateChange?: (state: VoiceRecorderState) => void;
}

export function VoiceRecorder({
  label = "Record a memory",
  disabled = false,
  onRecordingReady,
  onStateChange
}: VoiceRecorderProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [reviewUrl, setReviewUrl] = useState<string>();

  function transition(next: VoiceRecorderState) {
    setState(next);
    onStateChange?.(next);
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    return () => {
      recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
      releaseStream();
      if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    };
  }, [reviewUrl]);

  async function startRecording() {
    if (disabled || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      transition("error");
      return;
    }

    transition("requesting-permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        releaseStream();
        transition("error");
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const nextUrl = URL.createObjectURL(blob);
        setReviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        releaseStream();
        transition("review");
        onRecordingReady?.(blob);
      };

      recorder.start();
      transition("recording");
    } catch (error) {
      releaseStream();
      if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
        transition("denied");
      } else {
        transition("error");
      }
    }
  }

  function pauseOrResume() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      transition("paused");
    } else if (recorder.state === "paused") {
      recorder.resume();
      transition("recording");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  function reset() {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(undefined);
    recorderRef.current = null;
    chunksRef.current = [];
    transition("idle");
  }

  const activelyRecording = state === "recording" || state === "paused";

  return (
    <section className={styles.recorder} aria-label={label}>
      <strong>{label}</strong>
      <span className={styles.stateMessage} role="status" aria-live="polite">
        {state === "idle" && "Use your microphone to contribute a spoken memory instead of typing."}
        {state === "requesting-permission" && "Waiting for microphone permission."}
        {state === "recording" && "Recording is in progress."}
        {state === "paused" && "Recording is paused."}
        {state === "review" && "Recording stopped. Review it before the surrounding workflow saves or uploads it."}
        {state === "denied" && "Microphone access was not allowed. Use a written or assisted contribution method instead."}
        {state === "error" && "Recording is not available on this device or browser. Use another contribution method."}
      </span>

      {state === "recording" ? (
        <div className={styles.recordingIndicator} aria-hidden="true">
          <span className={styles.recordingDot} /> Recording
        </div>
      ) : null}

      <div className={styles.controls}>
        {!activelyRecording && state !== "review" ? (
          <button className={styles.recordButton} type="button" onClick={startRecording} disabled={disabled || state === "requesting-permission"}>
            Start recording
          </button>
        ) : null}
        {activelyRecording ? (
          <>
            <button className={styles.actionButton} type="button" onClick={pauseOrResume}>
              {state === "paused" ? "Resume" : "Pause"}
            </button>
            <button className={styles.recordButton} type="button" onClick={stopRecording}>
              Stop recording
            </button>
          </>
        ) : null}
        {state === "review" ? (
          <button className={styles.actionButton} type="button" onClick={reset}>
            Record again
          </button>
        ) : null}
      </div>

      {reviewUrl ? (
        <AudioPlayer
          src={reviewUrl}
          metadata={{ title: "Review recording", subjectLabel: "Voice memory" }}
          entitlement={{ canPlay: true, consentState: "permitted" }}
          variant="story-contribution"
          compact
        />
      ) : null}
    </section>
  );
}
