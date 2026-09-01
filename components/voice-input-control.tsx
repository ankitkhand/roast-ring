"use client";

import { voiceErrorMessage, voiceMessages, type VoiceInputError, type VoiceInputStatus } from "@/lib/voice-input";

export function VoiceInputControl({
  supported,
  status,
  error,
  onStart,
  onStop,
}: {
  supported: boolean;
  status: VoiceInputStatus;
  error: VoiceInputError | null;
  onStart: () => void;
  onStop: () => void;
}) {
  if (!supported) return null;

  const listening = status === "listening";
  const busy = status === "requesting" || status === "processing";
  const label = status === "requesting"
    ? voiceMessages.requesting
    : listening
      ? "STOP LISTENING"
      : status === "processing"
        ? voiceMessages.processing
        : status === "complete"
          ? voiceMessages.complete
          : status === "error"
            ? "TRY VOICE AGAIN"
            : voiceMessages.idle;
  const supportingCopy = listening
    ? voiceMessages.listeningSupport
    : status === "processing"
      ? voiceMessages.processingSupport
      : voiceErrorMessage(error);

  return (
    <div className={`voice-input voice-${status}`}>
      <button
        className="voice-button"
        type="button"
        onClick={listening ? onStop : onStart}
        disabled={busy || status === "complete"}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice input" : "Roast with voice"}
      >
        <span className="voice-mic" aria-hidden="true">{listening ? "●" : status === "complete" ? "✓" : "🎙️"}</span>
        <strong>{listening ? voiceMessages.listening : label}</strong>
      </button>
      <p role="status" aria-live="polite" aria-atomic="true">{supportingCopy}</p>
    </div>
  );
}
