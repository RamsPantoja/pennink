import { streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { env } from "~/env";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const { url, prompt } = await req.json();

		if (!url) {
			throw new Error("Missing url");
		}

		const resLambda = await fetch(
			"https://zn3ruo26h3uod7lgarfgc62sou0okmoj.lambda-url.us-east-1.on.aws/",
			{
				method: "POST",
				body: JSON.stringify({ url, apiKey: env.URL_SCRAPING_API_KEY }),
			},
		);

		const urlContent = await resLambda.json();

		if (!urlContent) {
			throw new Error("Failed to fetch url content");
		}

		const model = bedrock("openai.gpt-oss-20b-1:0");

		const systemTemplate = `
  		Content: ${urlContent.htmlBody}
  		Format the above content for better reading.
      If user wants to do or extract specific information, take their request into account.

      Constraints:
      1. Only response with the formatted content.
    `;

		const result = streamText({
			model,
			system: systemTemplate,
			prompt: prompt || "Start formatting",
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[URL SCRAPING]: ", error);
		return Response.error();
	}
}
