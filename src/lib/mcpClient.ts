import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
	LoggingMessageNotificationSchema,
	ToolListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "ai";

export class MCPClient {
	private client: Client;
	private transport: StreamableHTTPClientTransport | null = null;
	private isCompleted = false;

	constructor(serverName: string) {
		this.client = new Client({
			name: `mcp-client-for-${serverName}`,
			version: "1.0.0",
		});
	}

	async connectToServer(serverUrl: string) {
		const url = new URL(serverUrl);

		try {
			this.transport = new StreamableHTTPClientTransport(url);
			await this.client.connect(this.transport);
			console.log("Connected to server");

			// this.setUpTransport();
		} catch (e) {
			console.error("Failed to connect to MCP server: ", e);
		}
	}

	async listTools() {
		try {
			const toolsResult = await this.client.listTools();
			return toolsResult.tools;
		} catch (error) {
			console.log(`Tools not supported by the server (${error})`);
		}
	}

	// async callTool(name: string) {
	// 	try {
	// 		console.log("\nCalling tool: ", name);

	// 		const result = await this.client.callTool({
	// 			name: name,
	// 			arguments: { name: "itsuki" },
	// 		});

	// 		const content = result.content as object[];

	// 		console.log("results:");
	// 		content.forEach((item) => {
	// 			const parse = TextContentSchema.safeParse(item);
	// 			if (parse.success) {
	// 				console.log(`- ${parse.data.text}`);
	// 			}
	// 		});
	// 	} catch (error) {
	// 		console.log(`Error calling greet tool: ${error}`);
	// 	}
	// }

	// Set up notification handlers for server-initiated messages
	private setUpNotifications() {
		this.client.setNotificationHandler(
			LoggingMessageNotificationSchema,
			(notification) => {
				console.log(
					"LoggingMessageNotificationSchema received:  ",
					notification,
				);
			},
		);
		// will only be triggered after list tools called
		this.client.setNotificationHandler(
			ToolListChangedNotificationSchema,
			async (notification) => {
				console.log(
					"ToolListChangedNotificationSchema received:  ",
					notification,
				);
				await this.listTools();
			},
		);
	}

	private setUpTransport() {
		if (this.transport === null) {
			return;
		}

		this.transport.onclose = () => {
			console.log("SSE transport closed.");
			this.isCompleted = true;
		};

		this.transport.onerror = async (error) => {
			console.log("SSE transport error: ", error);
			await this.cleanup();
		};

		this.transport.onmessage = (message) => {
			console.log("message received: ", message);
		};
	}

	async waitForCompletion() {
		while (!this.isCompleted) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	async cleanup() {
		await this.client.close();
	}
}
