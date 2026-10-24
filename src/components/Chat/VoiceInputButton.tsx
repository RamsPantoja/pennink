"use client";

import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { Button } from "../common/Button";

export const VoiceInputButton = ({
  onTranscript,
}: {
  onTranscript: (text: string) => void | Promise<void>;
}) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const samples = useRef<Float32Array[]>([]);

  const stop = async () => {
    processor.current?.disconnect();
    source.current?.disconnect();
    mediaStream.current?.getTracks().forEach((track) => track.stop());

    const context = audioContext.current;
    const sampleRate = context?.sampleRate ?? 48_000;
    await context?.close();
    processor.current = null;
    source.current = null;
    mediaStream.current = null;
    audioContext.current = null;

    const recordedSamples = samples.current;
    samples.current = [];
    if (recordedSamples.length === 0) return;

    const length = recordedSamples.reduce(
      (total, chunk) => total + chunk.length,
      0,
    );
    const joined = new Float32Array(length);
    let offset = 0;
    for (const chunk of recordedSamples) {
      joined.set(chunk, offset);
      offset += chunk.length;
    }

    const targetSampleRate = 16_000;
    const targetLength = Math.floor(
      (joined.length * targetSampleRate) / sampleRate,
    );
    const pcm = new Int16Array(targetLength);
    for (let index = 0; index < targetLength; index++) {
      const sourceIndex = Math.min(
        joined.length - 1,
        Math.floor((index * sampleRate) / targetSampleRate),
      );
      const sample = Math.max(-1, Math.min(1, joined[sourceIndex] ?? 0));
      pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    const bytes = new Uint8Array(pcm.buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(
        ...bytes.subarray(index, index + chunkSize),
      );
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: btoa(binary) }),
      });
      if (!response.ok) throw new Error("Transcription request failed");
      const result = (await response.json()) as { text?: string };
      if (result.text?.trim()) await onTranscript(result.text.trim());
    } catch (error) {
      console.error("[VOICE TRANSCRIPTION ERROR]", error);
    } finally {
      setProcessing(false);
    }
  };

  const toggle = async () => {
    if (recording) {
      setRecording(false);
      await stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const context = new AudioContext();
      await context.resume();
      const input = context.createMediaStreamSource(stream);
      const recorder = context.createScriptProcessor(4096, 1, 1);
      recorder.onaudioprocess = (event) => {
        samples.current.push(
          new Float32Array(event.inputBuffer.getChannelData(0)),
        );
      };
      input.connect(recorder);
      recorder.connect(context.destination);
      audioContext.current = context;
      mediaStream.current = stream;
      source.current = input;
      processor.current = recorder;
      samples.current = [];
      setRecording(true);
    } catch (error) {
      console.error("[MICROPHONE ERROR]", error);
    }
  };

  return (
    <Button
      variant={recording || processing ? "teal" : "outline"}
      size="icon"
      type="button"
      onClick={() => void toggle()}
      aria-label={recording ? "Stop voice input" : "Speak to teacher copilot"}
    >
      {recording ? (
        <StopIcon className="h-4 w-4" />
      ) : (
        <MicrophoneIcon className="h-4 w-4" />
      )}
    </Button>
  );
};
