type SpeechToolPart = {
  type?: string;
  output?: { text?: unknown };
};

export const extractSpeechText = (parts: unknown): string | null => {
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    const speechPart = part as SpeechToolPart;
    if (speechPart.type !== "tool-prepareSpeechText") continue;

    const text = speechPart.output?.text;
    if (typeof text === "string" && text.trim()) return text.trim();
  }

  return null;
};
