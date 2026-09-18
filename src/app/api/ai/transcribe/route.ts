import {
  StartStreamTranscriptionCommand,
  TranscribeStreamingClient,
} from "@aws-sdk/client-transcribe-streaming";
import { z } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { env } from "~/env";

const inputSchema = z.object({ audio: z.string().min(1) });
const sampleRate = 16_000;
const audioChunkSize = 32_000;

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return new Response("Invalid audio", { status: 400 });

  try {
    const audio = Buffer.from(parsed.data.audio, "base64");
    const client = new TranscribeStreamingClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const result = await client.send(
      new StartStreamTranscriptionCommand({
        LanguageCode: "es-MX",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: sampleRate,
        AudioStream: (async function* () {
          for (
            let offset = 0;
            offset < audio.length;
            offset += audioChunkSize
          ) {
            yield {
              AudioEvent: {
                AudioChunk: audio.subarray(offset, offset + audioChunkSize),
              },
            };
          }
        })(),
      }),
    );

    console.log(result);

    const transcript: string[] = [];
    if (result.TranscriptResultStream) {
      for await (const event of result.TranscriptResultStream) {
        const results = event.TranscriptEvent?.Transcript?.Results ?? [];
        console.log(results);
        for (const item of results) {
          if (item.IsPartial) continue;
          const text = item.Alternatives?.[0]?.Transcript?.trim();
          if (text) transcript.push(text);
        }
      }
    }

    const text = transcript.join(" ").trim();
    console.log(text);
    if (!text)
      return new Response("Transcribe returned no transcript", { status: 502 });

    return Response.json({ text });
  } catch (error) {
    console.error("[TRANSCRIBE ERROR]", error);
    return new Response("Transcription failed", { status: 502 });
  }
}
