"use client";

import { MicrophoneIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Button } from "../common/Button";

export const WakeWordButton = ({
  supported,
  listening,
  onToggle,
}: {
  supported: boolean;
  listening: boolean;
  onToggle: () => void;
}) => {
  const t = useTranslations("Chat");

  if (!supported) return null;

  return (
    <Button
      variant={listening ? "teal" : "outline"}
      size="icon"
      type="button"
      onClick={onToggle}
      aria-pressed={listening}
      aria-label={t(listening ? "aria.stopWakeWord" : "aria.startWakeWord")}
      title={t(listening ? "tooltips.wakeWordOn" : "tooltips.wakeWordOff")}
    >
      <MicrophoneIcon
        className={listening ? "h-4 w-4 animate-pulse" : "h-4 w-4"}
      />
    </Button>
  );
};
