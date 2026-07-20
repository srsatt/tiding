import { createInterface } from "node:readline";
import { DatabaseService } from "../db";
import { RenderCache } from "../rendering/render-cache";
import { renderCustomWidgetPreview } from "../services/custom-widget-preview";
import { renderScreenPreview } from "../services/render-preview";
import { handleMcpJsonRpc, type McpJsonRpcRequest } from "./protocol";

function createContext() {
	const db = new DatabaseService(process.env.DB_PATH || "data/tiding.db", {
		bootstrap: process.env.TIDING_BOOTSTRAP_DB === "1",
	});
	const cache = new RenderCache(
		process.env.TIDING_RENDER_CACHE_DIR || "data/render-cache",
	);
	return {
		db,
		invalidateRender: (screenId: number) => cache.invalidate(screenId),
		renderPreview: (screenId: number) =>
			renderScreenPreview(db, cache, screenId),
		renderCustomWidgetPreview: (customWidgetId: number) =>
			renderCustomWidgetPreview(db, customWidgetId),
	};
}

export async function startMcpStdioServer() {
	const context = createContext();
	const lines = createInterface({
		input: process.stdin,
		crlfDelay: Number.POSITIVE_INFINITY,
	});

	for await (const line of lines) {
		if (!line.trim()) continue;
		let message: McpJsonRpcRequest;
		try {
			message = JSON.parse(line);
		} catch {
			console.log(
				JSON.stringify({
					jsonrpc: "2.0",
					id: null,
					error: { code: -32700, message: "Parse error" },
				}),
			);
			continue;
		}

		const response = await handleMcpJsonRpc(context, message);
		if (response) console.log(JSON.stringify(response));
	}

	context.db.close();
}

if (import.meta.main) {
	await startMcpStdioServer();
}
