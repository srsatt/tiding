import type { McpToolContext } from "./tools";
import { callMcpTool, mcpToolDefinitions } from "./tools";

export interface McpJsonRpcRequest {
	jsonrpc?: "2.0";
	id?: string | number | null;
	method?: string;
	params?: Record<string, unknown>;
}

export interface McpJsonRpcResponse {
	jsonrpc: "2.0";
	id: string | number | null;
	result?: unknown;
	error?: { code: number; message: string };
}

const SUPPORTED_PROTOCOL_VERSIONS = new Set([
	"2024-11-05",
	"2025-03-26",
	"2025-06-18",
]);

function protocolVersion(message: McpJsonRpcRequest) {
	const requested = message.params?.protocolVersion;
	return typeof requested === "string" &&
		SUPPORTED_PROTOCOL_VERSIONS.has(requested)
		? requested
		: "2025-03-26";
}

async function requestResult(
	context: McpToolContext,
	message: McpJsonRpcRequest,
) {
	switch (message.method) {
		case "initialize":
			return {
				protocolVersion: protocolVersion(message),
				serverInfo: { name: "tiding", version: "0.1.0" },
				capabilities: { tools: {} },
				instructions:
					"Manage this Tiding instance through application services. Prefer read tools before writes and render previews after layout changes.",
			};
		case "ping":
			return {};
		case "tools/list":
			return { tools: mcpToolDefinitions };
		case "tools/call": {
			const params = message.params || {};
			const name = params.name;
			if (typeof name !== "string") throw new Error("Tool name is required");
			const result = await callMcpTool(context, name, params.arguments || {});
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		}
		case "notifications/initialized":
			return undefined;
		default:
			throw new Error(`Unknown JSON-RPC method: ${message.method}`);
	}
}

export async function handleMcpJsonRpc(
	context: McpToolContext,
	message: McpJsonRpcRequest,
): Promise<McpJsonRpcResponse | null> {
	if (message.id === undefined) {
		await requestResult(context, message);
		return null;
	}
	try {
		return {
			jsonrpc: "2.0",
			id: message.id ?? null,
			result: await requestResult(context, message),
		};
	} catch (error) {
		return {
			jsonrpc: "2.0",
			id: message.id ?? null,
			error: {
				code: -32000,
				message: error instanceof Error ? error.message : String(error),
			},
		};
	}
}
