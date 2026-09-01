import { beforeEach, describe, expect, it, vi } from "vitest";
import { TurnClock } from "./turn-timer";
import {
  getSpeechRecognitionFactory,
  normalizeVoiceTranscript,
  voiceAnalyticsProperties,
  VoiceInputController,
  type SpeechRecognitionErrorEventLike,
  type SpeechRecognitionLike,
  type SpeechRecognitionResultEventLike,
} from "./voice-input";

class FakeRecognition implements SpeechRecognitionLike {
  static instances: FakeRecognition[] = [];
  continuous = true;
  interimResults = true;
  lang = "";
  maxAlternatives = 0;
  onstart: (() => void) | null = null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    FakeRecognition.instances.push(this);
  }

  beginListening() {
    this.onstart?.();
  }

  finishWith(transcript: string) {
    const result = Object.assign([{ transcript }], { isFinal: true });
    this.onresult?.({ resultIndex: 0, results: [result] });
    this.onend?.();
  }

  fail(error: string) {
    this.onerror?.({ error });
  }
}

beforeEach(() => {
  FakeRecognition.instances = [];
});

describe("voice feature detection", () => {
  it("supports both standard and prefixed recognition constructors", () => {
    expect(getSpeechRecognitionFactory({ SpeechRecognition: FakeRecognition })).toBe(FakeRecognition);
    expect(getSpeechRecognitionFactory({ webkitSpeechRecognition: FakeRecognition })).toBe(FakeRecognition);
  });

  it("returns no controller for unsupported browsers so typing remains the fallback", () => {
    expect(getSpeechRecognitionFactory({})).toBeNull();
    const controller = new VoiceInputController(null);
    expect(controller.supported()).toBe(false);
    expect(controller.start()).toBe(false);
    expect(controller.error()).toBe("unavailable");
  });
});

describe("voice recognition lifecycle", () => {
  it("moves immediately through requesting and listening states", () => {
    const statuses: string[] = [];
    const controller = new VoiceInputController(FakeRecognition, { onStatus: (status) => statuses.push(status) });
    expect(controller.start()).toBe(true);
    expect(controller.status()).toBe("requesting");
    FakeRecognition.instances[0].beginListening();
    expect(controller.status()).toBe("listening");
    expect(statuses).toEqual(["requesting", "listening"]);
  });

  it("manual stop enters processing without finalizing or submitting", () => {
    const onTranscript = vi.fn();
    const controller = new VoiceInputController(FakeRecognition, { onTranscript });
    controller.start();
    const recognition = FakeRecognition.instances[0];
    recognition.beginListening();
    expect(controller.stop()).toBe(true);
    expect(controller.status()).toBe("processing");
    expect(recognition.stop).toHaveBeenCalledOnce();
    expect(onTranscript).not.toHaveBeenCalled();
  });

  it("puts only the final normalized transcript into the shared response callback", () => {
    let editableResponse = "";
    const controller = new VoiceInputController(FakeRecognition, { onTranscript: (value) => { editableResponse = value; } });
    controller.start();
    FakeRecognition.instances[0].beginListening();
    FakeRecognition.instances[0].finishWith("  Your mama   so slow even dial up passed her  ");
    expect(editableResponse).toBe("Your mama so slow even dial up passed her");
    editableResponse = `${editableResponse}.`;
    expect(editableResponse.endsWith(".")).toBe(true);
    expect(controller.status()).toBe("complete");
  });

  it("never auto-submits after transcription", () => {
    const judgeRequest = vi.fn();
    const controller = new VoiceInputController(FakeRecognition, { onTranscript: () => undefined });
    controller.start();
    FakeRecognition.instances[0].finishWith("Yo mama so slow even dial up passed her");
    expect(judgeRequest).not.toHaveBeenCalled();
  });

  it("keeps the deadline running while listening", () => {
    const clock = new TurnClock();
    const controller = new VoiceInputController(FakeRecognition);
    clock.start(1_000);
    controller.start();
    FakeRecognition.instances[0].beginListening();
    expect(controller.status()).toBe("listening");
    expect(clock.remaining(11_000)).toBe(35);
  });

  it("cancels recognition at timeout and ignores late transcripts", () => {
    const onTranscript = vi.fn();
    const onCancelled = vi.fn();
    const controller = new VoiceInputController(FakeRecognition, { onTranscript, onCancelled });
    controller.start();
    const recognition = FakeRecognition.instances[0];
    recognition.beginListening();
    expect(controller.cancel("timeout")).toBe(true);
    recognition.finishWith("unfinished roast");
    expect(recognition.abort).toHaveBeenCalledOnce();
    expect(onTranscript).not.toHaveBeenCalled();
    expect(onCancelled).toHaveBeenCalledWith("timeout");
    expect(controller.status()).toBe("idle");
  });

  it("handles permission denial without disabling future typed input", () => {
    const denied = vi.fn();
    const controller = new VoiceInputController(FakeRecognition, { onPermissionDenied: denied });
    controller.start();
    FakeRecognition.instances[0].fail("not-allowed");
    expect(controller.status()).toBe("error");
    expect(controller.error()).toBe("permission-denied");
    expect(denied).toHaveBeenCalledOnce();
  });

  it.each([
    ["no-speech", "no-speech"],
    ["network", "recognition-error"],
  ])("maps %s errors without throwing or corrupting the battle", (browserError, expected) => {
    const controller = new VoiceInputController(FakeRecognition);
    controller.start();
    FakeRecognition.instances[0].fail(browserError);
    expect(controller.status()).toBe("error");
    expect(controller.error()).toBe(expected);
  });

  it("prevents duplicate starts and safely cancels on submission", () => {
    const controller = new VoiceInputController(FakeRecognition);
    expect(controller.start()).toBe(true);
    expect(controller.start()).toBe(false);
    expect(FakeRecognition.instances).toHaveLength(1);
    expect(controller.cancel("submit")).toBe(true);
    expect(controller.cancel("submit")).toBe(false);
  });
});

describe("voice analytics privacy", () => {
  it("emits metadata without audio or transcript content", () => {
    const metadata = voiceAnalyticsProperties(2, { supported: true });
    expect(metadata).toEqual({ round: 2, supported: true });
    expect(JSON.stringify(metadata)).not.toMatch(/audio|transcript|joke/i);
  });
});

describe("transcript normalization", () => {
  it("only normalizes whitespace without rewriting meaning", () => {
    expect(normalizeVoiceTranscript(" Yo mama   so slow, dial-up won. ")).toBe("Yo mama so slow, dial-up won.");
  });
});
