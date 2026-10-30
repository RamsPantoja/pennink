export const WAKE_WORD = "hey tutor";

const cleanPunctuation = (text: string) =>
  text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripDiacritics = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Returns the command spoken after the wake word, or null when the transcript
 * does not start with the wake word or nothing follows it. The command keeps
 * its original casing and accents.
 */
export const extractWakeWordCommand = (
  transcript: string,
  wakeWord = WAKE_WORD,
): string | null => {
  const cleaned = cleanPunctuation(transcript);
  const normalizedWakeWord = stripDiacritics(cleanPunctuation(wakeWord)).toLowerCase();

  const head = stripDiacritics(cleaned.slice(0, normalizedWakeWord.length)).toLowerCase();
  if (head !== normalizedWakeWord) return null;

  const command = cleaned.slice(normalizedWakeWord.length).trim();
  return command || null;
};
