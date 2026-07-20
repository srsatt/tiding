import * as fs from "node:fs";
import * as nodePath from "node:path";
import { handleCustomWidgets } from "./api/handlers/custom-widgets.handler";
import { handleDataSources } from "./api/handlers/data-sources.handler";
import { handleDeviceLifecycle } from "./api/handlers/device.handler";
import { handleDevices } from "./api/handlers/devices.handler";
import { handleDisplay } from "./api/handlers/display.handler";
import { handleFirmware } from "./api/handlers/firmware.handler";
import { handlePlaylists } from "./api/handlers/playlists.handler";
import { handleScreenDesigns } from "./api/handlers/screen-designs.handler";
import { handleSettings } from "./api/handlers/settings.handler";
import { handleWidgetTemplates } from "./api/handlers/widget-templates.handler";
import { handleWidgets } from "./api/handlers/widgets.handler";
import { jsonResponse } from "./api/http";
import { DatabaseService } from "./db";
import { handleAdminPage } from "./frontend/pages";
import { handleMcpHttp } from "./mcp/http";
import type { FrameworkRenderContext } from "./rendering/composer/framework-widgets";
import { ScreenComposer } from "./rendering/composer/screen-composer";
import { RenderCache } from "./rendering/render-cache";
import { takumiRenderer } from "./rendering/takumi/renderer";
import {
	isAdminAuthenticated,
	isAdminOrBearerAuthenticated,
} from "./server/admin-auth";
import { runtimeServerConfig } from "./server/runtime-config";
import { staticAssetResponse } from "./server/static-assets";
import {
	renderCustomWidgetPreview,
	renderDraftCustomWidgetPreview,
} from "./services/custom-widget-preview";
import { fetchAndCacheDataSource } from "./services/data-source-fetch";
import { DataSourceScheduler } from "./services/data-source-scheduler";
import { renderDeviceCurrentScreenPreview } from "./services/device-current-screen-preview";
import { renderScreenPreview } from "./services/render-preview";
import { renderSettings } from "./services/render-settings";
import { renderSetupScreenBmp } from "./services/setup-screen";
import { renderWidgetPreview } from "./services/widget-preview";

const DB_PATH = process.env.DB_PATH || "data/tiding.db";
const CACHE_PATH = process.env.CACHE_PATH || "data/cache";
const ADMIN_PIN = process.env.TIDING_ADMIN_PIN || undefined;
const MCP_BEARER_TOKEN = process.env.TIDING_MCP_TOKEN || ADMIN_PIN;
const SERVER_CONFIG = runtimeServerConfig();

const db = new DatabaseService(DB_PATH, {
	bootstrap: process.env.TIDING_BOOTSTRAP_DB === "1",
});
const composer = new ScreenComposer(db);
const renderCache = new RenderCache(CACHE_PATH);
const dataSourceScheduler = new DataSourceScheduler(db, (id) =>
	fetchAndCacheDataSource(db, id, (screenId) =>
		renderCache.invalidate(screenId),
	),
);
dataSourceScheduler.start();

async function renderScreen(
	screenId: number,
	context?: FrameworkRenderContext,
	cacheVariant?: string,
) {
	const { html, width, height, ditherRegions } = await composer.composeHtml(
		screenId,
		context,
	);
	const settings = await renderSettings(db);
	const bmpBuffer = await takumiRenderer.renderHtmlToBmp(html, {
		width,
		height,
		threshold: settings.threshold,
		ditherMode: settings.ditherMode,
		ditherRegions,
	});
	renderCache.write(screenId, bmpBuffer, cacheVariant);
	return bmpBuffer;
}

const mcpContext = {
	db,
	invalidateRender: (screenId: number) => renderCache.invalidate(screenId),
	renderPreview: (screenId: number) =>
		renderScreenPreview(db, renderCache, screenId),
	renderCustomWidgetPreview: (customWidgetId: number) =>
		renderCustomWidgetPreview(db, customWidgetId),
};

async function handleRequest(req: Request) {
	const url = new URL(req.url);
	const urlPath = url.pathname;

	const staticResponse = staticAssetResponse(req);
	if (staticResponse) return staticResponse;

	if (urlPath.startsWith("/cache/")) {
		const filePath = nodePath.join(CACHE_PATH, nodePath.basename(urlPath));
		try {
			const content = fs.readFileSync(filePath);
			return new Response(content, {
				headers: { "Content-Type": "image/bmp" },
			});
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	}

	// Health Group
	if (urlPath === "/api/health" && req.method === "GET") {
		return new Response(JSON.stringify({ status: "ok" }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	if (urlPath === "/api/version" && req.method === "GET") {
		return new Response(
			JSON.stringify({ version: "0.1.0", project: "tiding" }),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	if (urlPath === "/mcp") {
		if (!isAdminOrBearerAuthenticated(req, ADMIN_PIN, MCP_BEARER_TOKEN)) {
			return jsonResponse(
				{
					jsonrpc: "2.0",
					id: null,
					error: { code: -32001, message: "MCP authentication required" },
				},
				{
					status: 401,
					headers: { "WWW-Authenticate": "Bearer" },
				},
			);
		}
		return handleMcpHttp(req, mcpContext);
	}

	if (urlPath === "/api/setup-screen.bmp" && req.method === "GET") {
		const bmpBuffer = await renderSetupScreenBmp();
		return new Response(new Uint8Array(bmpBuffer), {
			headers: {
				"Content-Type": "image/bmp",
				"Cache-Control": "no-store",
			},
		});
	}

	const publicDeviceApi =
		urlPath === "/api/setup" ||
		urlPath === "/api/log" ||
		urlPath === "/api/display" ||
		urlPath.startsWith("/api/firmware");

	if (
		ADMIN_PIN &&
		urlPath.startsWith("/api/") &&
		!publicDeviceApi &&
		!isAdminAuthenticated(req, ADMIN_PIN)
	) {
		return jsonResponse(
			{
				statusCode: 401,
				timestamp: new Date().toISOString(),
				path: urlPath,
				method: req.method,
				message: "Admin session required",
				error: "Unauthorized",
			},
			{ status: 401 },
		);
	}

	if (urlPath === "/api/setup" || urlPath === "/api/log") {
		const response = await handleDeviceLifecycle(req, db);
		if (response) return response;
	}
	if (urlPath === "/api/display") {
		return handleDisplay(req, db, async (screenId, context) => {
			const variant = `device-${context.device.id}`;
			await renderScreen(screenId, context, variant);
			return renderCache.deviceArtifactUrl(screenId, variant);
		});
	}
	if (urlPath.startsWith("/api/firmware")) {
		return handleFirmware(req, db);
	}

	const deviceCurrentScreenMatch = urlPath.match(
		/^\/api\/devices\/(\d+)\/current-screen\.bmp$/,
	);
	if (deviceCurrentScreenMatch && req.method === "GET") {
		const bmp = await renderDeviceCurrentScreenPreview(
			db,
			Number.parseInt(deviceCurrentScreenMatch[1], 10),
			renderScreen,
		);
		if (!bmp) return new Response("Not Found", { status: 404 });
		return new Response(new Uint8Array(bmp), {
			headers: {
				"Content-Type": "image/bmp",
				"Cache-Control": "no-store",
			},
		});
	}

	// Rendering endpoint
	if (
		urlPath.startsWith("/api/screen-designs/") &&
		(urlPath.endsWith("/render") || urlPath.endsWith("/preview")) &&
		(req.method === "POST" || req.method === "GET")
	) {
		const idMatch = urlPath.match(
			/\/api\/screen-designs\/(\d+)\/(?:render|preview)/,
		);
		const id = idMatch ? Number.parseInt(idMatch[1], 10) : null;

		if (!id) return new Response("Invalid ID", { status: 400 });

		try {
			const bmpBuffer =
				req.method === "POST"
					? await renderScreen(id)
					: (renderCache.read(id) ?? (await renderScreen(id)));
			return new Response(new Uint8Array(bmpBuffer), {
				headers: { "Content-Type": "image/bmp" },
			});
		} catch (e) {
			return new Response(JSON.stringify({ error: e }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	}

	const widgetPreviewMatch = urlPath.match(/^\/api\/widgets\/(\d+)\/preview$/);
	if (widgetPreviewMatch && req.method === "GET") {
		try {
			const bmp = await renderWidgetPreview(
				db,
				Number.parseInt(widgetPreviewMatch[1], 10),
			);
			return new Response(new Uint8Array(bmp), {
				headers: {
					"Content-Type": "image/bmp",
					"Cache-Control": "no-store",
				},
			});
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	}

	const adminResponse = await handleAdminPage(req, db, {
		dbPath: DB_PATH,
		port: SERVER_CONFIG.port,
		cachePath: CACHE_PATH,
		version: "0.1.0",
		mcpEnabled: true,
		adminPin: ADMIN_PIN,
	});
	if (adminResponse) return adminResponse;

	// API Handlers
	if (
		/^\/api\/screen-designs\/\d+\/widgets/.test(urlPath) ||
		urlPath.startsWith("/api/widgets")
	)
		return handleWidgets(req, db, (screenId) =>
			renderCache.invalidate(screenId),
		);
	if (urlPath.startsWith("/api/widget-templates")) {
		return handleWidgetTemplates(req, db);
	}
	if (urlPath.startsWith("/api/screen-designs"))
		return handleScreenDesigns(req, db, (screenId) =>
			renderCache.invalidate(screenId),
		);
	if (urlPath.startsWith("/api/data-sources"))
		return handleDataSources(req, db, (screenId) =>
			renderCache.invalidate(screenId),
		);
	if (urlPath.startsWith("/api/custom-widgets"))
		return handleCustomWidgets(
			req,
			db,
			(screenId) => renderCache.invalidate(screenId),
			(customWidgetId) => renderCustomWidgetPreview(db, customWidgetId),
			(input) => renderDraftCustomWidgetPreview(db, input),
		);
	if (urlPath.startsWith("/api/settings")) {
		return handleSettings(req, db);
	}
	if (urlPath.startsWith("/api/playlists")) {
		return handlePlaylists(req, db);
	}
	if (urlPath.startsWith("/api/devices")) {
		return handleDevices(req, db);
	}

	if (urlPath === "/api/schema" && req.method === "GET") {
		return jsonResponse({
			database: DB_PATH,
			bootstrap: process.env.TIDING_BOOTSTRAP_DB === "1",
			compatibility: db.schemaReport(),
		});
	}

	if (urlPath.startsWith("/api/")) {
		return jsonResponse(
			{
				statusCode: 404,
				timestamp: new Date().toISOString(),
				path: urlPath,
				method: req.method,
				message: `Cannot ${req.method} ${urlPath}`,
				error: "Not Found",
			},
			{ status: 404 },
		);
	}

	return new Response("Not Found", { status: 404 });
}

console.log(`Tiding server running on port ${SERVER_CONFIG.port}`);
const server = Bun.serve({
	port: SERVER_CONFIG.port,
	idleTimeout: SERVER_CONFIG.idleTimeout,
	development: SERVER_CONFIG.development,
	async fetch(req) {
		return handleRequest(req);
	},
});

let shuttingDown = false;
function shutdown(signal: string) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`Stopping Tiding after ${signal}`);
	dataSourceScheduler.stop();
	server.stop(true);
	db.close();
	process.exit(0);
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
