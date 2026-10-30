"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

const BAR_COUNT = 32;
const SAMPLE_INTERVAL_MS = 90;
const DOT_SIZE = 3;
const MAX_BAR_HEIGHT = 24;

// Scrolling level meter: each sample pushes a new bar on the right and
// shifts the rest to the left. Quiet samples render as dots.
export const VoiceWaveform = ({
  analyser,
  className,
}: {
  analyser: AnalyserNode | null;
  className?: string;
}) => {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0),
  );

  useEffect(() => {
    if (!analyser) return;

    const buffer = new Uint8Array(analyser.fftSize);
    const interval = window.setInterval(() => {
      analyser.getByteTimeDomainData(buffer);

      let sum = 0;
      for (const value of buffer) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / buffer.length);
      const level = Math.min(1, rms * 4);

      setLevels((previous) => [...previous.slice(1), level]);
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [analyser]);

  return (
    <div
      aria-hidden="true"
      className={cn("flex h-6 items-center justify-center gap-[3px]", className)}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 30%)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 30%)",
      }}
    >
      {levels.map((level, index) => {
        const height = Math.max(DOT_SIZE, Math.round(level * MAX_BAR_HEIGHT));
        return (
          <span
            key={index}
            className="w-[3px] shrink-0 rounded-full bg-foreground transition-[height] duration-100 ease-out"
            style={{ height }}
          />
        );
      })}
    </div>
  );
};
