"use client";

import { useEffect, useRef, useState } from "react";
import { extractWakeWordCommand } from "~/lib/wakeWord";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

// Errors that end listening for good. Silence and aborts are recoverable.
const fatalErrors = new Set(["not-allowed", "service-not-allowed"]);

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
};

export const useWakeWordListener = ({
  onCommand,
  disabled,
}: {
  onCommand: (command: string) => void;
  disabled: boolean;
}) => {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const onCommandRef = useRef(onCommand);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onCommandRef.current = onCommand;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!listening || !Recognition) return;

    let active = true;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      if (disabledRef.current) return;
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];
        if (!result?.isFinal) continue;
        const command = extractWakeWordCommand(result[0].transcript);
        if (command) onCommandRef.current(command);
      }
    };

    recognition.onerror = (event) => {
      if (!fatalErrors.has(event.error)) return;
      active = false;
      setListening(false);
    };

    // Browsers end a continuous session after silence, so restart it.
    recognition.onend = () => {
      if (!active) return;
      try {
        recognition.start();
      } catch (error) {
        console.error("[WAKE WORD RESTART ERROR]", error);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("[WAKE WORD START ERROR]", error);
      setListening(false);
    }

    return () => {
      active = false;
      recognition.onend = null;
      recognition.stop();
    };
  }, [listening]);

  return {
    supported,
    listening,
    toggle: () => setListening((value) => !value),
  };
};
