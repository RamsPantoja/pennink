import { z } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { env } from "~/env";

export const runtime = "nodejs";

const maxTextLength = 20_000;
const speechRequestSchema = z.object({
  text: z.string().min(1).max(maxTextLength),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (!request.body)
    return new Response("Missing speech text", { status: 400 });
  console.log("[AGENT SPEECH] request received");

  let parsedRequest: ReturnType<typeof speechRequestSchema.safeParse>;
  try {
    parsedRequest = speechRequestSchema.safeParse(await request.json());
  } catch (error) {
    console.error("[AGENT SPEECH] request parsing failed:", error);
    return new Response("Invalid speech request", { status: 400 });
  }
  if (!parsedRequest.success) {
    return new Response("Invalid speech request", { status: 400 });
  }

  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}/stream`,
  );
  url.searchParams.set("output_format", "mp3_44100_128");

  const elevenLabsResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: parsedRequest.data.text,
      model_id: env.ELEVENLABS_MODEL_ID,
      language_code: "es",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
      },
    }),
    signal: request.signal,
  });

  if (!elevenLabsResponse.ok || !elevenLabsResponse.body) {
    const error = await elevenLabsResponse.text();
    console.error("[AGENT SPEECH] ElevenLabs error:", error);
    return new Response("Speech generation failed", {
      status: elevenLabsResponse.status,
    });
  }

  return new Response(elevenLabsResponse.body, {
    headers: {
      "Content-Type":
        elevenLabsResponse.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
