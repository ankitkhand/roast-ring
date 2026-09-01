export type VoiceInputStatus = "idle" | "requesting" | "listening" | "processing" | "complete" | "error";
export type VoiceInputError = "permission-denied" | "no-speech" | "recognition-error" | "unavailable";
export type VoiceCancelReason = "submit" | "timeout" | "inactive" | "unmount";

export const voiceMessages = {
  idle: "ROAST WITH VOICE",
  requesting: "ALLOWING THE MIC...",
  listening: "LISTENING...",
  listeningSupport: "Say it with your chest.",
  processing: "CATCHING THAT ROAST...",
  processingSupport: "Turning disrespect into text...",
  complete: "GOT IT.",
  permissionDenied: "Mic blocked. Typing still works.",
  noSpeech: "The mic heard nothing. Give it another shot.",
  recognitionError: "Didn’t catch that. Try again or type it.",
} as const;

export type SpeechRecognitionAlternativeLike = { transcript: string };
export type SpeechRecognitionResultLike = { isFinal: boolean; [index: number]: SpeechRecognitionAlternativeLike };
export type SpeechRecognitionResultEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> };
export type SpeechRecognitionErrorEventLike = { error: string };

export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionFactory = new () => SpeechRecognitionLike;

export type SpeechRecognitionHost = {
  SpeechRecognition?: SpeechRecognitionFactory;
  webkitSpeechRecognition?: SpeechRecognitionFactory;
};

export type VoiceInputCallbacks = {
  onStatus?: (status: VoiceInputStatus, error: VoiceInputError | null) => void;
  onTranscript?: (transcript: string) => void;
  onComplete?: () => void;
  onPermissionDenied?: () => void;
  onCancelled?: (reason: VoiceCancelReason) => void;
};

export function getSpeechRecognitionFactory(host: SpeechRecognitionHost | undefined): SpeechRecognitionFactory | null {
  return host?.SpeechRecognition ?? host?.webkitSpeechRecognition ?? null;
}

export function normalizeVoiceTranscript(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function voiceErrorMessage(error: VoiceInputError | null) {
  if (error === "permission-denied") return voiceMessages.permissionDenied;
  if (error === "no-speech") return voiceMessages.noSpeech;
  if (error === "recognition-error") return voiceMessages.recognitionError;
  return "";
}

export function voiceAnalyticsProperties(round: number, options: { supported?: boolean; reason?: VoiceCancelReason } = {}) {
  return { round, ...options };
}

export class VoiceInputController {
  private recognition: SpeechRecognitionLike | null = null;
  private currentStatus: VoiceInputStatus = "idle";
  private currentError: VoiceInputError | null = null;
  private session = 0;
  private finalTranscript = "";

  constructor(
    private readonly factory: SpeechRecognitionFactory | null,
    private readonly callbacks: VoiceInputCallbacks = {},
  ) {}

  supported() {
    return Boolean(this.factory);
  }

  status() {
    return this.currentStatus;
  }

  error() {
    return this.currentError;
  }

  transcript() {
    return this.finalTranscript;
  }

  private update(status: VoiceInputStatus, error: VoiceInputError | null = null) {
    this.currentStatus = status;
    this.currentError = error;
    this.callbacks.onStatus?.(status, error);
  }

  start() {
    if (!this.factory) {
      this.update("error", "unavailable");
      return false;
    }
    if (["requesting", "listening", "processing"].includes(this.currentStatus)) return false;

    const recognition = new this.factory();
    const session = ++this.session;
    this.recognition = recognition;
    this.finalTranscript = "";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.maxAlternatives = 1;

    const active = () => session === this.session && recognition === this.recognition;

    recognition.onstart = () => {
      if (active()) this.update("listening");
    };
    recognition.onresult = (event) => {
      if (!active()) return;
      const pieces: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript;
        if (result?.isFinal && transcript) pieces.push(transcript);
      }
      const transcript = normalizeVoiceTranscript(pieces.join(" "));
      if (!transcript) return;
      this.finalTranscript = transcript;
      this.callbacks.onTranscript?.(transcript);
      this.update("complete");
      this.callbacks.onComplete?.();
    };
    recognition.onerror = (event) => {
      if (!active() || event.error === "aborted") return;
      this.recognition = null;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        this.update("error", "permission-denied");
        this.callbacks.onPermissionDenied?.();
      } else if (event.error === "no-speech") {
        this.update("error", "no-speech");
      } else {
        this.update("error", "recognition-error");
      }
    };
    recognition.onend = () => {
      if (!active()) return;
      this.recognition = null;
      if (this.currentStatus === "complete" || this.currentStatus === "error") return;
      this.update("error", "no-speech");
    };

    this.update("requesting");
    try {
      recognition.start();
      return true;
    } catch {
      if (active()) this.recognition = null;
      this.update("error", "recognition-error");
      return false;
    }
  }

  stop() {
    if (!this.recognition || !["requesting", "listening"].includes(this.currentStatus)) return false;
    this.update("processing");
    this.recognition.stop();
    return true;
  }

  cancel(reason: VoiceCancelReason) {
    const wasActive = Boolean(this.recognition) && ["requesting", "listening", "processing"].includes(this.currentStatus);
    const recognition = this.recognition;
    this.session += 1;
    this.recognition = null;
    if (wasActive) recognition?.abort();
    this.update("idle");
    if (wasActive) this.callbacks.onCancelled?.(reason);
    return wasActive;
  }
}
