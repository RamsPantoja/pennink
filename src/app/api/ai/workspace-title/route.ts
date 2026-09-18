import { workspaceTitleAgent } from "~/app/agents/workspace-title/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const { context } = await req.json();

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = await workspaceTitleAgent.stream({
			messages: [
				...context.messages,
				{ role: "user", content: "Generate the title" },
			],
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[WORKSPACE TITLE GENERATION ERROR]: ", error);
		return Response.error();
	}
}
