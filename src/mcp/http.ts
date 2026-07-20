import {
	handleMcpJsonRpc,
	type McpJsonRpcRequest,
	type McpJsonRpcResponse,
} from "./protocol";
import type { McpToolContext } from "./tools";

const JSON_HEADERS = {
	"Content-Type": "application/json",
	"Cache-Control": "no-store",
};

function jsonRpcError(code: number, message: string, status = 400) {
	return new Response(
		JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }),
		{ status, headers: JSON_HEADERS },
	);
}

export async function handleMcpHttp(req: Request, context: McpToolContext) {
	if (req.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "POST" },
		});
	}

	let payload: McpJsonRpcRequest | McpJsonRpcRequest[];
	try {
		payload = await req.json();
	} catch {
		return jsonRpcError(-32700, "Parse error");
	}

	if (!payload || typeof payload !== "object") {
		return jsonRpcError(-32600, "Invalid Request");
	}

	const messages = Array.isArray(payload) ? payload : [payload];
	if (messages.length === 0) return jsonRpcError(-32600, "Invalid Request");
	const responses: McpJsonRpcResponse[] = [];
	for (const message of messages) {
		if (!message || typeof message !== "object") {
			responses.push({
				jsonrpc: "2.0",
				id: null,
				error: { code: -32600, message: "Invalid Request" },
			});
			continue;
		}
		const response = await handleMcpJsonRpc(context, message);
		if (response) responses.push(response);
	}

	if (responses.length === 0) return new Response(null, { status: 202 });
	return new Response(
		JSON.stringify(Array.isArray(payload) ? responses : responses[0]),
		{ headers: JSON_HEADERS },
	);
}
