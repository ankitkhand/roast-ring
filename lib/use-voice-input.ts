"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "./analytics";
import {
  getSpeechRecognitionFactory,
  voiceAnalyticsProperties,
  VoiceInputController,
  type VoiceCancelReason,
  type VoiceInputError,
  type VoiceInputStatus,
  type SpeechRecognitionHost,
} from "./voice-input";

const subscribeToSupport = () => () => undefined;
const speechRecognitionHost = () => typeof window === "undefined" ? undefined : window as unknown as SpeechRecognitionHost;
const browserSupportsVoice = () => getSpeechRecognitionFactory(speechRecognitionHost()) !== null;
const serverSupportsVoice = () => false;

export function useVoiceInput({
  active,
  roundNumber,
  onTranscript,
}: {
  active: boolean;
  roundNumber: number;
  onTranscript: (transcript: string) => void;
}) {
  const supported = useSyncExternalStore(subscribeToSupport, browserSupportsVoice, serverSupportsVoice);
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [error, setError] = useState<VoiceInputError | null>(null);
  const [transcript, setTranscript] = useState("");
  const controllerRef = useRef<VoiceInputController | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const roundRef = useRef(roundNumber);
  const completionTimerRef = useRef<number | null>(null);
  const unavailableTrackedRef = useRef(false);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { roundRef.current = roundNumber; }, [roundNumber]);

  useEffect(() => {
    if (!getSpeechRecognitionFactory(speechRecognitionHost()) && !unavailableTrackedRef.current) {
      unavailableTrackedRef.current = true;
      track("voice_input_unavailable", voiceAnalyticsProperties(roundRef.current, { supported: false }));
    }
  }, []);

  const clearCompletionTimer = useCallback(() => {
    if (completionTimerRef.current !== null) window.clearTimeout(completionTimerRef.current);
    completionTimerRef.current = null;
  }, []);

  const createController = useCallback(() => new VoiceInputController(
    getSpeechRecognitionFactory(speechRecognitionHost()),
    {
      onStatus: (nextStatus, nextError) => { setStatus(nextStatus); setError(nextError); },
      onTranscript: (value) => { setTranscript(value); onTranscriptRef.current(value); },
      onComplete: () => {
        track("voice_input_completed", voiceAnalyticsProperties(roundRef.current));
        clearCompletionTimer();
        completionTimerRef.current = window.setTimeout(() => setStatus("idle"), 1_200);
      },
      onPermissionDenied: () => track("voice_permission_denied", voiceAnalyticsProperties(roundRef.current)),
      onCancelled: (reason) => {
        if (reason === "submit" || reason === "timeout") track("voice_input_cancelled", voiceAnalyticsProperties(roundRef.current, { reason }));
      },
    },
  ), [clearCompletionTimer]);

  const start = useCallback(() => {
    if (!active) return false;
    clearCompletionTimer();
    const controller = createController();
    controllerRef.current = controller;
    const started = controller.start();
    if (started) track("voice_input_started", voiceAnalyticsProperties(roundRef.current, { supported: true }));
    else if (!controller.supported()) track("voice_input_unavailable", voiceAnalyticsProperties(roundRef.current, { supported: false }));
    return started;
  }, [active, clearCompletionTimer, createController]);

  const stop = useCallback(() => controllerRef.current?.stop() ?? false, []);

  const cancel = useCallback((reason: VoiceCancelReason) => {
    clearCompletionTimer();
    return controllerRef.current?.cancel(reason) ?? false;
  }, [clearCompletionTimer]);

  useEffect(() => {
    if (!active) cancel("inactive");
  }, [active, cancel]);

  useEffect(() => () => {
    clearCompletionTimer();
    controllerRef.current?.cancel("unmount");
  }, [clearCompletionTimer]);

  return { supported, status, error, transcript, start, stop, cancel };
}
