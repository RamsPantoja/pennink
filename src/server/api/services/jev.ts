import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import {
	JEV_API_URL,
	JEV_DANGER_ZONE_HEADER,
	type JevSystemOneRequest,
} from "~/lib/evaluation/jev";

export type JevSystemOneResponse = {
	model: string;
	answers: Record<string, unknown>;
	usage?: { input_tokens: number; output_tokens: number };
};

/** Calls Jev's system-one endpoint. Images need the danger-zone header on every request. */
export async function callJevSystemOne(
	request: JevSystemOneRequest,
): Promise<JevSystemOneResponse> {
	if (!env.JEV_API_KEY) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Jev is not configured. Set JEV_API_KEY on the server.",
		});
	}

	const response = await fetch(JEV_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.JEV_API_KEY}`,
			"Content-Type": "application/json",
			[JEV_DANGER_ZONE_HEADER]: "true",
		},
		body: JSON.stringify(request),
		signal: AbortSignal.timeout(180_000),
	});

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		throw new Error(`Jev returned ${response.status}: ${detail.slice(0, 500)}`);
	}

	return (await response.json()) as JevSystemOneResponse;
}
