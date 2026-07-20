import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import * as fs from "node:fs";
import * as nodePath from "node:path";
import { handleCustomWidgets } from "../src/api/handlers/custom-widgets.handler";
import { handleDataSources } from "../src/api/handlers/data-sources.handler";
import { handleDeviceLifecycle } from "../src/api/handlers/device.handler";
import { handleDevices } from "../src/api/handlers/devices.handler";
import { handleDisplay } from "../src/api/handlers/display.handler";
import { handleFirmware } from "../src/api/handlers/firmware.handler";
import { handlePlaylists } from "../src/api/handlers/playlists.handler";
import { handleScreenDesigns } from "../src/api/handlers/screen-designs.handler";
import { handleSettings } from "../src/api/handlers/settings.handler";
import { handleWidgetTemplates } from "../src/api/handlers/widget-templates.handler";
import { handleWidgets } from "../src/api/handlers/widgets.handler";
import { summarizeSamples } from "../src/benchmark/http-benchmark";
import { DatabaseService } from "../src/db";
import { runAdditiveMigrations } from "../src/db/migrations";
import { compatibilitySchemaReport } from "../src/db/schema";
import { FRAMEWORK_WIDGET_TEMPLATE_SEEDS } from "../src/db/widget-template-seed";
import {
	frameworkPaletteItems,
	palettePayload,
} from "../src/frontend/features/designer/screen-designer-palette-model";
import {
	parseDesignerWidgetPayload,
	serializeDesignerWidgetPayload,
} from "../src/frontend/features/designer/screen-designer-payload";
import { formatTimestamp } from "../src/frontend/format";
import { handleAdminPage } from "../src/frontend/pages";
import { renderShell } from "../src/frontend/shell";
import {
	callMcpTool,
	isMcpAutoStartEnabled,
	mcpToolDefinitions,
} from "../src/mcp/tools";
import { encodeRawTo1BitBmp } from "../src/rendering/bmp/mono-bmp";
import {
	downsampleRgbaToGrayscale,
	monochromePixelsWithRegions,
} from "../src/rendering/bmp/mono-pixels";
import {
	CUSTOM_WIDGET_FRAMEWORK_NAME,
	FRAMEWORK_WIDGET_NAMES,
} from "../src/rendering/composer/framework-widgets";
import { ScreenComposer } from "../src/rendering/composer/screen-composer";
import { RenderCache } from "../src/rendering/render-cache";
import {
	displayFontFamily,
	displayFontSelection,
	optimizeDisplayFonts,
} from "../src/rendering/takumi/display-fonts";
import { takumiRenderer } from "../src/rendering/takumi/renderer";
import { runtimeServerConfig } from "../src/server/runtime-config";
import { staticAssetResponse } from "../src/server/static-assets";
import {
	renderCustomWidgetPreview,
	renderDraftCustomWidgetPreview,
} from "../src/services/custom-widget-preview";
import {
	isDataSourceDue,
	refreshDueDataSources,
} from "../src/services/data-source-scheduler";
import { selectedScreenForDevice } from "../src/services/device-screen-selection";
import { renderScreenPreview } from "../src/services/render-preview";
import { renderSettingsFromRows } from "../src/services/render-settings";
import { renderSetupScreenBmp } from "../src/services/setup-screen";
import { renderWidgetPreview } from "../src/services/widget-preview";
import { frameworkWidgetInstance } from "../src/shared/framework-widget-instance";
import { customWidgetIdFromConfig } from "../src/shared/widget-config";
import { createSyntheticCompatibilityDatabase } from "./helpers/synthetic-compat-db";

function testDbPath(name: string) {
	const dir = nodePath.join("/tmp", "tiding-tests");
	fs.mkdirSync(dir, { recursive: true });
	const file = nodePath.join(
		dir,
		`${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`,
	);
	return file;
}

function syntheticCompatDbPath(name: string) {
	return createSyntheticCompatibilityDatabase(testDbPath(name));
}

test("timestamp formatting presents stored fetch times as readable dates", () => {
	expect(formatTimestamp("1780069973367")).not.toBe("1780069973367");
	expect(formatTimestamp("1780069973367")).toContain("2026");
	expect(formatTimestamp("2026-07-14T09:25:58Z")).toContain("11:25");
	expect(formatTimestamp(null)).toBe("Never");
	expect(formatTimestamp("not-a-date")).toBe("not-a-date");
});

test("data source refresh scheduling recognizes stale timestamps and skips fresh ones", () => {
	const now = Date.parse("2026-07-15T08:00:00Z");
	expect(isDataSourceDue(null, 60, now)).toBe(true);
	expect(isDataSourceDue("2026-07-15T07:58:59Z", 60, now)).toBe(true);
	expect(isDataSourceDue("2026-07-15 07:59:30", 60, now)).toBe(false);
	expect(isDataSourceDue(String(now - 61_000), 60, now)).toBe(true);
	expect(isDataSourceDue(String(now - 30_000), 60, now)).toBe(false);
});

test("data source refresh scheduling fetches only active due sources", async () => {
	const service = new DatabaseService(testDbPath("data-source-scheduler"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const staleId = await service.dataSources.create({
		name: "stale",
		url: "https://example.test/stale",
		refresh_interval: 60,
		is_active: true,
	});
	const freshId = await service.dataSources.create({
		name: "fresh",
		url: "https://example.test/fresh",
		refresh_interval: 60,
		is_active: true,
	});
	const inactiveId = await service.dataSources.create({
		name: "inactive",
		url: "https://example.test/inactive",
		refresh_interval: 60,
		is_active: false,
	});
	db.query("UPDATE data_sources SET last_fetched_at = ? WHERE id = ?").run(
		"2026-07-15T07:59:30Z",
		freshId,
	);

	const fetched: number[] = [];
	await refreshDueDataSources(
		service,
		async (id) => {
			fetched.push(id);
		},
		Date.parse("2026-07-15T08:00:00Z"),
	);
	expect(fetched).toEqual([staleId]);
	expect(fetched).not.toContain(freshId);
	expect(fetched).not.toContain(inactiveId);
	service.close();
});

test("desktop navigation stays pinned while long pages scroll", () => {
	const layoutCss = fs.readFileSync("src/frontend/styles/layout.css", "utf8");
	const navRule = layoutCss.match(/\.nav\s*\{([^}]*)\}/)?.[1] ?? "";
	expect(navRule).toContain("position: sticky");
	expect(navRule).toContain("top: 0");
	expect(navRule).toContain("height: 100vh");
});

test("Takumi rendering registers the display fonts used by imported widgets", () => {
	const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
		dependencies: Record<string, string>;
	};
	const rendererSource = fs.readFileSync(
		"src/rendering/takumi/renderer.ts",
		"utf8",
	);
	expect(packageJson.dependencies["takumi-js"]).toBe("^2.2.0");
	for (const font of [
		"DejaVuSans.ttf",
		"TRMNL12-Regular.ttf",
		"TRMNL12-Bold.ttf",
		"TRMNL16-Regular.ttf",
		"TRMNL16-Bold.ttf",
		"TRMNL21-Regular.ttf",
		"TRMNL21-Bold.ttf",
	]) {
		expect(fs.existsSync(`assets/fonts/${font}`)).toBe(true);
		expect(rendererSource).toContain(font);
	}
	expect(rendererSource).toContain('["DejaVu Sans", "DejaVuSans.ttf", 400]');
	expect(rendererSource).not.toContain('["Inter"');
	expect(rendererSource).toContain("new Renderer()");
	expect(rendererSource).toContain("await renderer.registerFont(font)");
	expect(rendererSource).toContain("return new Uint8Array(rendered)");
	expect(rendererSource).not.toContain("loadFonts");
	expect(rendererSource).toContain("this.renderer ??=");
	expect(rendererSource).toContain("private retainedFonts: Font[] | null");
	expect(rendererSource).toContain("this.retainedFonts = fonts");
	expect(rendererSource).toContain("options.supersample ?? 1");
});

test("Takumi optional 2x supersampling preserves logical geometry", async () => {
	const bmp = await takumiRenderer.renderHtmlToBmp(
		'<div style="width:8px;height:8px;background:#fff"><div style="width:4px;height:8px;background:#000"></div></div>',
		{
			width: 8,
			height: 8,
			threshold: 170,
			ditherMode: "threshold",
			supersample: 2,
		},
	);
	const pixelOffset = bmp.readUInt32LE(10);
	const rowStride = 4;
	for (let y = 0; y < 8; y += 1) {
		expect(bmp[pixelOffset + y * rowStride]).toBe(0x0f);
	}
});

test("Takumi serializes concurrent native renders", async () => {
	const html =
		'<div style="width:32px;height:32px;background:#fff"><div style="width:16px;height:32px;background:#000"></div></div>';
	const renders = await Promise.all(
		Array.from({ length: 8 }, () =>
			takumiRenderer.renderHtmlToBmp(html, {
				width: 32,
				height: 32,
				threshold: 170,
				ditherMode: "floyd-steinberg",
			}),
		),
	);
	expect(renders.every((bmp) => bmp.equals(renders[0]))).toBe(true);
});

test("display font selection snaps nearby sizes to native TRMNL strikes", () => {
	expect(displayFontFamily(12, "Inter")).toBe("TRMNL12");
	expect(displayFontFamily(13, "Inter")).toBe("TRMNL12");
	expect(displayFontFamily(16, "TRMNL21")).toBe("TRMNL16");
	expect(displayFontFamily(18, "TRMNL21")).toBe("TRMNL16");
	expect(displayFontFamily(21, "TRMNL16")).toBe("TRMNL21");
	expect(displayFontFamily(22, "TRMNL16")).toBe("TRMNL21");
	expect(displayFontFamily(24, "TRMNL21")).toBe("TRMNL21");
	expect(displayFontFamily(27, "TRMNL21")).toBe("Geist");
	expect(displayFontFamily(40, "Symbola")).toBe("Symbola");
	expect(displayFontSelection(18, "Inter")).toEqual({
		family: "TRMNL16",
		fontSize: 16,
	});
});

test("display font optimization fixes imported inline widget typography", () => {
	const optimized = optimizeDisplayFonts(
		'<div style="font-family:TRMNL21;font-size:24px;font-weight:700"><span style="font-family:Inter;font-size:12px">News today</span><b style="font-family:Symbola;font-size:40px">☀</b><strong style="font-family:TRMNL16;font-size:35px;font-weight:bold">801</strong></div>',
	);

	expect(optimized).toContain("font-family:TRMNL21;font-size:21px");
	expect(optimized).toContain("font-family:TRMNL12;font-size:12px");
	expect(optimized).toContain("font-family:Symbola;font-size:40px");
	expect(optimized).toContain(
		"font-family:Geist;font-size:35px;font-weight:bold",
	);
	expect(
		optimizeDisplayFonts('<span style="font-size:18px">Nearest face</span>'),
	).toContain("font-family:TRMNL16;font-size:16px");
	expect(
		optimizeDisplayFonts(
			'<span style="font-family:Inter">Inherited size</span>',
		),
	).toContain("font-family:Geist");
	expect(
		optimizeDisplayFonts(
			"<style>.large { font-family: Inter; font-size: 32px; }</style>",
		),
	).toContain("font-family:Geist");
});

test("supersampled RGBA is box-filtered before 1-bit conversion", () => {
	const raw = new Uint8Array([
		0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
	]);
	expect(downsampleRgbaToGrayscale(raw, 1, 1, 2)).toEqual(
		new Uint8Array([191]),
	);
});

test("partially transparent Takumi pixels are composited onto white", () => {
	expect(
		monochromePixelsWithRegions(
			new Uint8Array([0, 0, 0, 64]),
			1,
			1,
			4,
			100,
			"threshold",
		),
	).toEqual(new Uint8Array([1]));
});

test("static assets negotiate gzip and revalidate with ETags", async () => {
	const root = testDbPath("static-assets-root").replace(/\.db$/, "");
	const staticDir = nodePath.join(root, "static");
	fs.mkdirSync(staticDir, { recursive: true });
	fs.writeFileSync(nodePath.join(staticDir, "app.js"), "plain bundle");
	fs.writeFileSync(nodePath.join(staticDir, "app.js.gz"), "gzip bundle");

	const response = staticAssetResponse(
		new Request("http://tiding.test/static/app.js", {
			headers: { "Accept-Encoding": "gzip, deflate" },
		}),
		root,
	);
	expect(response?.status).toBe(200);
	expect(response?.headers.get("content-encoding")).toBe("gzip");
	expect(response?.headers.get("cache-control")).toContain("must-revalidate");
	expect(await response?.text()).toBe("gzip bundle");

	const etag = response?.headers.get("etag") || "";
	const cached = staticAssetResponse(
		new Request("http://tiding.test/static/app.js", {
			headers: { "Accept-Encoding": "gzip", "If-None-Match": etag },
		}),
		root,
	);
	expect(cached?.status).toBe(304);
});

test("versioned SVG icon assets use the SVG MIME type and immutable cache", async () => {
	const root = testDbPath("static-svg-root").replace(/\.db$/, "");
	const iconDir = nodePath.join(root, "static", "icons", "lucide-1.23.0");
	fs.mkdirSync(iconDir, { recursive: true });
	fs.writeFileSync(
		nodePath.join(iconDir, "gauge.svg"),
		'<svg xmlns="http://www.w3.org/2000/svg"></svg>',
	);

	const response = staticAssetResponse(
		new Request("http://tiding.test/static/icons/lucide-1.23.0/gauge.svg"),
		root,
	);
	expect(response?.status).toBe(200);
	expect(response?.headers.get("content-type")).toBe(
		"image/svg+xml; charset=utf-8",
	);
	expect(response?.headers.get("cache-control")).toBe(
		"public, max-age=31536000, immutable",
	);
});

test("content-hashed frontend chunks use immutable caching", async () => {
	const root = testDbPath("static-chunk-root").replace(/\.db$/, "");
	const chunkDir = nodePath.join(root, "static", "js", "chunks");
	fs.mkdirSync(chunkDir, { recursive: true });
	fs.writeFileSync(nodePath.join(chunkDir, "designer-abc123.js"), "export {};");

	const response = staticAssetResponse(
		new Request("http://tiding.test/static/js/chunks/designer-abc123.js"),
		root,
	);
	expect(response?.status).toBe(200);
	expect(response?.headers.get("cache-control")).toBe(
		"public, max-age=31536000, immutable",
	);
});

test("admin shell references cached SVG icon assets instead of inline SVG", () => {
	const html = renderShell({ title: "Icons", children: "content" });
	expect(html).toContain("/static/icons/lucide-1.23.0/gauge.svg");
	expect(html).not.toContain('<svg class="icon"');
	expect(html).not.toContain("strokewidth=");
});

test("render settings preserve the imported Inker e-ink configuration", () => {
	expect(
		renderSettingsFromRows([
			{
				id: 1,
				key: "eink_rendering",
				value: '{"ditheringMode":"threshold","threshold":170}',
				created_at: "2026-01-01",
				updated_at: "2026-01-01",
			},
		]),
	).toEqual({ ditherMode: "threshold", threshold: 170 });
});

test("palette maps imported custom widgets to a compatibility custom template", () => {
	const items = frameworkPaletteItems(
		[
			{
				id: 15,
				name: "custom-widget-base",
				label: "Custom Widget",
				category: "custom",
				defaultConfig: "{}",
				min_width: 100,
				min_height: 50,
				created_at: "2026-01-01",
			},
		],
		[
			{
				id: 7,
				name: "News Today",
				data_source_id: 1,
				displayType: "text",
				config: "{}",
				min_width: 240,
				min_height: 120,
				created_at: "2026-01-01",
				updated_at: "2026-01-01",
			},
		],
	);

	expect(items).toHaveLength(1);
	const [newsToday] = items;
	if (!newsToday) throw new Error("Expected the imported custom widget");
	expect(newsToday.label).toBe("News Today");
	expect(palettePayload(newsToday)).toEqual({
		template_id: 15,
		config: '{"customWidgetId":7}',
		width: 240,
		height: 120,
	});
});

function expectDisplayImageUrl(
	imageUrl: string,
	expected: {
		origin: string;
		pathname: string;
		battery?: number;
		wifi?: number;
		deviceName?: string;
		format?: string;
	},
) {
	const parsed = new URL(imageUrl);
	expect(parsed.origin).toBe(expected.origin);
	expect(parsed.pathname).toBe(expected.pathname);
	expect(Number(parsed.searchParams.get("t"))).toBeGreaterThan(0);
	if (expected.battery !== undefined) {
		expect(parsed.searchParams.get("battery")).toBe(String(expected.battery));
	}
	if (expected.wifi !== undefined) {
		expect(parsed.searchParams.get("wifi")).toBe(String(expected.wifi));
	}
	if (expected.deviceName !== undefined) {
		expect(parsed.searchParams.get("deviceName")).toBe(expected.deviceName);
	}
	expect(parsed.searchParams.get("format")).toBe(expected.format ?? "bmp");
}

function expectMonochromeBmp(
	bmp: Buffer,
	expected: { width: number; height: number },
) {
	expect(bmp.subarray(0, 2).toString("ascii")).toBe("BM");
	expect(bmp.readUInt32LE(10)).toBe(62);
	expect(bmp.readInt32LE(18)).toBe(expected.width);
	expect(Math.abs(bmp.readInt32LE(22))).toBe(expected.height);
	expect(bmp.readUInt16LE(28)).toBe(1);
	const pixelData = bmp.subarray(bmp.readUInt32LE(10));
	expect(pixelData.length).toBeGreaterThan(0);
	expect(pixelData.some((byte) => byte !== 0)).toBe(true);
}

async function waitForHttp(url: string) {
	let lastError: unknown;
	for (let attempt = 0; attempt < 40; attempt += 1) {
		try {
			const response = await fetch(url);
			if (response.ok) return response;
		} catch (error) {
			lastError = error;
		}
		await Bun.sleep(50);
	}
	throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

function sourceFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = nodePath.join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.(ts|tsx|css)$/.test(entry.name) ? [path] : [];
	});
}

test("database bootstrap is explicit and creates the observed compatibility schema", async () => {
	const service = new DatabaseService(testDbPath("bootstrap"), {
		bootstrap: true,
	});
	const bootstrapDb = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	expect(
		(bootstrapDb.query("PRAGMA busy_timeout").get() as { timeout: number })
			.timeout,
	).toBe(5_000);
	expect(
		(
			bootstrapDb.query("PRAGMA journal_mode").get() as {
				journal_mode: string;
			}
		).journal_mode,
	).toBe("wal");

	const id = await service.screens.create("Test Screen", "Testing description");
	expect(id).toBeGreaterThan(0);

	const screen = await service.screens.findById(id);
	expect(screen?.name).toBe("Test Screen");
	expect(await service.settings.get("data_source_timeout_ms")).toBe("2000");

	await service.screens.update(id, "Updated Name", "Updated desc");
	const updated = await service.screens.findById(id);
	expect(updated?.name).toBe("Updated Name");

	await service.screens.delete(id);
	expect(await service.screens.findById(id)).toBeNull();

	service.close();
});

test("architecture stays Bun-native without Prisma, Nest, libSQL, or browser renderers", () => {
	const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const dependencyNames = Object.keys({
		...(packageJson.dependencies ?? {}),
		...(packageJson.devDependencies ?? {}),
	});
	const forbiddenDependencies = [
		"prisma",
		"@prisma/client",
		"@nestjs/common",
		"@nestjs/core",
		"nestjs",
		"@libsql/client",
		"express",
		"fastify",
		"koa",
		"puppeteer",
		"playwright",
	];

	for (const dependency of forbiddenDependencies) {
		expect(dependencyNames).not.toContain(dependency);
	}

	const forbiddenImportPattern =
		/(from\s+["'][^"']*(prisma|@nestjs|nestjs|libsql|express|fastify|koa|puppeteer|playwright)[^"']*["']|import\s*\([^)]*(prisma|@nestjs|nestjs|libsql|express|fastify|koa|puppeteer|playwright)[^)]*\))/i;
	const files = sourceFiles("src");
	const forbiddenImports = files.filter((file) =>
		forbiddenImportPattern.test(fs.readFileSync(file, "utf8")),
	);
	expect(forbiddenImports).toEqual([]);

	const takumiImports = files.filter((file) =>
		fs.readFileSync(file, "utf8").includes("takumi-js"),
	);
	expect(takumiImports).toEqual([
		nodePath.join("src", "rendering", "takumi", "renderer.ts"),
	]);
});

test("admin frontend stays JSX-rendered, CSS-module styled, and i18n-ready", () => {
	const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
		dependencies?: Record<string, string>;
	};
	const shellSource = fs.readFileSync("src/frontend/shell.tsx", "utf8");
	const shellCss = fs.readFileSync("src/frontend/styles/shell.css", "utf8");
	const navigationCss = fs.readFileSync(
		"src/frontend/styles/navigation.css",
		"utf8",
	);
	const navigationSource = fs.readFileSync(
		"src/frontend/navigation-island.ts",
		"utf8",
	);
	const navigationFormSource = fs.readFileSync(
		"src/frontend/navigation-form.ts",
		"utf8",
	);
	const navigationPageSource = fs.readFileSync(
		"src/frontend/navigation-page.ts",
		"utf8",
	);
	const pagesSource = fs.readFileSync("src/frontend/pages.tsx", "utf8");
	const adminRoutesSource = fs.readFileSync(
		"src/frontend/admin-routes.ts",
		"utf8",
	);
	const islandsSource = fs.readFileSync("src/frontend/islands.tsx", "utf8");
	const arkPageIslandSource = fs.readFileSync(
		"src/frontend/page-islands/ark.tsx",
		"utf8",
	);
	const designerPageIslandSource = fs.readFileSync(
		"src/frontend/page-islands/designer.ts",
		"utf8",
	);
	const domPageIslandSource = fs.readFileSync(
		"src/frontend/page-islands/dom.ts",
		"utf8",
	);
	const arkTabsSource = fs.readFileSync(
		"src/frontend/ark-tabs-island.tsx",
		"utf8",
	);
	const settingsRouteSource = fs.readFileSync(
		"src/frontend/routes/settings.tsx",
		"utf8",
	);
	const islandDomSource = fs.readFileSync("src/frontend/island-dom.ts", "utf8");
	const designerToolbarSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-toolbar.ts",
		"utf8",
	);
	const designerToolbarRouteSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-toolbar-view.tsx",
		"utf8",
	);
	const designerPropertiesSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-properties.tsx",
		"utf8",
	);
	const designerConfigPanelSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-config-panels.tsx",
		"utf8",
	);
	const designerWidgetActionsSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-widget-actions.tsx",
		"utf8",
	);
	const deviceFormSource = fs.readFileSync(
		"src/frontend/features/devices/device-form.tsx",
		"utf8",
	);
	const deviceEditSource = fs.readFileSync(
		"src/frontend/features/devices/device-edit-controls.tsx",
		"utf8",
	);
	const screenFormSource = fs.readFileSync(
		"src/frontend/features/screens/screen-form.tsx",
		"utf8",
	);
	const dataSourceFormSource = fs.readFileSync(
		"src/frontend/features/data-sources/data-source-form.tsx",
		"utf8",
	);
	const dataSourceFetchStateSource = fs.readFileSync(
		"src/frontend/features/data-sources/data-source-fetch-state.tsx",
		"utf8",
	);
	const playlistControlsSource = fs.readFileSync(
		"src/frontend/features/playlists/playlist-controls.tsx",
		"utf8",
	);
	const designerStatusSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-status.ts",
		"utf8",
	);
	const designerKeyboardSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-keyboard.ts",
		"utf8",
	);
	const designerPropertySource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-property-controls.ts",
		"utf8",
	);
	const designerIslandSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-island.ts",
		"utf8",
	);
	const designerPaletteAddSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-palette-add.ts",
		"utf8",
	);
	const designerPayloadSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-payload.ts",
		"utf8",
	);
	const buttonCss = fs.readFileSync(
		"src/frontend/design-system/buttons.css",
		"utf8",
	);
	const fieldsCss = fs.readFileSync(
		"src/frontend/design-system/fields.css",
		"utf8",
	);
	const iconCss = fs.readFileSync(
		"src/frontend/design-system/icon.css",
		"utf8",
	);
	const segmentedCss = fs.readFileSync(
		"src/frontend/design-system/segmented-control.css",
		"utf8",
	);
	const tabsCss = fs.readFileSync(
		"src/frontend/design-system/tabs.css",
		"utf8",
	);
	const surfacesCss = fs.readFileSync(
		"src/frontend/design-system/surfaces.css",
		"utf8",
	);
	const themeCss = fs.readFileSync("src/frontend/styles/theme.css", "utf8");
	const designerCss = fs.readFileSync(
		"src/frontend/features/designer/designer.css",
		"utf8",
	);
	const designerPaletteCss = fs.readFileSync(
		"src/frontend/features/designer/designer-palette.css",
		"utf8",
	);
	const designerCanvasCss = fs.readFileSync(
		"src/frontend/features/designer/designer-canvas.css",
		"utf8",
	);
	const designerResponsiveCss = fs.readFileSync(
		"src/frontend/features/designer/designer-responsive.css",
		"utf8",
	);
	const screenComposerSource = fs.readFileSync(
		"src/rendering/composer/screen-composer.tsx",
		"utf8",
	);
	const screenDocumentSource = fs.readFileSync(
		"src/rendering/composer/screen-document.tsx",
		"utf8",
	);
	const iconSource = fs.readFileSync(
		"src/frontend/design-system/lucide-icons.ts",
		"utf8",
	);
	const buttonSource = fs.readFileSync(
		"src/frontend/design-system/buttons.tsx",
		"utf8",
	);
	const formControlsSource = fs.readFileSync(
		"src/frontend/design-system/form-controls.tsx",
		"utf8",
	);
	const nativeControlsSource = fs.readFileSync(
		"src/frontend/design-system/native-controls.tsx",
		"utf8",
	);
	const tabsSource = fs.readFileSync(
		"src/frontend/design-system/tabs.tsx",
		"utf8",
	);
	const segmentedSource = fs.readFileSync(
		"src/frontend/design-system/segmented-control.tsx",
		"utf8",
	);
	const frameworkSource = fs.readFileSync(
		"src/rendering/composer/framework-widgets.tsx",
		"utf8",
	);
	const paletteModelSource = fs.readFileSync(
		"src/frontend/features/designer/screen-designer-palette-model.ts",
		"utf8",
	);
	const widgetTemplateSeedSource = fs.readFileSync(
		"src/db/widget-template-seed.ts",
		"utf8",
	);
	const setupScreenSource = fs.readFileSync(
		"src/services/setup-screen.tsx",
		"utf8",
	);
	const buildScript = fs.readFileSync("build-islands.sh", "utf8");
	const frontendSpec = fs.readFileSync("docs/agent-loop/frontend.md", "utf8");
	const backendSpec = fs.readFileSync("docs/agent-loop/backend.md", "utf8");

	expect(packageJson.dependencies?.preact).toBeTruthy();
	expect(packageJson.dependencies?.["preact-iso"]).toBeTruthy();
	expect(packageJson.dependencies?.["preact-render-to-string"]).toBeTruthy();
	expect(packageJson.dependencies?.interactjs).toBeTruthy();
	expect(packageJson.dependencies?.["@ark-ui/react"]).toBeTruthy();
	expect(packageJson.dependencies?.["lucide-react"]).toBeTruthy();
	expect(iconSource).toContain('iconAsset("bring-to-front")');
	expect(iconSource).toContain('iconAsset("zoom-in")');
	expect(iconSource).toContain("/static/icons/lucide-");
	expect(iconSource).not.toContain('from "lucide-react"');
	expect(buildScript).toContain("build-lucide-icons.ts");
	expect(buttonSource).toContain("data-park-variant");
	expect(buttonSource).toContain("export function Button");
	expect(buttonSource).toContain("export function ButtonLink");
	expect(buttonSource).toContain("export function IconButton");
	expect(segmentedSource).toContain("export function SegmentedControl");
	expect(segmentedSource).toContain("export function SegmentedItem");
	expect(segmentedSource).toContain('data-scope="segmented-control"');
	expect(designerToolbarRouteSource).toContain("<IconButton");
	expect(designerToolbarRouteSource).toContain("<Button");
	expect(designerToolbarRouteSource).toContain("<SegmentedControl");
	expect(designerToolbarRouteSource).toContain("<SegmentedItem");
	expect(designerToolbarRouteSource).toContain("data-grid-toggle");
	expect(designerWidgetActionsSource).toContain("<IconButton");
	expect(formControlsSource).toContain("TemplateSelect");
	expect(formControlsSource).toContain("DisplayTypeSelect");
	expect(nativeControlsSource).toContain("SelectControl");
	expect(nativeControlsSource).toContain("CheckboxField");
	expect(nativeControlsSource).toContain("RadioField");
	expect(nativeControlsSource).toContain("TextField");
	expect(nativeControlsSource).toContain('"search"');
	expect(nativeControlsSource).toContain("TextareaField");
	expect(nativeControlsSource).toContain("NumberField");
	expect(nativeControlsSource).toContain('scope="text-field"');
	expect(nativeControlsSource).toContain('scope="textarea-field"');
	expect(nativeControlsSource).toContain('scope="number-field"');
	expect(nativeControlsSource).toContain("data-scope={scope}");
	expect(designerPropertiesSource).toContain("<NumberField");
	expect(designerPropertiesSource).toContain("<ButtonLink");
	expect(designerPropertiesSource).not.toContain(
		'className={"button secondary"}',
	);
	expect(designerPropertiesSource).not.toContain('type="number"');
	expect(designerConfigPanelSource).toContain("<TextField");
	expect(designerConfigPanelSource).toContain("<NumberField");
	expect(designerConfigPanelSource).toContain("<CheckboxField");
	expect(deviceFormSource).toContain("<TextField");
	expect(deviceFormSource).toContain("<NumberField");
	expect(deviceEditSource).toContain("<TextField");
	expect(screenFormSource).toContain("<TextField");
	expect(screenFormSource).not.toContain("<TextareaField");
	expect(screenFormSource).toContain("<NumberField");
	expect(dataSourceFormSource).toContain("<TextField");
	expect(dataSourceFormSource).toContain("<TextareaField");
	expect(dataSourceFormSource).toContain("<NumberField");
	expect(dataSourceFetchStateSource).toContain("<TextareaField");
	expect(playlistControlsSource).toContain("<TextField");
	expect(playlistControlsSource).toContain("<TextareaField");
	expect(playlistControlsSource).toContain("<NumberField");
	expect(tabsSource).toContain('data-island="ark-tabs"');
	expect(tabsSource).toContain('data-scope="tabs"');
	expect(tabsSource).toContain("hidden={item.value !== defaultValue}");
	expect(arkTabsSource).toContain('from "@ark-ui/react/tabs"');
	expect(arkTabsSource).toContain("<Tabs.Root");
	expect(arkTabsSource).toContain("<Tabs.Trigger");
	expect(arkTabsSource).toContain("<Tabs.Content");
	expect(arkTabsSource).toContain("item.contentElement.hidden = false");
	expect(settingsRouteSource).toContain("<TabsShell");
	expect(
		sourceFiles("src/frontend")
			.filter((file) => /\.(ts|tsx)$/.test(file))
			.filter(
				(file) =>
					!file.endsWith(nodePath.join("design-system", "native-controls.tsx")),
			)
			.filter((file) =>
				/<select|type="checkbox"|type="radio"|type="range"/.test(
					fs.readFileSync(file, "utf8"),
				),
			),
	).toEqual([]);
	expect(
		sourceFiles("src/frontend")
			.filter((file) => /\.(ts|tsx)$/.test(file))
			.filter(
				(file) => !file.endsWith(nodePath.join("design-system", "buttons.tsx")),
			)
			.filter((file) => /<button/.test(fs.readFileSync(file, "utf8"))),
	).toEqual([]);
	expect(fs.existsSync("src/frontend/forms.tsx")).toBe(false);
	expect(packageJson.dependencies?.ttag).toBeTruthy();
	expect(fs.existsSync("src/frontend/styles/admin.module.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/park.css")).toBe(false);
	expect(fs.existsSync("src/frontend/design-system/buttons.css")).toBe(true);
	expect(fs.existsSync("src/frontend/design-system/fields.css")).toBe(true);
	expect(fs.existsSync("src/frontend/design-system/form-controls.css")).toBe(
		true,
	);
	expect(fs.existsSync("src/frontend/design-system/icon.css")).toBe(true);
	expect(
		fs.existsSync("src/frontend/design-system/segmented-control.css"),
	).toBe(true);
	expect(fs.existsSync("src/frontend/design-system/surfaces.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/theme.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/shell.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/layout.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/components.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/dialog.css")).toBe(true);
	expect(fs.existsSync("src/frontend/styles/form-controls.css")).toBe(false);
	for (const oldFeatureCss of [
		"devices.css",
		"playlists.css",
		"render-settings.css",
		"screen-form.css",
		"screens.css",
		"widget-config.css",
		"wizard.css",
		"welcome.css",
		"designer.css",
		"designer-toolbar.css",
		"designer-panels.css",
		"designer-responsive.css",
	]) {
		expect(fs.existsSync(`src/frontend/styles/${oldFeatureCss}`)).toBe(false);
	}
	for (const featureCss of [
		"src/frontend/features/devices/devices.css",
		"src/frontend/features/playlists/playlists.css",
		"src/frontend/features/settings/render-settings.css",
		"src/frontend/features/screens/screen-form.css",
		"src/frontend/features/screens/screens.css",
		"src/frontend/features/widgets/widget-config.css",
		"src/frontend/features/custom-widgets/wizard.css",
		"src/frontend/features/settings/welcome.css",
		"src/frontend/features/designer/designer.css",
		"src/frontend/features/designer/designer-canvas.css",
		"src/frontend/features/designer/designer-toolbar.css",
		"src/frontend/features/designer/designer-panels.css",
		"src/frontend/features/designer/designer-responsive.css",
	]) {
		expect(fs.existsSync(featureCss)).toBe(true);
	}
	expect(fs.existsSync("src/frontend/styles/responsive.css")).toBe(true);
	expect(
		fs.existsSync("src/frontend/features/designer/screen-designer-island.ts"),
	).toBe(true);
	for (const designerModule of [
		"screen-designer-canvas.tsx",
		"screen-designer-config-panels.tsx",
		"screen-designer-inspector.tsx",
		"screen-designer-model.ts",
		"screen-designer-page.tsx",
		"screen-designer-palette-add.ts",
		"screen-designer-palette-model.ts",
		"screen-designer-palette.tsx",
		"screen-designer-properties.tsx",
		"screen-designer-toolbar-view.tsx",
		"screen-designer-widget-count.ts",
		"screen-designer-widget-actions.tsx",
	]) {
		expect(
			fs.existsSync(`src/frontend/features/designer/${designerModule}`),
		).toBe(true);
		const routeName = designerModule.replace("-toolbar-view", "-toolbar");
		expect(fs.existsSync(`src/frontend/routes/${routeName}`)).toBe(false);
	}
	expect(
		fs.readFileSync("src/frontend/routes/screen-designer.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.existsSync("src/frontend/features/widgets/framework-config-model.ts"),
	).toBe(true);
	for (const widgetModule of [
		"widget-context-fields.tsx",
		"widget-framework-fields.tsx",
		"widget-form.tsx",
		"widget-pages.tsx",
	]) {
		expect(fs.existsSync(`src/frontend/features/widgets/${widgetModule}`)).toBe(
			true,
		);
	}
	expect(fs.existsSync("src/frontend/routes/framework-config-model.ts")).toBe(
		false,
	);
	expect(fs.existsSync("src/frontend/routes/widget-config-fields.tsx")).toBe(
		false,
	);
	expect(fs.existsSync("src/frontend/routes/widget-context-fields.tsx")).toBe(
		false,
	);
	expect(fs.existsSync("src/frontend/routes/widget-form.tsx")).toBe(false);
	expect(
		fs.readFileSync("src/frontend/routes/widget-pages.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.existsSync("src/frontend/features/screens/screen-package-dialogs.tsx"),
	).toBe(true);
	expect(
		fs.readFileSync(
			"src/frontend/features/screens/screen-package-dialogs.tsx",
			"utf8",
		),
	).toContain("<TextareaField");
	expect(
		fs.existsSync("src/frontend/features/screens/screen-editor-page.tsx"),
	).toBe(true);
	expect(fs.existsSync("src/frontend/features/screens/screen-form.tsx")).toBe(
		true,
	);
	expect(fs.existsSync("src/frontend/features/screens/screen-pages.tsx")).toBe(
		true,
	);
	expect(
		fs.existsSync("src/frontend/features/screens/screen-widgets.tsx"),
	).toBe(true);
	expect(fs.existsSync("src/frontend/routes/screen-package-dialogs.tsx")).toBe(
		false,
	);
	expect(fs.existsSync("src/frontend/routes/screen-editor-page.tsx")).toBe(
		false,
	);
	expect(fs.existsSync("src/frontend/routes/screen-form.tsx")).toBe(false);
	expect(fs.existsSync("src/frontend/routes/screen-pages.tsx")).toBe(false);
	expect(fs.existsSync("src/frontend/routes/screen-widgets.tsx")).toBe(false);
	expect(
		fs.readFileSync("src/frontend/routes/screens.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.readFileSync("src/frontend/routes/screen-editor.tsx", "utf8"),
	).not.toContain("<section");
	for (const deviceModule of [
		"device-detail-page.tsx",
		"device-current-screen.tsx",
		"device-edit-controls.tsx",
		"device-facts.tsx",
		"device-firmware.tsx",
		"device-form.tsx",
		"device-grid.tsx",
		"device-inventory.ts",
		"device-inventory-filters.tsx",
		"device-pages.tsx",
		"device-playlist-assignment.tsx",
		"device-table.tsx",
	]) {
		expect(fs.existsSync(`src/frontend/features/devices/${deviceModule}`)).toBe(
			true,
		);
		expect(fs.existsSync(`src/frontend/routes/${deviceModule}`)).toBe(false);
	}
	expect(
		fs.readFileSync("src/frontend/routes/devices.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.readFileSync("src/frontend/routes/device-detail.tsx", "utf8"),
	).not.toContain("<section");
	for (const playlistModule of [
		"playlist-composer.tsx",
		"playlist-controls.tsx",
		"playlist-detail-page.tsx",
		"playlist-item-rows.tsx",
		"playlist-items-table.tsx",
		"playlist-layout-select.tsx",
		"playlist-overview-page.tsx",
		"playlist-resolution-notice.tsx",
	]) {
		expect(
			fs.existsSync(`src/frontend/features/playlists/${playlistModule}`),
		).toBe(true);
		expect(fs.existsSync(`src/frontend/routes/${playlistModule}`)).toBe(false);
	}
	expect(
		fs.readFileSync("src/frontend/routes/playlists.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.readFileSync("src/frontend/routes/playlist-new.tsx", "utf8"),
	).not.toContain("<section");
	for (const dataSourceModule of [
		"data-source-fetch-state.tsx",
		"data-source-form.tsx",
		"data-source-pages.tsx",
		"data-source-row.tsx",
	]) {
		expect(
			fs.existsSync(`src/frontend/features/data-sources/${dataSourceModule}`),
		).toBe(true);
		expect(fs.existsSync(`src/frontend/routes/${dataSourceModule}`)).toBe(
			false,
		);
	}
	expect(
		fs.readFileSync("src/frontend/routes/data-sources.tsx", "utf8"),
	).not.toContain("<section");
	for (const customWidgetModule of [
		"custom-widget-form.tsx",
		"custom-widget-pages.tsx",
		"custom-widget-wizard.tsx",
		"custom-widget-wizard-preview.tsx",
		"custom-widget-wizard-steps.tsx",
	]) {
		expect(
			fs.existsSync(
				`src/frontend/features/custom-widgets/${customWidgetModule}`,
			),
		).toBe(true);
		expect(fs.existsSync(`src/frontend/routes/${customWidgetModule}`)).toBe(
			false,
		);
	}
	expect(
		fs.readFileSync("src/frontend/routes/custom-widgets.tsx", "utf8"),
	).not.toContain("<section");
	for (const settingsModule of [
		"rendering-settings.tsx",
		"runtime-settings.tsx",
		"security-settings.tsx",
		"welcome-settings.tsx",
	]) {
		const source = fs.readFileSync(
			`src/frontend/features/settings/${settingsModule}`,
			"utf8",
		);
		expect(
			fs.existsSync(`src/frontend/features/settings/${settingsModule}`),
		).toBe(true);
		expect(fs.existsSync(`src/frontend/routes/${settingsModule}`)).toBe(false);
		expect(source).toContain("<Button");
		expect(source).not.toContain("<button");
	}
	expect(
		fs.existsSync("src/frontend/features/settings/compatibility-report.tsx"),
	).toBe(true);
	expect(
		fs.readFileSync("src/frontend/routes/settings.tsx", "utf8"),
	).not.toContain("<section");
	expect(fs.existsSync("src/frontend/features/auth/login-page.tsx")).toBe(true);
	expect(
		fs.readFileSync("src/frontend/features/auth/login-page.tsx", "utf8"),
	).toContain("<TextField");
	expect(
		fs.readFileSync(
			"src/frontend/features/devices/device-inventory-filters.tsx",
			"utf8",
		),
	).toContain("<TextField");
	expect(
		fs.readFileSync(
			"src/frontend/features/designer/screen-designer-palette.tsx",
			"utf8",
		),
	).toContain("<TextField");
	expect(fs.existsSync("src/frontend/routes/login-page.tsx")).toBe(false);
	expect(fs.existsSync("src/frontend/routes/compatibility-report.tsx")).toBe(
		false,
	);
	expect(fs.readFileSync("src/frontend/routes/auth.tsx", "utf8")).not.toContain(
		"<section",
	);
	for (const dashboardModule of [
		"dashboard-overview.tsx",
		"dashboard-recent-lists.tsx",
	]) {
		expect(
			fs.existsSync(`src/frontend/features/dashboard/${dashboardModule}`),
		).toBe(true);
		expect(fs.existsSync(`src/frontend/routes/${dashboardModule}`)).toBe(false);
	}
	expect(
		fs.readFileSync("src/frontend/routes/dashboard.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.existsSync("src/frontend/features/extensions/extensions-overview.tsx"),
	).toBe(true);
	expect(fs.existsSync("src/frontend/routes/extensions-overview.tsx")).toBe(
		false,
	);
	expect(
		fs.readFileSync("src/frontend/routes/extensions.tsx", "utf8"),
	).not.toContain("<section");
	expect(
		fs.existsSync("src/frontend/features/plugins/plugins-overview.tsx"),
	).toBe(true);
	expect(fs.existsSync("src/frontend/routes/plugins-overview.tsx")).toBe(false);
	expect(
		fs.readFileSync("src/frontend/routes/plugins.tsx", "utf8"),
	).not.toContain("<section");
	expect(fs.existsSync("src/frontend/screen-designer-island.ts")).toBe(false);
	expect(fs.existsSync("src/frontend/styles/admin.module.ts")).toBe(false);
	expect(buildScript).toContain("src/frontend/islands.tsx");
	expect(buildScript).toContain("--production");
	expect(buildScript).toContain("--splitting");
	expect(buildScript).toContain("public/static/js");
	expect(buildScript).not.toContain("--define");
	expect(buildScript).toContain('find public/static/js -type f -name "*.js"');
	expect(islandsSource).toContain('import("./page-islands/ark")');
	expect(islandsSource).toContain('import("./page-islands/designer")');
	expect(islandsSource).toContain('import("./page-islands/dom")');
	expect(islandsSource).not.toContain('from "@ark-ui/react/accordion"');
	expect(islandsSource).not.toContain('from "react-dom/client"');
	expect(islandsSource).not.toContain("screen-designer-island");
	expect(buildScript).toContain("src/frontend/styles/admin.module.css");
	expect(buildScript).not.toContain("src/frontend/styles/park.css");
	expect(buildScript).not.toContain("src/frontend/styles/devices.css");
	expect(buildScript).not.toContain("src/frontend/styles/designer.css");
	expect(buildScript).toContain("src/frontend/design-system/buttons.css");
	expect(buildScript).toContain("src/frontend/design-system/fields.css");
	expect(buildScript).toContain("src/frontend/design-system/form-controls.css");
	expect(buildScript).toContain("src/frontend/design-system/icon.css");
	expect(buildScript).toContain(
		"src/frontend/design-system/segmented-control.css",
	);
	expect(buildScript).toContain("src/frontend/design-system/surfaces.css");
	expect(buildScript).toContain("src/frontend/design-system/tabs.css");
	expect(buildScript).toContain("src/frontend/styles/theme.css");
	expect(buildScript).toContain("src/frontend/styles/shell.css");
	expect(buildScript).toContain("src/frontend/styles/navigation.css");
	expect(buildScript).toContain("src/frontend/styles/layout.css");
	expect(buildScript).toContain("src/frontend/styles/components.css");
	expect(buildScript).toContain("src/frontend/styles/dialog.css");
	expect(buildScript).not.toContain("src/frontend/styles/form-controls.css");
	expect(
		fs.readFileSync("src/frontend/features/screens/screen-form.tsx", "utf8"),
	).toContain('<Button type="submit"');
	expect(fs.existsSync("src/frontend/routes/screen-form.tsx")).toBe(false);
	expect(fs.existsSync("src/frontend/routes/screen-widgets.tsx")).toBe(false);
	expect(
		fs.readFileSync(
			"src/frontend/features/data-sources/data-source-form.tsx",
			"utf8",
		),
	).toContain('<Button type="submit"');
	expect(
		fs.readFileSync(
			"src/frontend/features/custom-widgets/custom-widget-form.tsx",
			"utf8",
		),
	).toContain('<Button type="submit"');
	expect(
		fs.readFileSync(
			"src/frontend/features/custom-widgets/custom-widget-form.tsx",
			"utf8",
		),
	).toContain("<TextField");
	expect(
		fs.readFileSync(
			"src/frontend/features/custom-widgets/custom-widget-form.tsx",
			"utf8",
		),
	).toContain("<NumberField");
	expect(
		fs.readFileSync(
			"src/frontend/features/custom-widgets/custom-widget-form.tsx",
			"utf8",
		),
	).toContain("<TextareaField");
	expect(
		fs.readFileSync(
			"src/frontend/features/custom-widgets/custom-widget-wizard.tsx",
			"utf8",
		),
	).toContain("<TextField");
	expect(
		fs.readFileSync(
			"src/frontend/features/custom-widgets/custom-widget-wizard.tsx",
			"utf8",
		),
	).toContain("<TextareaField");
	expect(
		fs.readFileSync("src/frontend/features/widgets/widget-form.tsx", "utf8"),
	).toContain('<Button type="submit"');
	expect(
		fs.readFileSync("src/frontend/features/widgets/widget-form.tsx", "utf8"),
	).toContain("<NumberField");
	expect(
		fs.readFileSync("src/frontend/features/widgets/widget-form.tsx", "utf8"),
	).toContain("<TextareaField");
	expect(
		fs.readFileSync(
			"src/frontend/features/playlists/playlist-item-rows.tsx",
			"utf8",
		),
	).toContain("<NumberField");
	expect(
		fs.readFileSync(
			"src/frontend/features/widgets/widget-framework-fields.tsx",
			"utf8",
		),
	).toContain("<TextField");
	expect(
		fs.readFileSync(
			"src/frontend/features/widgets/widget-framework-fields.tsx",
			"utf8",
		),
	).toContain("<CheckboxField");
	expect(
		fs.readFileSync(
			"src/frontend/features/widgets/widget-context-fields.tsx",
			"utf8",
		),
	).toContain("<NumberField");
	expect(
		fs.readFileSync(
			"src/frontend/features/widgets/widget-context-fields.tsx",
			"utf8",
		),
	).toContain("<CheckboxField");
	expect(fs.existsSync("src/frontend/routes/widget-form.tsx")).toBe(false);
	expect(buildScript).toContain("src/frontend/features/devices/devices.css");
	expect(buildScript).toContain(
		"src/frontend/features/playlists/playlists.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/settings/render-settings.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/screens/screen-form.css",
	);
	expect(buildScript).toContain("src/frontend/features/screens/screens.css");
	expect(buildScript).toContain(
		"src/frontend/features/widgets/widget-config.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/custom-widgets/wizard.css",
	);
	expect(buildScript).toContain("src/frontend/features/settings/welcome.css");
	expect(buildScript).toContain("src/frontend/features/designer/designer.css");
	expect(buildScript).toContain(
		"src/frontend/features/designer/designer-canvas.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/designer/designer-toolbar.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/designer/designer-palette.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/designer/designer-panels.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/designer/designer-widgets.css",
	);
	expect(buildScript).toContain(
		"src/frontend/features/designer/designer-responsive.css",
	);
	expect(buildScript).toContain("src/frontend/styles/responsive.css");
	expect(designerResponsiveCss).toContain(".designerStage");
	expect(designerResponsiveCss).toContain("order: 1");
	expect(designerResponsiveCss).toContain(".designerInspector");
	expect(designerResponsiveCss).toContain("order: 2");
	expect(designerResponsiveCss).toContain(".designerPalette");
	expect(designerResponsiveCss).toContain("order: 3");
	expect(designerPaletteCss).toContain(".paletteItem[hidden]");
	expect(designerPaletteCss).toContain("display: none");
	expect(designerCss).toContain("--designer-zoom");
	expect(designerCss).toContain(".designerCanvasViewport");
	expect(designerCss).toContain("background: #f0f1f2");
	expect(designerCss).toContain(".designerCanvasRender");
	expect(designerCss).not.toContain("linear-gradient");
	expect(designerCanvasCss).toContain(".designerEmptyState");
	expect(designerCanvasCss).toContain('[data-drop-active="true"]');
	expect(designerCanvasCss).toContain(".designerCanvasBounds");
	expect(
		fs.readFileSync(
			"src/frontend/features/designer/screen-designer-controls.ts",
			"utf8",
		),
	).toContain('from "interactjs"');
	expect(designerToolbarSource).toContain("data-designer-zoom-action");
	expect(designerToolbarSource).toContain("initialZoom(root)");
	expect(designerToolbarSource).toContain("[data-grid-toggle]");
	expect(designerToolbarSource).toContain("Grid off");
	expect(designerCanvasCss).toContain(
		'.designerShell[data-grid="false"] .designerCanvasBounds',
	);
	expect(designerToolbarSource).toContain("[data-selection-save]");
	expect(designerToolbarSource).toContain("Layout already saved");
	expect(designerStatusSource).toContain("[data-designer-status]");
	expect(designerStatusSource).toContain("[data-designer-selection-summary]");
	expect(designerKeyboardSource).toContain("ArrowLeft");
	expect(designerKeyboardSource).toContain("patchWidget");
	expect(designerKeyboardSource).toContain("Widget moved");
	expect(designerPropertySource).toContain("applyFrameworkFields");
	expect(designerPropertySource).toContain("syncDisplayLabel");
	expect(designerPropertySource).toContain("[data-widget-config-field]");
	expect(designerPaletteAddSource).toContain("parseDesignerWidgetPayload");
	expect(designerIslandSource).toContain("dropActive");
	expect(designerIslandSource).not.toContain("JSON.parse(");
	expect(
		fs.readFileSync(
			"src/frontend/features/designer/screen-designer-interactions.ts",
			"utf8",
		),
	).toContain("button.dataset.state");
	expect(designerPayloadSource).toContain("DesignerWidgetPayload");
	expect(frontendSpec).toContain("interact.js");
	expect(buttonCss).toContain('[data-park-variant="solid"]');
	expect(buttonCss).toContain('[data-park-variant="surface"]');
	expect(fieldsCss).toContain("input,");
	expect(iconCss).toContain(".icon");
	expect(segmentedCss).toContain(".parkSegmented");
	expect(segmentedCss).toContain(".parkSegmentedControl");
	expect(tabsCss).toContain(".parkTabs");
	expect(tabsCss).toContain(".parkTabTrigger");
	expect(surfacesCss).toContain(".parkCard");
	expect(themeCss).toContain('[data-theme="dark"]');

	expect(shellSource).toContain("renderToString(");
	expect(shellSource).toContain("<html");
	expect(shellSource).toContain("data-theme-picker");
	expect(shellSource).not.toContain("data-theme-option");
	expect(shellSource).toContain("data-theme-bootstrap");
	expect(shellSource).toContain("document.documentElement.dataset.theme");
	expect(shellSource).toContain("tiding.theme");
	expect(shellSource.indexOf("data-theme-bootstrap")).toBeLessThan(
		shellSource.indexOf("/static/admin.css"),
	);
	expect(shellSource).toContain("data-nav-link");
	expect(shellSource).toContain("data-nav-menu");
	expect(shellSource).toContain("data-shell-status");
	expect(shellSource).toContain("data-no-shell-navigation");
	expect(shellSource).toContain("themePickerLabel");
	expect(shellSource).toContain("paletteIcon");
	expect(shellSource).toContain("/static/js/islands.js");
	expect(shellSource).toContain('type="module"');
	expect(shellSource).not.toContain('from "./styles/admin.module"');
	expect(shellSource).toContain('from "ttag"');
	expect(shellSource).not.toContain("<style");
	expect(shellSource).toContain("dangerouslySetInnerHTML");
	const shellHtml = renderShell({ title: "Test", children: "Body" });
	expect(shellHtml).toContain('data-theme-picker="true"');
	expect(shellHtml).toContain('class="navMobileMenu"');
	expect(shellHtml).toContain('data-shell-status="true"');
	expect(shellHtml).toContain('data-no-shell-navigation="true"');
	expect(shellHtml).toContain('class="themePickerLabel"');
	expect(shellHtml).toContain('const key = "tiding.theme"');
	expect(shellHtml).not.toContain("&quot;tiding.theme&quot;");
	expect(shellHtml.indexOf("data-theme-bootstrap")).toBeLessThan(
		shellHtml.indexOf("/static/admin.css"),
	);
	expect(navigationCss).toContain(".navMobileMenu");
	expect(navigationCss).toContain(".navLinksDesktop");
	expect(navigationCss).toContain(".shellStatus");
	expect(shellCss).not.toContain("linear-gradient");
	expect(navigationCss).not.toContain("linear-gradient");
	expect(navigationSource).toContain("hydrateFormNavigation");
	expect(navigationSource).toContain("installPageResponse");
	expect(navigationFormSource).toContain("new FormData(form, submitter)");
	expect(navigationFormSource).toContain("new URLSearchParams(");
	expect(navigationFormSource).toContain('Accept: "text/html"');
	expect(navigationFormSource).toContain("event.preventDefault()");
	expect(navigationPageSource).toContain(
		"heading.focus({ preventScroll: true })",
	);
	expect(navigationPageSource).toContain('"replaceState" : "pushState"');
	expect(screenDocumentSource).toContain("renderToString(");
	expect(screenDocumentSource).toContain("<html");
	expect(screenComposerSource).not.toContain("html: `");
	expect(screenComposerSource).not.toContain("widgetHtml +=");
	expect(setupScreenSource).toContain("renderToString(");
	expect(setupScreenSource).toContain('from "ttag"');
	expect(setupScreenSource).not.toContain("return `");
	expect(pagesSource).not.toContain('from "./styles/admin.module"');
	expect(pagesSource).toContain("renderAdminRoute");
	expect(pagesSource).not.toContain("else if");
	expect(fs.readFileSync("src/frontend/router.ts", "utf8")).toContain(
		'from "preact-iso/router"',
	);
	expect(adminRoutesSource).toContain('from "ttag"');
	expect(adminRoutesSource).toContain("const adminRoutes");
	expect(adminRoutesSource).not.toContain("pathname.match");
	expect(frameworkSource).toContain("FRAMEWORK_WIDGET_DEFINITIONS");
	expect(screenComposerSource).toContain("frameworkWidgetInstance");
	expect(paletteModelSource).toContain("frameworkPaletteItems");
	expect(paletteModelSource).toContain("frameworkPaletteGroups");
	expect(paletteModelSource).toContain("CUSTOM_WIDGET_FRAMEWORK_NAME");
	expect(paletteModelSource).toContain("predefined-framework");
	expect(paletteModelSource).toContain("custom-js-framework");
	expect(designerPaletteAddSource).toContain("addDesignerPaletteWidget");
	expect(designerPaletteAddSource).toContain("Adding widget");
	expect(designerPaletteAddSource).toContain("window.location.reload");
	expect(designerPaletteAddSource).toContain("placedWidgetCount");
	expect(designerPaletteAddSource).toContain(
		'querySelectorAll(".designerWidget")',
	);
	expect(designerPaletteAddSource).toContain("Math.min");
	expect(designerIslandSource).toContain(
		"paletteClickPosition(canvas, payload)",
	);
	expect(widgetTemplateSeedSource).toContain("FRAMEWORK_WIDGET_DEFINITIONS");
	expect(widgetTemplateSeedSource).not.toContain("defaultConfigFor");
	expect(islandDomSource).toContain("[data-json-editor]");
	expect(islandDomSource).toContain("hydrateResolutionPresets");
	expect(islandsSource).not.toContain('from "./styles/admin.module"');
	expect(designerPageIslandSource).toContain(
		'from "../features/designer/screen-designer-island"',
	);
	expect(arkPageIslandSource).toContain('from "ttag"');
	expect(arkPageIslandSource).toContain("hydrateArkDialogs");
	expect(arkPageIslandSource).toContain("hydrateArkTabs");
	expect(islandsSource).toContain("hydrateThemePicker");
	expect(islandsSource).toContain("hydratePersistentNavigation");
	expect(domPageIslandSource).toContain("hydrateWidgetConfigFields");
	expect(islandsSource).not.toContain("alert(");
	expect(islandsSource).not.toContain("Saved");
	expect(islandsSource).not.toContain("In a real app");
	expect(frontendSpec).toContain("Server-rendered Preact JSX");
	expect(frontendSpec).toContain("CSS modules");
	expect(frontendSpec).toContain("ttag");
	expect(backendSpec).toContain("cached 1-bit monochrome BMP");
	expect(backendSpec).toContain("partial updates");
});

test("designer widget placement payload is explicit and validated", () => {
	const payload = {
		template_id: 7,
		config: '{"text":"Hello"}',
		width: 240,
		height: 120,
	};

	expect(
		parseDesignerWidgetPayload(serializeDesignerWidgetPayload(payload)),
	).toEqual(payload);
	expect(parseDesignerWidgetPayload('{"template_id":0}')).toBeNull();
	expect(parseDesignerWidgetPayload('{"template_id":3,"width":-1}')).toEqual({
		template_id: 3,
		config: "{}",
		width: 200,
		height: 100,
	});
	expect(parseDesignerWidgetPayload("bad json")).toBeNull();
});

test("admin frontend source files stay below the readability limit", () => {
	const oversized = sourceFiles("src/frontend")
		.map((file) => ({
			file,
			lines: fs.readFileSync(file, "utf8").split(/\r?\n/).length,
		}))
		.filter(({ lines }) => lines > 150);

	expect(oversized).toEqual([]);
});

test("admin pages support optional PIN login", async () => {
	const service = new DatabaseService(testDbPath("admin-pin-login"), {
		bootstrap: true,
	});
	const options = {
		dbPath: ":memory:",
		port: 43337,
		cachePath: testDbPath("admin-pin-cache"),
		version: "0.1.0",
		mcpEnabled: false,
		adminPin: "1111",
	};

	try {
		const blocked = await handleAdminPage(
			new Request("http://tiding.test/screens"),
			service,
			options,
		);
		expect(blocked?.status).toBe(302);
		expect(blocked?.headers.get("Location")).toBe("/login");

		const loginPage = await handleAdminPage(
			new Request("http://tiding.test/login"),
			service,
			options,
		);
		const loginHtml = await loginPage?.text();
		expect(loginHtml).toContain('data-scope="text-field"');
		expect(loginHtml).toContain('name="pin"');

		const badLogin = await handleAdminPage(
			new Request("http://tiding.test/login", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({ pin: "0000" }),
			}),
			service,
			options,
		);
		expect(badLogin?.status).toBe(401);
		expect(await badLogin?.text()).toContain("Invalid PIN");

		const goodLogin = await handleAdminPage(
			new Request("http://tiding.test/login", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({ pin: "1111" }),
			}),
			service,
			options,
		);
		expect(goodLogin?.status).toBe(303);
		expect(goodLogin?.headers.get("Location")).toBe("/dashboard");
		const cookie = goodLogin?.headers.get("Set-Cookie") ?? "";
		expect(cookie).toContain("tiding_session=");

		const dashboard = await handleAdminPage(
			new Request("http://tiding.test/dashboard", {
				headers: { Cookie: cookie },
			}),
			service,
			options,
		);
		expect(dashboard?.status).toBe(200);
		expect(await dashboard?.text()).toContain("Online Devices");
	} finally {
		service.close();
	}
});

test("runtime server config hardens idle sockets and disables dev mode by default", () => {
	expect(runtimeServerConfig({})).toEqual({
		port: 43337,
		idleTimeout: 10,
		development: false,
	});

	expect(
		runtimeServerConfig({
			PORT: "70000",
			TIDING_HTTP_IDLE_TIMEOUT_SECONDS: "999",
			TIDING_DEV_SERVER: "1",
		}),
	).toEqual({
		port: 65535,
		idleTimeout: 255,
		development: true,
	});

	expect(
		runtimeServerConfig({
			PORT: "0",
			TIDING_HTTP_IDLE_TIMEOUT_SECONDS: "0",
			TIDING_DEV_SERVER: "0",
		}),
	).toEqual({
		port: 1,
		idleTimeout: 1,
		development: false,
	});
});

test("http benchmark helper reports stable latency summaries", () => {
	const summary = summarizeSamples([10.123, 2, 30, 20, 5]);
	expect(summary).toEqual({
		count: 5,
		minMs: 2,
		maxMs: 30,
		avgMs: 13.42,
		p50Ms: 10.12,
		p95Ms: 30,
	});

	const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
		scripts?: Record<string, string>;
	};
	expect(packageJson.scripts?.["benchmark:http"]).toBe(
		"bun run src/benchmark/http-benchmark.ts",
	);
	expect(packageJson.scripts?.build).toBe(
		"bun run build:frontend && bun run build:server",
	);
	expect(packageJson.scripts?.["build:server"]).toBe(
		"bun build src/index.ts --target=bun --outdir=dist",
	);
	expect(packageJson.scripts?.["compile:server:rpi"]).toContain(
		"--target=bun-linux-arm64",
	);
	expect(packageJson.scripts?.["package:rpi"]).toContain(
		"tools/package-rpi.ts",
	);
	const rpiPackager = fs.readFileSync("tools/package-rpi.ts", "utf8");
	expect(rpiPackager).toContain("core-linux-arm64-gnu");
	expect(rpiPackager).toContain("TAKUMI_CORE_TARGET");
	expect(rpiPackager).toContain("TIDING_TIME_ZONE=Europe/Berlin");
});

test("empty databases fail closed unless bootstrap is enabled", () => {
	expect(() => new DatabaseService(testDbPath("empty"))).toThrow(
		"Unsupported database schema",
	);
});

test("schema report describes supported and unsupported compatibility state", () => {
	const supported = new DatabaseService(
		syntheticCompatDbPath("schema-supported"),
	);
	const supportedReport = supported.schemaReport();
	expect(supportedReport.ok).toBe(true);
	expect(supportedReport.missingTables).toEqual([]);
	expect(supportedReport.missingColumns).toEqual({});
	expect(supportedReport.requiredTables).toContain("screen_designs");
	expect(supportedReport.observedTables).toContain("screen_designs");
	expect(
		supportedReport.tables.find((table) => table.table === "screen_designs"),
	).toMatchObject({
		present: true,
		missingColumns: [],
	});
	supported.close();

	const db = new Database(":memory:");
	try {
		db.query("CREATE TABLE screen_designs (id INTEGER PRIMARY KEY)").run();
		const report = compatibilitySchemaReport(db);
		expect(report.ok).toBe(false);
		expect(report.missingTables).toContain("devices");
		expect(report.missingColumns.screen_designs).toContain("name");
		expect(
			report.tables.find((table) => table.table === "screen_designs"),
		).toMatchObject({
			present: true,
			presentColumns: ["id"],
		});
	} finally {
		db.close();
	}
});

test("synthetic compatibility database opens without bootstrap or destructive migration", async () => {
	const compatPath = syntheticCompatDbPath("compat-open");
	const beforeStat = fs.statSync(compatPath);
	const service = new DatabaseService(compatPath);

	const screens = await service.screens.findAll();
	const widgets = await service.widgets.findByScreenDesign(screens[0].id);
	const customWidgets = await service.customWidgets.findAll();
	const dataSources = await service.dataSources.findAll();
	const device = await service.devices.findByHttpId("AA:BB:CC:DD:EE:03");

	expect(screens.length).toBeGreaterThan(0);
	expect(widgets.length).toBeGreaterThan(0);
	expect(customWidgets.length).toBeGreaterThan(0);
	expect(dataSources.length).toBeGreaterThan(0);
	expect(device?.friendly_id).toBe("sample-device");
	expect(fs.statSync(compatPath).size).toBe(beforeStat.size);

	service.close();
});

test("synthetic compatibility database supports test-only CRUD while preserving existing rows", async () => {
	const service = new DatabaseService(syntheticCompatDbPath("compat-crud"));
	const existingScreens = await service.screens.findAll();
	const existingDataSources = await service.dataSources.findAll();

	const screenId = await service.screens.create(
		"Tiding Compatibility Test",
		"created on a copied DB",
	);
	await service.screens.update(screenId, "Tiding Compatibility Updated");
	expect((await service.screens.findById(screenId))?.name).toBe(
		"Tiding Compatibility Updated",
	);
	await service.screens.delete(screenId);
	expect(await service.screens.findById(screenId)).toBeNull();

	const sourceId = await service.dataSources.create({
		name: "Tiding compatibility source",
		url: "http://127.0.0.1/compat",
		method: "GET",
	});
	await service.dataSources.updateCache(sourceId, '{"ok":true}', null);
	expect((await service.dataSources.findById(sourceId))?.last_data).toBe(
		'{"ok":true}',
	);
	await service.dataSources.delete(sourceId);
	expect(await service.dataSources.findById(sourceId)).toBeNull();

	expect((await service.screens.findAll()).length).toBe(existingScreens.length);
	expect((await service.dataSources.findAll()).length).toBe(
		existingDataSources.length,
	);

	service.close();
});

test("additive migrations create a timestamped backup before changing schema", async () => {
	const dbPath = syntheticCompatDbPath("migration-backup");
	const service = new DatabaseService(dbPath);
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;

	const result = runAdditiveMigrations(
		db,
		dbPath,
		[
			{
				name: "add-screen-note",
				statements: [
					"ALTER TABLE screen_designs ADD COLUMN migration_note TEXT",
				],
			},
		],
		{ now: new Date("2026-07-07T14:30:05Z") },
	);

	expect(result.applied).toEqual(["add-screen-note"]);
	expect(nodePath.basename(result.backupPath)).toMatch(
		/^20260707-143005-migration-backup-.+\.db$/,
	);
	expect(fs.existsSync(result.backupPath)).toBe(true);
	expect(fs.statSync(result.backupPath).size).toBeGreaterThan(0);
	const columns = db
		.query("PRAGMA table_info(screen_designs)")
		.all()
		.map((row) => (row as { name: string }).name);
	expect(columns).toContain("migration_note");

	const backupDb = new Database(result.backupPath);
	try {
		const backupColumns = backupDb
			.query("PRAGMA table_info(screen_designs)")
			.all()
			.map((row) => (row as { name: string }).name);
		expect(backupColumns).not.toContain("migration_note");
	} finally {
		backupDb.close();
	}

	service.close();
});

test("migration helper refuses destructive statements", async () => {
	const dbPath = syntheticCompatDbPath("migration-destructive");
	const service = new DatabaseService(dbPath);
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;

	expect(() =>
		runAdditiveMigrations(db, dbPath, [
			{
				name: "drop-screens",
				statements: ["DROP TABLE screen_designs"],
			},
		]),
	).toThrow("Refusing non-additive migration statement");
	const backupDir = nodePath.join(nodePath.dirname(dbPath), "backups");
	const matchingBackups = fs.existsSync(backupDir)
		? fs
				.readdirSync(backupDir)
				.filter((name) => name.includes(nodePath.basename(dbPath)))
		: [];
	expect(matchingBackups).toEqual([]);

	service.close();
});

test("synthetic compatibility database supports a real HTTP workflow", async () => {
	const dbPath = syntheticCompatDbPath("compat-http-workflow");
	const cachePath = nodePath.join(
		"/tmp",
		"tiding-tests",
		`compat-http-cache-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	);
	const port = 45500 + Math.floor(Math.random() * 1000);
	const base = `http://127.0.0.1:${port}`;
	const proc = Bun.spawn(["bun", "run", "src/index.ts"], {
		cwd: process.cwd(),
		env: {
			...process.env,
			DB_PATH: dbPath,
			CACHE_PATH: cachePath,
			PORT: String(port),
			TIDING_ADMIN_PIN: "",
		},
		stdout: "pipe",
		stderr: "pipe",
	});

	try {
		await waitForHttp(`${base}/api/health`);

		const screensResponse = await fetch(`${base}/api/screen-designs`);
		expect(screensResponse.status).toBe(200);
		const screens = (await screensResponse.json()) as Array<{ id: number }>;
		expect(screens.length).toBeGreaterThan(0);

		const firmwareResponse = await fetch(`${base}/api/firmware`);
		expect(firmwareResponse.status).toBe(200);
		const firmware = (await firmwareResponse.json()) as {
			data: { items: Array<{ version: string; downloadUrl: string }> };
		};
		expect(firmware.data.items[0]).toMatchObject({
			version: "1.0.0",
			downloadUrl: "https://example.com/firmware/v1.0.0.bin",
		});

		const playlistsResponse = await fetch(`${base}/api/playlists`);
		expect(playlistsResponse.status).toBe(200);
		const playlists = (await playlistsResponse.json()) as {
			data: { items: Array<{ id: number; name: string }>; total: number };
		};
		expect(playlists.data.total).toBeGreaterThan(0);
		expect(playlists.data.items[0]).toMatchObject({
			id: 1,
			name: "Sample playlist",
			isActive: true,
		});

		const playlistItemsResponse = await fetch(`${base}/api/playlists/1/items`);
		expect(playlistItemsResponse.status).toBe(200);
		const playlistItems = (await playlistItemsResponse.json()) as {
			data: {
				items: Array<{
					playlistId: number;
					screenDesignId: number;
					kind: string;
					order: number;
					duration: number;
				}>;
				total: number;
			};
		};
		expect(playlistItems.data.total).toBeGreaterThan(0);
		expect(playlistItems.data.items[0]).toMatchObject({
			playlistId: 1,
			screenDesignId: 1,
			kind: "screen",
			order: 0,
		});

		const devicesResponse = await fetch(`${base}/api/devices`);
		expect(devicesResponse.status).toBe(200);
		const devices = (await devicesResponse.json()) as {
			data: {
				items: Array<{
					id: number;
					label: string;
					friendlyId: string;
					macAddress: string;
					apiKeyPreview: string;
					hasApiKey: boolean;
				}>;
				total: number;
			};
		};
		expect(devices.data.total).toBeGreaterThan(0);
		const compatDevice = devices.data.items[0];
		expect(compatDevice).toMatchObject({
			label: "Sample TRMNL",
			friendlyId: "sample-device",
			macAddress: "AA:BB:CC:DD:EE:03",
			hasApiKey: true,
		});
		expect(compatDevice.id).toBeGreaterThan(0);
		expect(compatDevice.apiKeyPreview).toContain("...");
		expect(JSON.stringify(devices)).not.toContain("synthetic-api-key");

		const deviceDetailResponse = await fetch(
			`${base}/api/devices/${compatDevice.id}`,
		);
		expect(deviceDetailResponse.status).toBe(200);
		const deviceDetail = (await deviceDetailResponse.json()) as {
			data: { playlistId: number; assignmentsUrl: string; logsUrl: string };
		};
		expect(deviceDetail.data.playlistId).toBe(1);
		expect(deviceDetail.data.assignmentsUrl).toBe(
			`/api/devices/${compatDevice.id}/assignments`,
		);
		expect(deviceDetail.data.logsUrl).toBe(
			`/api/devices/${compatDevice.id}/logs`,
		);

		const stalePreview = encodeRawTo1BitBmp(
			new Uint8Array(800 * 480).fill(255),
			{ width: 800, height: 480 },
		);
		fs.writeFileSync(nodePath.join(cachePath, "screen-1.bmp"), stalePreview);
		const currentScreenResponse = await fetch(
			`${base}/api/devices/${compatDevice.id}/current-screen.bmp`,
		);
		expect(currentScreenResponse.status).toBe(200);
		expect(currentScreenResponse.headers.get("Content-Type")).toBe("image/bmp");
		expect(currentScreenResponse.headers.get("Cache-Control")).toBe("no-store");
		const currentScreenBmp = Buffer.from(
			await currentScreenResponse.arrayBuffer(),
		);
		expectMonochromeBmp(currentScreenBmp, { width: 800, height: 480 });
		expect(currentScreenBmp.equals(stalePreview)).toBe(false);

		const schemaResponse = await fetch(`${base}/api/schema`);
		expect(schemaResponse.status).toBe(200);
		const schema = (await schemaResponse.json()) as {
			database: string;
			bootstrap: boolean;
			compatibility: {
				ok: boolean;
				requiredTables: string[];
				observedTables: string[];
				missingTables: string[];
				missingColumns: Record<string, string[]>;
				tables: Array<{
					table: string;
					present: boolean;
					missingColumns: string[];
				}>;
			};
		};
		expect(schema.database).toBe(dbPath);
		expect(schema.bootstrap).toBe(false);
		expect(schema.compatibility.ok).toBe(true);
		expect(schema.compatibility.missingTables).toEqual([]);
		expect(schema.compatibility.missingColumns).toEqual({});
		expect(schema.compatibility.requiredTables).toContain("devices");
		expect(schema.compatibility.observedTables).toContain("devices");
		expect(
			schema.compatibility.tables.find((table) => table.table === "devices"),
		).toMatchObject({ present: true, missingColumns: [] });

		const adminResponse = await fetch(`${base}/screens`);
		expect(adminResponse.status).toBe(200);
		expect(await adminResponse.text()).toContain("Admin Console");

		const displayResponse = await fetch(`${base}/api/display`, {
			headers: { HTTP_ID: "AA:BB:CC:DD:EE:03" },
		});
		expect(displayResponse.status).toBe(200);
		const display = (await displayResponse.json()) as {
			image_url: string;
			filename: string;
			refresh_rate: number;
		};
		expectDisplayImageUrl(display.image_url, {
			origin: base,
			pathname: `/cache/screen-1-device-${compatDevice.id}.bmp`,
			format: "bmp",
		});
		expect(display.filename).toMatch(
			new RegExp(`^screen-1-device-${compatDevice.id}-[a-f0-9]{12}\\.bmp$`),
		);
		expect(display.refresh_rate).toBeGreaterThan(0);
		const displayImage = await fetch(display.image_url);
		expect(displayImage.status).toBe(200);
		expect(displayImage.headers.get("Content-Type")).toBe("image/bmp");
		expectMonochromeBmp(Buffer.from(await displayImage.arrayBuffer()), {
			width: 800,
			height: 480,
		});

		const previewResponse = await fetch(`${base}/api/screen-designs/1/preview`);
		expect(previewResponse.status).toBe(200);
		expect(previewResponse.headers.get("Content-Type")).toBe("image/bmp");
		const bmp = Buffer.from(await previewResponse.arrayBuffer());
		expectMonochromeBmp(bmp, { width: 800, height: 480 });
		expect(fs.existsSync(nodePath.join(cachePath, "screen-1.bmp"))).toBe(true);

		const setupResponse = await fetch(`${base}/api/setup-screen.bmp`);
		expect(setupResponse.status).toBe(200);
		expect(setupResponse.headers.get("Content-Type")).toBe("image/bmp");
		expect(setupResponse.headers.get("Cache-Control")).toBe("no-store");
		const setupBmp = Buffer.from(await setupResponse.arrayBuffer());
		expectMonochromeBmp(setupBmp, { width: 800, height: 480 });

		const missingApiResponse = await fetch(`${base}/api/current_screen`, {
			headers: { HTTP_ID: "AA:BB:CC:DD:EE:03" },
		});
		expect(missingApiResponse.status).toBe(404);
		expect(missingApiResponse.headers.get("Content-Type")).toBe(
			"application/json",
		);
		expect(await missingApiResponse.json()).toMatchObject({
			statusCode: 404,
			path: "/api/current_screen",
			method: "GET",
			message: "Cannot GET /api/current_screen",
			error: "Not Found",
		});
	} finally {
		proc.kill();
		await proc.exited;
		await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);
	}
});

test("public device APIs bypass admin auth redirects", async () => {
	const dbPath = syntheticCompatDbPath("public-device-api-auth");
	const cachePath = nodePath.join(
		"/tmp",
		"tiding-tests",
		`public-device-cache-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	);
	const port = 45500 + Math.floor(Math.random() * 1000);
	const base = `http://127.0.0.1:${port}`;
	const proc = Bun.spawn(["bun", "run", "src/index.ts"], {
		cwd: process.cwd(),
		env: {
			...process.env,
			DB_PATH: dbPath,
			CACHE_PATH: cachePath,
			PORT: String(port),
			TIDING_ADMIN_PIN: "1111",
		},
		stdout: "pipe",
		stderr: "pipe",
	});

	try {
		await waitForHttp(`${base}/api/health`);
		for (const apiPath of ["/api/setup", "/api/display", "/api/firmware"]) {
			const response = await fetch(`${base}${apiPath}`, {
				headers: { HTTP_ID: "AA:BB:CC:DD:EE:03" },
			});
			expect(response.status).not.toBe(302);
			expect(response.headers.get("Location")).toBeNull();
			expect(response.headers.get("Content-Type")).toContain(
				"application/json",
			);
		}
	} finally {
		proc.kill();
		await proc.exited;
		await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);
	}
});

test("synthetic compatibility database surfaces seeded rows in admin pages", async () => {
	const dbPath = syntheticCompatDbPath("compat-admin-pages");
	const service = new DatabaseService(dbPath);
	const options = {
		dbPath,
		port: 43337,
		cachePath: testDbPath("compat-admin-cache"),
		version: "0.1.0",
		mcpEnabled: false,
	};

	const pages = new Map<string, string>();
	for (const path of [
		"/screens",
		"/screens/1",
		"/screens/designer/1",
		"/data-sources",
		"/custom-widgets",
		"/devices",
		"/playlists",
		"/playlists/1",
		"/settings",
	]) {
		const response = await handleAdminPage(
			new Request(`http://tiding.test${path}`),
			service,
			options,
		);
		expect(response?.status).toBe(200);
		if (!response) throw new Error(`Missing admin response for ${path}`);
		pages.set(path, await response.text());
	}

	expect(pages.get("/screens")).toContain("Sample Design");
	expect(pages.get("/screens/1")).toContain("Sample Design");
	expect(pages.get("/screens/designer/1")).toContain("designerWidget");
	expect(pages.get("/data-sources")).toContain("Sample news");
	expect(pages.get("/data-sources")).toContain("weather");
	expect(pages.get("/custom-widgets")).toContain("News Today");
	expect(pages.get("/custom-widgets")).toContain("ctx");
	expect(pages.get("/devices")).toContain("Sample TRMNL");
	expect(pages.get("/playlists")).toContain("Sample playlist");
	expect(pages.get("/playlists/1")).toContain("Screen Composer");
	expect(pages.get("/settings")).toContain("Compatibility Schema");
	expect(pages.get("/settings")).toContain("screen_designs");
	expect(pages.get("/settings")).toContain("Missing tables");
	expect(pages.get("/settings")).toContain("none");

	service.close();
});

test("synthetic compatibility database supports specialized edits on existing rows", async () => {
	const service = new DatabaseService(
		syntheticCompatDbPath("compat-edit-existing"),
	);
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const invalidated: number[] = [];

	const screenBefore = await service.screens.findById(1);
	expect(screenBefore).toBeTruthy();
	const screenResponse = await handleScreenDesigns(
		new Request("http://tiding.test/api/screen-designs/1", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ _method: "PATCH", name: "Edited Compat Screen" }),
		}),
		service,
		(id) => invalidated.push(id),
	);
	expect(screenResponse.status).toBe(303);
	expect(await service.screens.findById(1)).toMatchObject({
		name: "Edited Compat Screen",
		width: screenBefore?.width,
		height: screenBefore?.height,
		background: screenBefore?.background,
	});

	const widgetBefore = await service.widgets.findById(66);
	expect(widgetBefore?.config).toContain("Europe/Berlin");
	const widgetResponse = await handleWidgets(
		new Request("http://tiding.test/api/widgets/66", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ x: 12, y: 24 }),
		}),
		service,
		(id) => invalidated.push(id),
	);
	expect(widgetResponse.status).toBe(204);
	expect(await service.widgets.findById(66)).toMatchObject({
		x: 12,
		y: 24,
		width: widgetBefore?.width,
		height: widgetBefore?.height,
		config: widgetBefore?.config,
	});

	const dataSourceBefore = await service.dataSources.findById(5);
	expect(String(dataSourceBefore?.last_data)).toContain("temperature_2m");
	const dataSourceResponse = await handleDataSources(
		new Request("http://tiding.test/api/data-sources/5", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Weather Edited",
				context_schema: JSON.stringify({ city: { type: "string" } }),
			}),
		}),
		service,
		(id) => invalidated.push(id),
	);
	expect(dataSourceResponse.status).toBe(204);
	const dataSourceAfter = await service.dataSources.findById(5);
	expect(dataSourceAfter).toMatchObject({
		name: "Weather Edited",
		url: dataSourceBefore?.url,
		method: dataSourceBefore?.method,
		headers: dataSourceBefore?.headers,
		last_data: dataSourceBefore?.last_data,
	});
	expect(dataSourceAfter?.context_schema).toBe('{"city":{"type":"string"}}');

	const customWidgetBefore = await service.customWidgets.findById(5);
	expect(customWidgetBefore?.template).toContain("weather in");
	const customWidgetResponse = await handleCustomWidgets(
		new Request("http://tiding.test/api/custom-widgets/5", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Weather Widget Edited", min_width: 180 }),
		}),
		service,
		(id) => invalidated.push(id),
	);
	expect(customWidgetResponse.status).toBe(204);
	expect(await service.customWidgets.findById(5)).toMatchObject({
		name: "Weather Widget Edited",
		data_source_id: customWidgetBefore?.data_source_id,
		displayType: customWidgetBefore?.displayType,
		template: customWidgetBefore?.template,
		config: customWidgetBefore?.config,
		context_schema: customWidgetBefore?.context_schema,
		min_width: 180,
	});

	const deviceBefore = await service.devices.findById(3);
	expect(deviceBefore?.mac_address).toBe("AA:BB:CC:DD:EE:03");
	const deviceLabelResponse = await handleDevices(
		new Request("http://tiding.test/api/devices/3", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				_method: "PATCH",
				label: "Edited Compat Device",
			}),
		}),
		service,
	);
	expect(deviceLabelResponse.status).toBe(200);
	const devicePlaylistResponse = await handleDevices(
		new Request("http://tiding.test/api/devices/3/playlist", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ playlist_id: "" }),
		}),
		service,
	);
	expect(devicePlaylistResponse.status).toBe(200);
	const deviceAfter = await service.devices.findById(3);
	expect(deviceAfter).toMatchObject({
		label: "Edited Compat Device",
		mac_address: deviceBefore?.mac_address,
		api_key: deviceBefore?.api_key,
		friendly_id: deviceBefore?.friendly_id,
		playlist_id: null,
	});

	const playlistItemResponse = await handlePlaylists(
		new Request("http://tiding.test/api/playlists/1/items/2", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				_method: "PATCH",
				order: 3,
				duration: 45,
				layout: "2x1",
				slot: 1,
			}),
		}),
		service,
	);
	expect(playlistItemResponse.status).toBe(303);
	const playlistItem = db
		.query(
			'SELECT playlist_id, screen_design_id, kind, "order", duration, config FROM playlist_items WHERE id = ?',
		)
		.get(2) as {
		playlist_id: number;
		screen_design_id: number;
		kind: string;
		order: number;
		duration: number;
		config: string;
	};
	expect(playlistItem).toEqual({
		playlist_id: 1,
		screen_design_id: 1,
		kind: "screen",
		order: 3,
		duration: 45,
		config: '{"layout":"2x1","slot":1}',
	});

	expect(invalidated).toEqual(expect.arrayContaining([1, 2]));

	service.close();
});

test("partial screen updates preserve unknown compatibility columns", async () => {
	const service = new DatabaseService(testDbPath("unknown-column"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	db.query(
		"ALTER TABLE screen_designs ADD COLUMN owner_note TEXT DEFAULT 'keep-me'",
	).run();

	const id = await service.screens.create(
		"Screen With Extra Column",
		"original",
	);
	await service.screens.update(id, "Renamed");

	const row = db
		.query("SELECT owner_note, description FROM screen_designs WHERE id = ?")
		.get(id) as {
		owner_note: string;
		description: string;
	};
	expect(row.owner_note).toBe("keep-me");
	expect(row.description).toBe("original");

	service.close();
});

test("widget create endpoint validates JSON config", async () => {
	const service = new DatabaseService(testDbPath("widget-validation"), {
		bootstrap: true,
	});
	const request = new Request(
		"http://tiding.test/api/screen-designs/1/widgets",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ template_id: 1, config: "{bad json" }),
		},
	);

	const response = await handleWidgets(request, service);
	expect(response.status).toBe(400);

	service.close();
});

test("crud handlers return documented validation and missing-record status classes", async () => {
	const service = new DatabaseService(testDbPath("crud-status-classes"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Status screen");
	const templates = await service.templates.findAll();
	const dataSourceId = await service.dataSources.create({
		name: "Status source",
		url: "http://example.test/status",
		method: "GET",
	});

	const invalidScreen = await handleScreenDesigns(
		new Request("http://tiding.test/api/screen-designs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Bad width", width: "wide" }),
		}),
		service,
	);
	expect(invalidScreen.status).toBe(400);

	const invalidWidget = await handleWidgets(
		new Request(`http://tiding.test/api/screen-designs/${screenId}/widgets`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ template_id: templates[0].id, x: "left" }),
		}),
		service,
	);
	expect(invalidWidget.status).toBe(400);

	const invalidDataSource = await handleDataSources(
		new Request(`http://tiding.test/api/data-sources/${dataSourceId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refresh_interval: "soon" }),
		}),
		service,
	);
	expect(invalidDataSource.status).toBe(400);

	const invalidCustomWidget = await handleCustomWidgets(
		new Request("http://tiding.test/api/custom-widgets", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Bad custom widget",
				data_source_id: dataSourceId,
				min_width: "wide",
			}),
		}),
		service,
	);
	expect(invalidCustomWidget.status).toBe(400);

	const missingScreen = await handleScreenDesigns(
		new Request("http://tiding.test/api/screen-designs/99999", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Missing" }),
		}),
		service,
	);
	expect(missingScreen.status).toBe(404);

	const missingDataSource = await handleDataSources(
		new Request("http://tiding.test/api/data-sources/99999", {
			method: "DELETE",
		}),
		service,
	);
	expect(missingDataSource.status).toBe(404);

	const missingCustomWidgetPreview = await handleCustomWidgets(
		new Request("http://tiding.test/api/custom-widgets/99999/preview"),
		service,
		undefined,
		async () => Buffer.from("should-not-render"),
	);
	expect(missingCustomWidgetPreview.status).toBe(404);

	const conflictingCustomWidget = await handleCustomWidgets(
		new Request("http://tiding.test/api/custom-widgets", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Missing source custom widget",
				data_source_id: 99999,
				config: {},
			}),
		}),
		service,
	);
	expect(conflictingCustomWidget.status).toBe(409);

	service.close();
});

test("bootstrap seeds predefined framework-backed widget templates", async () => {
	const service = new DatabaseService(testDbPath("template-seed"), {
		bootstrap: true,
	});

	const templates = await service.templates.findAll();
	const names = templates.map((template) => template.name);
	expect(names).toEqual(
		FRAMEWORK_WIDGET_TEMPLATE_SEEDS.map((template) => template.name),
	);
	expect(FRAMEWORK_WIDGET_NAMES.sort()).toEqual([...names].sort());
	expect(templates.map((template) => template.category)).toContain(
		"Time & Date",
	);
	expect(templates.map((template) => template.category)).toContain("Weather");
	const customTemplate = templates.find(
		(template) => template.name === CUSTOM_WIDGET_FRAMEWORK_NAME,
	);
	expect(customTemplate?.label).toBe("Custom JS Widget");
	expect(customTemplate?.category).toBe("Custom");

	const textTemplate = templates.find((template) => template.name === "text");
	expect(
		frameworkWidgetInstance({
			config: textTemplate?.defaultConfig || "{}",
			template: textTemplate,
		}),
	).toMatchObject({
		kind: "predefined",
		frameworkName: "text",
		category: textTemplate?.category,
	});
	expect(
		frameworkWidgetInstance({
			config: { customWidgetId: 42 },
			template: customTemplate,
			customWidgets: [
				{
					id: 42,
					name: "Prebuilt Weather",
					data_source_id: 1,
					displayType: "framework",
					config: "{}",
					min_width: 200,
					min_height: 100,
					created_at: "",
					updated_at: "",
				},
			],
		}),
	).toMatchObject({
		kind: "custom-js",
		frameworkName: CUSTOM_WIDGET_FRAMEWORK_NAME,
		label: "Prebuilt Weather",
		category: "Custom",
		customWidgetId: 42,
	});

	const screenId = await service.screens.create("Widget host");
	const request = new Request(
		"http://tiding.test/api/screen-designs/1/widgets",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				template_id: templates[0].id,
				config: '{"text":"Hello"}',
			}),
		},
	);

	const response = await handleWidgets(request, service);
	expect(response.status).toBe(201);
	expect(await service.widgets.findByScreenDesign(screenId)).toHaveLength(1);

	service.close();
});

test("widget template endpoints expose list and item reads", async () => {
	const service = new DatabaseService(testDbPath("template-api"), {
		bootstrap: true,
	});

	const listResponse = await handleWidgetTemplates(
		new Request("http://tiding.test/api/widget-templates"),
		service,
	);
	expect(listResponse.status).toBe(200);
	const templates = (await listResponse.json()) as {
		id: number;
		name: string;
	}[];
	expect(templates[0].name).toBe("text");

	const itemResponse = await handleWidgetTemplates(
		new Request(`http://tiding.test/api/widget-templates/${templates[0].id}`),
		service,
	);
	expect(itemResponse.status).toBe(200);

	service.close();
});

test("firmware endpoints expose black-box-compatible list and item reads", async () => {
	const service = new DatabaseService(syntheticCompatDbPath("firmware-api"));

	const listResponse = await handleFirmware(
		new Request("http://tiding.test/api/firmware"),
		service,
	);
	expect(listResponse.status).toBe(200);
	const list = (await listResponse.json()) as {
		data: {
			items: Array<{
				id: number;
				version: string;
				downloadUrl: string;
				releaseNotes: string | null;
				isStable: boolean;
				createdAt: string;
			}>;
			total: number;
		};
	};
	expect(list.data.total).toBe(1);
	expect(list.data.items[0]).toEqual({
		id: 1,
		version: "1.0.0",
		downloadUrl: "https://example.com/firmware/v1.0.0.bin",
		releaseNotes: "Initial stable release",
		isStable: false,
		createdAt: "2026-05-12T11:03:41.814Z",
	});

	const itemResponse = await handleFirmware(
		new Request("http://tiding.test/api/firmware/1"),
		service,
	);
	expect(itemResponse.status).toBe(200);
	const item = (await itemResponse.json()) as {
		data: { id: number; version: string };
	};
	expect(item.data).toMatchObject({ id: 1, version: "1.0.0" });

	const missingResponse = await handleFirmware(
		new Request("http://tiding.test/api/firmware/99999"),
		service,
	);
	expect(missingResponse.status).toBe(404);
	const missing = (await missingResponse.json()) as {
		statusCode: number;
		path: string;
		message: string;
		error: string;
	};
	expect(missing.statusCode).toBe(404);
	expect(missing.path).toBe("/api/firmware/99999");
	expect(missing.message).toBe("Firmware not found");
	expect(missing.error).toBe("Not Found");

	service.close();
});

test("data source fetch endpoint stores successful GET response data", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch(req) {
			return Response.json({
				method: req.method,
				header: req.headers.get("x-source-test"),
			});
		},
	});
	const service = new DatabaseService(testDbPath("source-fetch-get"), {
		bootstrap: true,
	});

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/payload`);
		const id = await service.dataSources.create({
			name: "GET source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "GET",
			headers: '{"x-source-test":"present"}',
		});

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			ok: true,
			data: '{"method":"GET","header":"present"}',
			fields: [
				{ path: "$", type: "object" },
				{ path: "$.method", type: "string" },
				{ path: "$.header", type: "string" },
			],
		});

		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe('{"method":"GET","header":"present"}');
		expect(source?.last_error).toBeNull();
		expect(source?.last_fetched_at).toBeTruthy();
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint supports POST method", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch(req) {
			return Response.json({ method: req.method });
		},
	});
	const service = new DatabaseService(testDbPath("source-fetch-post"), {
		bootstrap: true,
	});

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/payload`);
		const id = await service.dataSources.create({
			name: "POST source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "POST",
		});

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(200);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe('{"method":"POST"}');
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint sends optional stored POST body when column exists", async () => {
	const upstream = Bun.serve({
		port: 0,
		async fetch(req) {
			return Response.json({ method: req.method, body: await req.text() });
		},
	});
	const service = new DatabaseService(testDbPath("source-fetch-post-body"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	db.query("ALTER TABLE data_sources ADD COLUMN body TEXT").run();

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/payload`);
		const id = await service.dataSources.create({
			name: "POST body source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "POST",
			headers: '{"content-type":"application/json"}',
			body: '{"query":"forecast"}',
		});

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(200);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe(
			'{"method":"POST","body":"{\\"query\\":\\"forecast\\"}"}',
		);
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch resolves context placeholders and reports fields", async () => {
	const upstream = Bun.serve({
		port: 0,
		async fetch(req) {
			const url = new URL(req.url);
			return Response.json({
				city: url.searchParams.get("city"),
				token: req.headers.get("x-city"),
				body: await req.text(),
				nested: { temperature: 19 },
			});
		},
	});
	const service = new DatabaseService(testDbPath("source-fetch-context"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	db.query("ALTER TABLE data_sources ADD COLUMN body TEXT").run();

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/payload`);
		const id = await service.dataSources.create({
			name: "Context source",
			url: `http://127.0.0.1:${upstream.port}/payload?city={ctx.city}`,
			method: "POST",
			headers: '{"x-city":"{ctx.city}"}',
			body: '{"city":"{ctx.city}"}',
		});
		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ test_context: { city: "New York" } }),
			}),
			service,
		);

		expect(response.status).toBe(200);
		const result = (await response.json()) as {
			data: string;
			fields: Array<{ path: string; type: string }>;
		};
		const data = JSON.parse(result.data) as {
			city: string;
			token: string;
			body: string;
		};
		expect(data.city).toBe("New York");
		expect(data.token).toBe("New York");
		expect(JSON.parse(data.body)).toEqual({ city: "New York" });
		expect(result.fields).toContainEqual({
			path: "$.nested.temperature",
			type: "number",
		});
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("admin data source form exposes and preserves stored POST request body", async () => {
	const service = new DatabaseService(testDbPath("source-admin-body"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	db.query("ALTER TABLE data_sources ADD COLUMN body TEXT").run();

	try {
		const createResponse = await handleDataSources(
			new Request("http://tiding.test/api/data-sources", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					name: "Forecast POST",
					url: "http://example.test/forecast",
					method: "POST",
					headers: '{"content-type":"application/json"}',
					body: '{"query":"forecast"}',
					refresh_interval: "300",
				}),
			}),
			service,
		);
		expect(createResponse.status).toBe(303);
		const createdLocation = createResponse.headers.get("Location") || "";
		const sourceId = Number(createdLocation.match(/\d+$/)?.[0]);
		expect(sourceId).toBeGreaterThan(0);

		let source = await service.dataSources.findById(sourceId);
		expect(source?.body).toBe('{"query":"forecast"}');

		const page = await handleAdminPage(
			new Request(`http://tiding.test/data-sources/${sourceId}`),
			service,
			{
				dbPath: ":memory:",
				port: 43337,
				cachePath: testDbPath("admin-body-cache"),
				version: "0.1.0",
				mcpEnabled: false,
			},
		);
		const html = await page?.text();
		expect(html).toContain('name="body"');
		expect(html).toContain('name="context_schema"');
		expect(html).toContain('data-scope="text-field"');
		expect(html).toContain('data-scope="textarea-field"');
		expect(html).toContain('data-scope="number-field"');
		expect(html).toContain("Test context");
		expect(html).toContain("Test URL");
		expect(html).toContain("Request body");
		expect(html).toContain("forecast");

		const updateResponse = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${sourceId}`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					_method: "PATCH",
					body: '{"query":"updated"}',
				}),
			}),
			service,
		);
		expect(updateResponse.status).toBe(303);
		source = await service.dataSources.findById(sourceId);
		expect(source?.body).toBe('{"query":"updated"}');
	} finally {
		service.close();
	}
});

test("data source list supports test all, toggle, usage, and redaction", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch() {
			return Response.json({ ok: true });
		},
	});
	const service = new DatabaseService(testDbPath("source-list-controls"), {
		bootstrap: true,
	});

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/ready`);
		const activeId = await service.dataSources.create({
			name: "Active source",
			url: `http://127.0.0.1:${upstream.port}/active`,
			method: "GET",
			headers: '{"Authorization":"Bearer secret-token"}',
		});
		await service.customWidgets.create({
			name: "Uses source",
			data_source_id: activeId,
			displayType: "text",
			template: "{{ok}}",
			config: "{}",
		});
		await service.dataSources.create({
			name: "Inactive source",
			url: `http://127.0.0.1:${upstream.port}/inactive`,
			method: "GET",
			is_active: false,
		});

		const page = await handleAdminPage(
			new Request("http://tiding.test/data-sources"),
			service,
			{
				dbPath: ":memory:",
				port: 43337,
				cachePath: testDbPath("source-list-controls-cache"),
				version: "0.1.0",
				mcpEnabled: false,
			},
		);
		const html = await page?.text();
		expect(html).toContain("Test All");
		expect(html).toContain("/api/data-sources/test-all");
		expect(html).toContain("/api/data-sources/1/toggle");
		expect(html).toContain("Authorization: ******");
		expect(html).not.toContain("secret-token");
		expect(html).toContain("<td>1</td>");

		const toggleResponse = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${activeId}/toggle`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({ is_active: "0" }),
			}),
			service,
		);
		expect(toggleResponse.status).toBe(303);
		expect(
			Boolean((await service.dataSources.findById(activeId))?.is_active),
		).toBe(false);

		const enableResponse = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${activeId}/toggle`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({ is_active: "1" }),
			}),
			service,
		);
		expect(enableResponse.status).toBe(303);
		expect(
			Boolean((await service.dataSources.findById(activeId))?.is_active),
		).toBe(true);
		const testAllResponse = await handleDataSources(
			new Request("http://tiding.test/api/data-sources/test-all", {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);
		const result = (await testAllResponse.json()) as {
			results: Array<{ id: number; ok: boolean }>;
		};
		expect(result.results.map((entry) => entry.id)).toEqual([activeId]);
		expect(result.results[0].ok).toBe(true);
		expect((await service.dataSources.findById(activeId))?.last_data).toBe(
			'{"ok":true}',
		);
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("RSS and Atom data sources fetch normalized feed JSON", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch(req) {
			const path = new URL(req.url).pathname;
			if (path === "/rss.xml") {
				return new Response(
					`<rss><channel><title>News</title><link>https://example.test</link><description>Latest</description><item><title>First</title><link>https://example.test/first</link><description>One</description><pubDate>Tue, 07 Jul 2026 10:00:00 GMT</pubDate><author>Alice</author></item></channel></rss>`,
					{ headers: { "Content-Type": "application/rss+xml" } },
				);
			}
			return new Response(
				`<feed><title>Atom News</title><link href="https://example.test/atom" rel="alternate"/><subtitle>Updates</subtitle><entry><title>Atom First</title><link href="https://example.test/atom/first"/><summary>Atom one</summary><updated>2026-07-07T10:00:00Z</updated><author><name>Bob</name></author></entry></feed>`,
				{ headers: { "Content-Type": "application/atom+xml" } },
			);
		},
	});
	const service = new DatabaseService(testDbPath("source-feed-fetch"), {
		bootstrap: true,
	});
	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/rss.xml`);
		const rssId = await service.dataSources.create({
			name: "RSS source",
			type: "rss",
			url: `http://127.0.0.1:${upstream.port}/rss.xml`,
			method: "GET",
		});
		const atomId = await service.dataSources.create({
			name: "Atom source",
			type: "atom",
			url: `http://127.0.0.1:${upstream.port}/atom.xml`,
			method: "GET",
			json_path: "$.items[0].title",
		});

		const rssResponse = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${rssId}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);
		expect(rssResponse.status).toBe(200);
		const rssBody = (await rssResponse.json()) as {
			data: string;
			fields: Array<{ path: string }>;
		};
		const rssData = JSON.parse(rssBody.data) as {
			feed: { title: string };
			items: Array<{ title: string; link: string; author: string }>;
		};
		expect(rssData.feed.title).toBe("News");
		expect(rssData.items[0]).toMatchObject({
			title: "First",
			link: "https://example.test/first",
			author: "Alice",
		});
		expect(rssBody.fields.map((field) => field.path)).toContain(
			"$.items[0].title",
		);
		expect((await service.dataSources.findById(rssId))?.last_error).toBeNull();

		const atomResponse = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${atomId}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);
		expect(atomResponse.status).toBe(200);
		const atomBody = (await atomResponse.json()) as { data: string };
		expect(atomBody.data).toBe('"Atom First"');
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint applies simple JSON path extraction", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch() {
			return Response.json({
				weather: { current: { temperature: 21, labels: ["inside"] } },
			});
		},
	});
	const service = new DatabaseService(testDbPath("source-json-path"), {
		bootstrap: true,
	});

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/payload`);
		const id = await service.dataSources.create({
			name: "Path source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "GET",
			json_path: "$.weather.current.temperature",
		});

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(200);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe(21);
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint applies bracket and array JSON path extraction", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch() {
			return Response.json({
				"forecast hours": [
					{ "temp.c": 19, label: "now" },
					{ "temp.c": 23, label: "next" },
				],
			});
		},
	});
	const service = new DatabaseService(testDbPath("source-json-path-bracket"), {
		bootstrap: true,
	});

	try {
		const id = await service.dataSources.create({
			name: "Bracket path source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "GET",
			json_path: "$['forecast hours'][1]['temp.c']",
		});

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(200);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe(23);
		expect(source?.last_error).toBeNull();
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint reports missing JSON paths without clearing cache", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch() {
			return Response.json({ weather: { current: null } });
		},
	});
	const service = new DatabaseService(testDbPath("source-json-path-missing"), {
		bootstrap: true,
	});

	try {
		const id = await service.dataSources.create({
			name: "Missing path source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "GET",
			json_path: "$.weather.current.temperature",
		});
		await service.dataSources.updateCache(id, '{"previous":true}', null);

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(502);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe('{"previous":true}');
		expect(source?.last_error).toBe(
			"JSON path not found: $.weather.current.temperature",
		);
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint records timeout errors without clearing cache", async () => {
	const upstream = Bun.serve({
		port: 0,
		async fetch() {
			await Bun.sleep(400);
			return Response.json({ ok: true });
		},
	});
	const service = new DatabaseService(testDbPath("source-timeout"), {
		bootstrap: true,
	});

	try {
		await service.settings.set("data_source_timeout_ms", "250");
		const id = await service.dataSources.create({
			name: "Slow source",
			url: `http://127.0.0.1:${upstream.port}/slow`,
			method: "GET",
		});
		await service.dataSources.updateCache(id, '{"previous":true}', null);

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(502);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe('{"previous":true}');
		expect(source?.last_error).toBeTruthy();
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint uses the persisted timeout setting", async () => {
	const previousTimeout = process.env.TIDING_FETCH_TIMEOUT_MS;
	delete process.env.TIDING_FETCH_TIMEOUT_MS;
	const upstream = Bun.serve({
		port: 0,
		async fetch() {
			await Bun.sleep(400);
			return Response.json({ ok: true });
		},
	});
	const service = new DatabaseService(testDbPath("source-timeout-setting"), {
		bootstrap: true,
	});

	try {
		await service.settings.set("data_source_timeout_ms", "250");
		const id = await service.dataSources.create({
			name: "Slow setting source",
			url: `http://127.0.0.1:${upstream.port}/slow`,
			method: "GET",
		});
		await service.dataSources.updateCache(id, '{"previous":true}', null);

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);

		expect(response.status).toBe(502);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe('{"previous":true}');
		expect(source?.last_error).toBeTruthy();
	} finally {
		if (previousTimeout !== undefined)
			process.env.TIDING_FETCH_TIMEOUT_MS = previousTimeout;
		upstream.stop(true);
		service.close();
	}
});

test("settings endpoint lists and clamps editable runtime settings", async () => {
	const service = new DatabaseService(testDbPath("settings-api"), {
		bootstrap: true,
	});

	const updateResponse = await handleSettings(
		new Request("http://tiding.test/api/settings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data_source_timeout_ms: "50" }),
		}),
		service,
	);

	expect(updateResponse.status).toBe(200);
	expect(await service.settings.get("data_source_timeout_ms")).toBe("250");

	const listResponse = await handleSettings(
		new Request("http://tiding.test/api/settings"),
		service,
	);
	const settings = (await listResponse.json()) as Array<{
		key: string;
		value: string;
	}>;
	expect(settings).toContainEqual(
		expect.objectContaining({
			key: "data_source_timeout_ms",
			value: "250",
		}),
	);

	const statusResponse = await handleSettings(
		new Request("http://tiding.test:43337/api/settings/server-status"),
		service,
	);
	expect(statusResponse.status).toBe(200);
	const status = (await statusResponse.json()) as {
		ok: boolean;
		data: { state: string; serverIp: string; deviceUrl: string };
	};
	expect(status).toMatchObject({
		ok: true,
		data: {
			state: "Online",
			serverIp: "tiding.test",
			deviceUrl: "http://tiding.test:43337/api/display",
		},
	});

	const previewResponse = await handleSettings(
		new Request("http://tiding.test/api/settings/render-preview", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				render_dither_mode: "threshold",
				render_threshold: "200",
			}),
		}),
		service,
	);
	expect(previewResponse.status).toBe(200);
	expect(previewResponse.headers.get("Content-Type")).toBe("image/bmp");
	const previewBmp = Buffer.from(await previewResponse.arrayBuffer());
	expect(previewBmp[0]).toBe(0x42);
	expect(previewBmp[1]).toBe(0x4d);
	expect(previewBmp.readInt32LE(18)).toBe(320);
	expect(previewBmp.readInt32LE(22)).toBe(192);
	expect(previewBmp.readUInt16LE(28)).toBe(1);

	const badResponse = await handleSettings(
		new Request("http://tiding.test/api/settings/data_source_timeout_ms", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ value: "not-a-number" }),
		}),
		service,
	);
	expect(badResponse.status).toBe(400);

	service.close();
});

test("welcome settings regenerate screen and assign new devices", async () => {
	const service = new DatabaseService(testDbPath("welcome-settings"), {
		bootstrap: true,
	});
	const existingPlaylistId = await service.playlists.create({
		name: "Existing playlist",
		is_active: true,
	});
	const unassignedDeviceId = await service.devices.createManualDevice({
		label: "Unassigned device",
		macAddress: "AA:BB:CC:DD:11:22",
	});
	const assignedDeviceId = await service.devices.createManualDevice({
		label: "Assigned device",
		macAddress: "AA:BB:CC:DD:22:33",
		playlistId: existingPlaylistId,
	});

	const pageResponse = await handleAdminPage(
		new Request("http://tiding.test/settings"),
		service,
		{
			dbPath: ":memory:",
			port: 43337,
			cachePath: "/tmp/tiding-welcome-cache",
			version: "test",
			mcpEnabled: false,
		},
	);
	const html = await pageResponse?.text();
	expect(html).toContain("Welcome Screen Configuration");
	expect(html).toContain("Auto-create welcome screen");
	expect(html).toContain("new or unassigned devices");
	expect(html).toContain("Standard 800x480");
	expect(html).toContain("Compact 640x384");
	expect(html).toContain("welcomePreviewCanvas");
	expect(html).toContain('formaction="/api/settings/welcome/preview"');
	expect(html).toContain('formtarget="welcome-bmp-preview"');
	expect(html).toContain("data-welcome-bmp-preview");

	const preview = await handleSettings(
		new Request("http://tiding.test/api/settings/welcome/preview", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				welcome_title: "Preview Device",
				welcome_subtitle: "Draft before save",
				welcome_template: "compact",
			}),
		}),
		service,
	);
	expect(preview.status).toBe(200);
	expect(preview.headers.get("Content-Type")).toBe("image/bmp");
	const previewBmp = Buffer.from(await preview.arrayBuffer());
	expect(previewBmp[0]).toBe(0x42);
	expect(previewBmp[1]).toBe(0x4d);
	expect(previewBmp.readInt32LE(18)).toBe(640);
	expect(previewBmp.readInt32LE(22)).toBe(384);
	expect(previewBmp.readUInt16LE(28)).toBe(1);

	const regenerate = await handleSettings(
		new Request("http://tiding.test/api/settings/welcome/regenerate", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				welcome_auto_create_screen: "true",
				welcome_auto_assign_playlist: "true",
				welcome_title: "Hello Device",
				welcome_subtitle: "Ready for screens",
				welcome_template: "compact",
			}),
		}),
		service,
	);
	expect(regenerate.status).toBe(303);

	const screenId = Number(await service.settings.get("welcome_screen_id"));
	const playlistId = Number(await service.settings.get("welcome_playlist_id"));
	expect(
		(await service.devices.findById(unassignedDeviceId))?.playlist_id,
	).toBe(playlistId);
	expect((await service.devices.findById(assignedDeviceId))?.playlist_id).toBe(
		existingPlaylistId,
	);
	const screen = await service.screens.findById(screenId);
	expect(screen).toMatchObject({
		name: "Welcome Screen",
		width: 640,
		height: 384,
	});
	const widgets = await service.widgets.findByScreenDesign(screenId);
	expect(widgets).toHaveLength(2);
	expect(widgets[0].config).toContain("Hello Device");
	expect(widgets[1].config).toContain("Ready for screens");
	expect(await service.playlists.findItems(playlistId)).toMatchObject([
		{ screen_design_id: screenId },
	]);

	const setup = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/setup", {
			headers: { HTTP_ID: "AA:BB:CC:DD:55:66" },
		}),
		service,
	);
	expect(setup?.status).toBe(200);
	const device = await service.devices.findByHttpId("AA:BB:CC:DD:55:66");
	expect(device?.playlist_id).toBe(playlistId);

	service.close();
});

test("security settings redact GitHub token and block local sources", async () => {
	const service = new DatabaseService(testDbPath("security-settings"), {
		bootstrap: true,
	});
	const upstream = Bun.serve({
		port: 0,
		fetch(req) {
			return Response.json(
				{ token: req.headers.get("authorization") },
				{ headers: { "x-ratelimit-remaining": "42" } },
			);
		},
	});

	try {
		await service.settings.set(
			"github_api_test_url",
			`http://127.0.0.1:${upstream.port}/rate_limit`,
		);
		const saveResponse = await handleSettings(
			new Request("http://tiding.test/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					github_api_token: "ghp_secret_token",
					data_source_allow_local_network: "false",
				}),
			}),
			service,
		);
		expect(saveResponse.status).toBe(200);

		const settingsResponse = await handleSettings(
			new Request("http://tiding.test/api/settings"),
			service,
		);
		const settingsJson = JSON.stringify(await settingsResponse.json());
		expect(settingsJson).toContain("******");
		expect(settingsJson).not.toContain("ghp_secret_token");

		const testResponse = await handleSettings(
			new Request("http://tiding.test/api/settings/github-token/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			}),
			service,
		);
		expect(testResponse.status).toBe(200);
		expect(await testResponse.json()).toMatchObject({
			ok: true,
			token: "******",
			rateLimitRemaining: "42",
		});

		const sourceId = await service.dataSources.create({
			name: "Local source",
			url: `http://127.0.0.1:${upstream.port}/data`,
			method: "GET",
		});
		const fetchResponse = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${sourceId}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);
		expect(fetchResponse.status).toBe(502);
		expect((await service.dataSources.findById(sourceId))?.last_error).toBe(
			"Local network data sources are disabled",
		);

		const settingsPage = await handleAdminPage(
			new Request("http://tiding.test/settings"),
			service,
			{
				dbPath: ":memory:",
				port: 43337,
				cachePath: "/tmp/tiding-security-cache",
				version: "test",
				mcpEnabled: false,
			},
		);
		const html = await settingsPage?.text();
		expect(html).toContain("API Tokens And Network Security");
		expect(html).toContain("Test GitHub Token");
		expect(html).toContain("Allow local network data sources");
		expect(html).toContain("******");
		expect(html).not.toContain("ghp_secret_token");
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("data source fetch endpoint preserves previous cache data on failure", async () => {
	const service = new DatabaseService(testDbPath("source-cache"), {
		bootstrap: true,
	});
	const id = await service.dataSources.create({
		name: "Broken source",
		url: "http://127.0.0.1:1/unreachable",
		method: "GET",
	});

	await service.dataSources.updateCache(id, '{"ok":true}', null);

	const response = await handleDataSources(
		new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
			method: "POST",
			headers: { Accept: "application/json" },
		}),
		service,
	);
	expect(response.status).toBe(502);

	const source = await service.dataSources.findById(id);
	expect(source?.last_data).toBe('{"ok":true}');
	expect(source?.last_error).toBeTruthy();

	service.close();
});

test("data source fetch endpoint preserves previous cache for an empty upstream response", async () => {
	const upstream = Bun.serve({ port: 0, fetch: () => new Response("") });
	const service = new DatabaseService(testDbPath("source-empty-cache"), {
		bootstrap: true,
	});
	try {
		const id = await service.dataSources.create({
			name: "Occasionally empty source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "GET",
		});
		await service.dataSources.updateCache(id, '{"fresh":true}', null);

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${id}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
		);
		expect(response.status).toBe(502);
		const source = await service.dataSources.findById(id);
		expect(source?.last_data).toBe('{"fresh":true}');
		expect(source?.last_error).toBe("Upstream returned an empty response");
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("widget writes invalidate the affected screen render cache", async () => {
	const service = new DatabaseService(testDbPath("widget-cache-invalidation"), {
		bootstrap: true,
	});
	const cache = new RenderCache(
		nodePath.join("/tmp", `tiding-cache-${Date.now()}-${Math.random()}`),
	);
	const screenId = await service.screens.create("Cached screen");
	const templates = await service.templates.findAll();
	cache.write(screenId, Buffer.from("old-png"));

	const response = await handleWidgets(
		new Request(`http://tiding.test/api/screen-designs/${screenId}/widgets`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				template_id: templates[0].id,
				config: '{"text":"new"}',
			}),
		}),
		service,
		(invalidatedScreenId) => cache.invalidate(invalidatedScreenId),
	);

	expect(response.status).toBe(201);
	expect(cache.read(screenId)).toBeNull();

	service.close();
});

test("data source fetch invalidates screens backed by that source", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch() {
			return Response.json({ value: "fresh" });
		},
	});
	const service = new DatabaseService(testDbPath("source-cache-invalidation"), {
		bootstrap: true,
	});
	const cache = new RenderCache(
		nodePath.join("/tmp", `tiding-source-cache-${Date.now()}-${Math.random()}`),
	);

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/payload`);
		const screenId = await service.screens.create("Source cache screen");
		const templates = await service.templates.findAll();
		const dataSourceId = await service.dataSources.create({
			name: "Source",
			url: `http://127.0.0.1:${upstream.port}/payload`,
			method: "GET",
		});
		const customWidgetId = await service.customWidgets.create({
			name: "Custom source widget",
			data_source_id: dataSourceId,
			displayType: "text",
			template: "{{value}}",
			config: "{}",
		});
		await service.widgets.create({
			screen_design_id: screenId,
			template_id: templates[0].id,
			config: JSON.stringify({ customWidgetId }),
		});
		cache.write(screenId, Buffer.from("old-png"));

		const response = await handleDataSources(
			new Request(`http://tiding.test/api/data-sources/${dataSourceId}/fetch`, {
				method: "POST",
				headers: { Accept: "application/json" },
			}),
			service,
			(invalidatedScreenId) => cache.invalidate(invalidatedScreenId),
		);

		expect(response.status).toBe(200);
		expect(cache.read(screenId)).toBeNull();
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("1-bit BMP encoder defaults to firmware-compatible bottom-up rows", () => {
	const bmp = encodeRawTo1BitBmp(
		new Uint8Array([
			0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
		]),
		{ width: 2, height: 2 },
	);

	expect(bmp.toString("ascii", 0, 2)).toBe("BM");
	expect(bmp.readInt32LE(18)).toBe(2);
	expect(bmp.readInt32LE(22)).toBe(2);
	expect(bmp.readUInt16LE(28)).toBe(1);
	expect(bmp.readUInt32LE(10)).toBe(62);
	expect(bmp.length).toBe(70);
	expect(bmp[62]).toBe(0b10000000);
	expect(bmp[66]).toBe(0b01000000);
});

test("1-bit BMP encoder can write conventional bottom-up BMPs", () => {
	const bmp = encodeRawTo1BitBmp(
		new Uint8Array([
			0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
		]),
		{ width: 2, height: 2, topDown: false },
	);

	expect(bmp.toString("ascii", 0, 2)).toBe("BM");
	expect(bmp.readInt32LE(18)).toBe(2);
	expect(bmp.readInt32LE(22)).toBe(2);
	expect(bmp.readUInt16LE(28)).toBe(1);
	expect(bmp[62]).toBe(0b10000000);
	expect(bmp[66]).toBe(0b01000000);
});

test("1-bit BMP encoder supports configured dithering modes", () => {
	const raw = new Uint8Array([100, 140, 180, 220]);
	const threshold = encodeRawTo1BitBmp(raw, {
		width: 4,
		height: 1,
		threshold: 160,
		ditherMode: "threshold",
	});
	const floyd = encodeRawTo1BitBmp(raw, {
		width: 4,
		height: 1,
		threshold: 160,
		ditherMode: "floyd-steinberg",
	});

	expect(threshold[62]).not.toBe(0);
	expect(floyd[62]).not.toBe(0);
	expect(threshold.readUInt16LE(28)).toBe(1);
	expect(floyd.readUInt16LE(28)).toBe(1);
});

test("per-widget dithering is clipped to the widget raster region", () => {
	const raw = new Uint8Array([100, 140, 180, 220]);
	const pixels = monochromePixelsWithRegions(raw, 4, 1, 1, 160, "threshold", [
		{ x: 1, y: 0, width: 2, height: 1, ditherMode: "floyd-steinberg" },
	]);

	expect([...pixels]).toEqual([0, 0, 1, 1]);
});

test("setup screen renderer returns a no-cache compatible 1-bit BMP payload", async () => {
	const bmp = await renderSetupScreenBmp();

	expect(bmp.toString("ascii", 0, 2)).toBe("BM");
	expect(bmp.length).toBe(48062);
	expect(bmp.readUInt32LE(10)).toBe(62);
	expect(bmp.readInt32LE(18)).toBe(800);
	expect(bmp.readInt32LE(22)).toBe(480);
	expect(bmp.readUInt16LE(28)).toBe(1);
	expect(bmp.readUInt32LE(46)).toBe(2);
});

test("render cache stores BMP artifacts and URLs", () => {
	const cache = new RenderCache(
		nodePath.join("/tmp", `tiding-bmp-cache-${Date.now()}-${Math.random()}`),
	);

	cache.write(7, Buffer.from("BMtest"));

	expect(cache.artifactPath(7).endsWith("screen-7.bmp")).toBe(true);
	expect(cache.artifactUrl(7)).toBe("/cache/screen-7.bmp");
	expect(cache.read(7)?.toString()).toBe("BMtest");
	const firstDeviceUrl = cache.deviceArtifactUrl(7);
	expect(firstDeviceUrl).toMatch(/^\/cache\/screen-7\.bmp\?v=[a-f0-9]{12}$/);
	expect(cache.deviceArtifactUrl(7)).toBe(firstDeviceUrl);
	cache.write(7, Buffer.from("BMchanged"));
	expect(cache.deviceArtifactUrl(7)).not.toBe(firstDeviceUrl);
});

test("render cache publishes complete BMPs with an atomic replacement", () => {
	const cacheDir = nodePath.join(
		"/tmp",
		`tiding-atomic-bmp-cache-${Date.now()}-${Math.random()}`,
	);
	const cache = new RenderCache(cacheDir);
	cache.write(7, Buffer.from("BMfirst"));
	const firstInode = fs.statSync(cache.artifactPath(7)).ino;

	cache.write(7, Buffer.from("BMsecond"));

	expect(cache.read(7)?.toString()).toBe("BMsecond");
	expect(fs.statSync(cache.artifactPath(7)).ino).not.toBe(firstInode);
	expect(fs.readdirSync(cacheDir)).toEqual(["screen-7.bmp"]);
});

test("render cache isolates device artifacts and invalidates every screen variant", () => {
	const cacheDir = nodePath.join(
		"/tmp",
		`tiding-device-bmp-cache-${Date.now()}-${Math.random()}`,
	);
	const cache = new RenderCache(cacheDir);

	cache.write(7, Buffer.from("BMpreview"));
	cache.write(7, Buffer.from("BMdevice-a"), "device-12");
	cache.write(7, Buffer.from("BMdevice-b"), "device-13");

	expect(cache.read(7)?.toString()).toBe("BMpreview");
	expect(cache.read(7, "device-12")?.toString()).toBe("BMdevice-a");
	expect(cache.deviceArtifactUrl(7, "device-12")).toMatch(
		/^\/cache\/screen-7-device-12\.bmp\?v=[a-f0-9]{12}$/,
	);

	cache.invalidate(7);
	expect(cache.read(7)).toBeNull();
	expect(cache.read(7, "device-12")).toBeNull();
	expect(cache.read(7, "device-13")).toBeNull();
});

test("render cache rejects stale top-down BMPs unsupported by TRMNL firmware", () => {
	const cache = new RenderCache(
		nodePath.join(
			"/tmp",
			`tiding-stale-bmp-cache-${Date.now()}-${Math.random()}`,
		),
	);
	const stale = Buffer.alloc(62);
	stale.write("BM", 0, "ascii");
	stale.writeInt32LE(800, 18);
	stale.writeInt32LE(-480, 22);
	cache.write(3, stale);

	expect(cache.read(3)).toBeNull();
});

test("render preview uses persisted e-ink settings", async () => {
	const service = new DatabaseService(testDbPath("render-settings"), {
		bootstrap: true,
	});
	const cache = new RenderCache(testDbPath("render-settings-cache"));
	const screenId = await service.screens.create("Render settings screen");
	await service.settings.set("render_threshold", "0");
	await service.settings.set("render_dither_mode", "threshold");

	const result = await renderScreenPreview(service, cache, screenId);
	const bmp = fs.readFileSync(result.imagePath);
	const pixelOffset = bmp.readUInt32LE(10);
	const pixelData = bmp.subarray(pixelOffset);
	expect(pixelData.every((byte) => byte === 0xff)).toBe(true);
	expect(bmp.readUInt16LE(28)).toBe(1);

	service.close();
});

test("widget previews render their exact native widget dimensions", async () => {
	const service = new DatabaseService(testDbPath("widget-preview"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Widget preview");
	const template = (await service.templates.findAll()).find(
		(candidate) => candidate.name === "clock",
	);
	if (!template) throw new Error("Clock template missing");
	const widgetId = await service.widgets.create({
		screen_design_id: screenId,
		template_id: template.id,
		x: 60,
		y: 40,
		width: 165,
		height: 68,
		config: template.defaultConfig,
	});

	const composed = await new ScreenComposer(service).composeWidgetHtml(
		widgetId,
	);
	expect(composed.width).toBe(165);
	expect(composed.height).toBe(68);
	expect(composed.html).toContain("left:0px");
	expect(composed.html).toContain("top:0px");
	const bmp = await renderWidgetPreview(service, widgetId);
	expectMonochromeBmp(bmp, { width: 165, height: 68 });
	expect(bmp.readInt32LE(22)).toBe(68);

	service.close();
});

test("screen composer exposes only explicit per-widget dither regions", async () => {
	const service = new DatabaseService(testDbPath("widget-dither-regions"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Widget dither regions");
	const template = (await service.templates.findAll()).find(
		(candidate) => candidate.name === "image",
	);
	if (!template) throw new Error("Image template missing");
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: template.id,
		x: 17,
		y: 23,
		width: 101,
		height: 79,
		config: JSON.stringify({ ditherMode: "floyd-steinberg" }),
		z_index: 2,
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: template.id,
		x: 120,
		y: 23,
		width: 80,
		height: 79,
		config: JSON.stringify({ ditherMode: "inherit" }),
		z_index: 3,
	});

	const composed = await new ScreenComposer(service).composeHtml(screenId);
	expect(composed.ditherRegions).toEqual([
		{
			x: 17,
			y: 23,
			width: 101,
			height: 79,
			ditherMode: "floyd-steinberg",
		},
	]);

	service.close();
});

test("screen composer injects live time and device telemetry into framework widgets", async () => {
	const service = new DatabaseService(testDbPath("live-framework-context"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Live framework context");
	const templates = await service.templates.findAll();
	const clock = templates.find((candidate) => candidate.name === "clock");
	const battery = templates.find((candidate) => candidate.name === "battery");
	if (!clock || !battery) throw new Error("Live widget templates missing");
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: clock.id,
		config: JSON.stringify({ time: "12:00", timezone: "UTC", format: "24h" }),
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: battery.id,
		y: 100,
		config: JSON.stringify({ percent: 0 }),
	});

	const { html } = await new ScreenComposer(service).composeHtml(screenId, {
		now: new Date("2026-07-13T07:05:00Z"),
		device: {
			id: 3,
			label: "Bedroom",
			battery: 74,
			wifi: -61,
			firmwareVersion: "1.6.10",
		},
	});
	expect(html).toContain("07:05");
	expect(html).toContain("Battery 74%");
	expect(html).not.toContain("12:00");
	expect(html).not.toContain("Battery 0%");

	service.close();
});

test("screen composer renders every predefined widget through framework JSX", async () => {
	const service = new DatabaseService(testDbPath("predefined-widget-render"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Predefined widgets");
	const templates = await service.templates.findAll();

	for (const [index, template] of templates.entries()) {
		const config = JSON.parse(template.defaultConfig) as Record<
			string,
			unknown
		>;
		if (template.name === "clock" || template.name === "date") {
			config.timezone = "UTC";
		}
		await service.widgets.create({
			screen_design_id: screenId,
			template_id: template.id,
			x: (index % 5) * 150,
			y: Math.floor(index / 5) * 140,
			width: 140,
			height: 120,
			config: JSON.stringify(config),
			z_index: index,
		});
	}

	const { html } = await new ScreenComposer(service).composeHtml(screenId, {
		now: new Date("2026-07-07T12:00:00Z"),
	});
	for (const expected of [
		"Hello",
		"GitHub Stars",
		"Static Image",
		"QR",
		"Plugin Widget",
		"Unsupported",
		"Battery",
		"Device",
		"WiFi",
		"12:00",
		"Launch",
		"2026-07-07",
		"42 days",
		"21C",
	]) {
		expect(html).toContain(expected);
	}
	expect(html).not.toContain("dangerouslySetInnerHTML");
	expect(html).toContain("data-qr-code");
	expect(html).toContain('aria-label="QR Code"');
	expect(html).toContain("<rect");

	const bmp = await takumiRenderer.renderHtmlToBmp(html, {
		width: 800,
		height: 480,
	});
	expect(bmp.subarray(0, 2).toString()).toBe("BM");
	expect(bmp.readUInt16LE(28)).toBe(1);

	service.close();
});

test("screen composer fetches live GitHub Stars with saved token", async () => {
	const service = new DatabaseService(testDbPath("github-stars-widget"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("GitHub screen");
	const templates = await service.templates.findAll();
	const githubTemplate = templates.find(
		(template) => template.name === "github",
	);
	expect(githubTemplate).toBeTruthy();
	await service.settings.set("github_api_token", "ghp_secret_token");
	const requests: { url: string; authorization: string | null }[] = [];
	const fetcher = (async (input, init) => {
		const url = input instanceof Request ? input.url : String(input);
		const headers = new Headers(init?.headers);
		requests.push({ url, authorization: headers.get("authorization") });
		return new Response(JSON.stringify({ stargazers_count: 9876 }), {
			headers: { "Content-Type": "application/json" },
		});
	}) as typeof fetch;

	try {
		await service.widgets.create({
			screen_design_id: screenId,
			template_id: githubTemplate?.id ?? templates[0].id,
			config: JSON.stringify({ repo: "owner/project", live: true, stars: 1 }),
		});

		const { html } = await new ScreenComposer(service, fetcher).composeHtml(
			screenId,
		);

		expect(requests).toEqual([
			{
				url: "https://api.github.com/repos/owner/project",
				authorization: "Bearer ghp_secret_token",
			},
		]);
		expect(html).toContain("GitHub Stars");
		expect(html).toContain("9876");
		expect(html).not.toContain("ghp_secret_token");
	} finally {
		service.close();
	}
});

test("screen composer renders custom widget templates from cached data source data", async () => {
	const service = new DatabaseService(testDbPath("custom-widget-render"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Custom widget screen");
	const templates = await service.templates.findAll();
	const customTemplate = templates.find(
		(template) => template.name === CUSTOM_WIDGET_FRAMEWORK_NAME,
	);
	expect(customTemplate).toBeTruthy();
	const dataSourceId = await service.dataSources.create({
		name: "Weather",
		url: "http://example.test/weather",
		method: "GET",
	});
	await service.dataSources.updateCache(
		dataSourceId,
		'{"weather":{"temperature":21,"label":"<inside>"}}',
		null,
	);
	const customWidgetId = await service.customWidgets.create({
		name: "Weather widget",
		data_source_id: dataSourceId,
		displayType: "text",
		template:
			"<strong>{{weather.temperature}}{{config.unit}}</strong><span>{{weather.label}}</span>",
		config: "{}",
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: customTemplate?.id ?? templates[0].id,
		config: JSON.stringify({
			customWidgetId,
			unit: "C",
			rotation: 15,
			fontSize: 18,
			opacity: 0.6,
			textAlign: "right",
		}),
	});

	const composer = new ScreenComposer(service);
	const { html } = await composer.composeHtml(screenId);

	expect(html).toContain("<strong>21C</strong>");
	expect(html).toContain("<span>&lt;inside&gt;</span>");
	expect(html).toContain("transform:rotate(15deg);");
	expect(html).toContain("font-size:16px;");
	expect(html).toContain("opacity:0.6;");
	expect(html).toContain("text-align:right;");

	service.close();
});

test("screen composer renders script and JSX framework custom widgets", async () => {
	const service = new DatabaseService(testDbPath("custom-widget-executable"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Executable custom widgets");
	const templates = await service.templates.findAll();
	const customTemplate = templates.find(
		(template) => template.name === CUSTOM_WIDGET_FRAMEWORK_NAME,
	);
	expect(customTemplate).toBeTruthy();
	const dataSourceId = await service.dataSources.create({
		name: "Weather",
		url: "http://example.test/weather",
		method: "GET",
	});
	await service.dataSources.updateCache(
		dataSourceId,
		'{"posts":[{"title":"<first>"},{"title":"second"}],"current":{"temperature_2m":17.1}}',
		null,
	);
	const scriptWidgetId = await service.customWidgets.create({
		name: "Script widget",
		data_source_id: dataSourceId,
		displayType: "script",
		template: "",
		config: JSON.stringify({
			scriptCode: "return $.posts.map((post) => post.title)",
		}),
	});
	const frameworkWidgetId = await service.customWidgets.create({
		name: "Framework widget",
		data_source_id: dataSourceId,
		displayType: "framework",
		template:
			'return <div style={{display:"flex"}}><Icon name="check" size={18} label="Ready" />weather in {ctx.city}: {$.current?.temperature_2m}<svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round"><path d="M4 12h16" fillRule="evenodd" /></svg></div>',
		config: JSON.stringify({ templateMode: "jsx" }),
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: customTemplate?.id ?? templates[0].id,
		x: 0,
		y: 0,
		config: JSON.stringify({ customWidgetId: scriptWidgetId }),
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: customTemplate?.id ?? templates[0].id,
		x: 0,
		y: 100,
		config: JSON.stringify({
			customWidgetId: frameworkWidgetId,
			ctx: { city: "Berlin" },
		}),
	});

	const composer = new ScreenComposer(service);
	const { html } = await composer.composeHtml(screenId);

	expect(html).toContain("<div>&lt;first&gt;</div>");
	expect(html).toContain("<div>second</div>");
	expect(html).toContain('style="display:flex;"');
	expect(html).toContain("weather in Berlin: 17.1");
	expect(html).toContain('data-icon="check"');
	expect(html).toContain('aria-label="Ready"');
	expect(html).toContain('stroke-width="2"');
	expect(html).toContain('stroke-linecap="round"');
	expect(html).toContain('fill-rule="evenodd"');
	expect(html).toContain(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"',
	);
	expect(html).not.toContain("strokeWidth=");

	service.close();
});

test("screen composer paints the body with the persisted screen background", async () => {
	const service = new DatabaseService(testDbPath("screen-body-background"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Opaque screen");

	const { html } = await new ScreenComposer(service).composeHtml(screenId);

	expect(html).toMatch(/<html lang="en" style="background:#ffffff;">/i);
	expect(html).toMatch(/<body style="[^"]*background:#ffffff;/i);

	service.close();
});

test("synthetic compatibility database renders framework custom widget content", async () => {
	const service = new DatabaseService(
		syntheticCompatDbPath("compat-framework"),
	);
	const composer = new ScreenComposer(service);

	const { html } = await composer.composeHtml(1);

	expect(html).toContain("News today");
	expect(html).toContain("Latest");
	expect(html).toContain("Section");
	expect(html).not.toContain("const rows = Array.isArray");
	expect(html).not.toContain("return <div");

	service.close();
});

test("synthetic framework widgets render with the production JSX runtime", () => {
	const dbPath = syntheticCompatDbPath("production-jsx-runtime");
	const script = `
		import { DatabaseService } from "./src/db";
		import { ScreenComposer } from "./src/rendering/composer/screen-composer";
		const db = new DatabaseService(${JSON.stringify(dbPath)});
		const { html } = await new ScreenComposer(db).composeHtml(1);
		db.close();
		if (html.includes("Custom widget framework error:")) process.exit(1);
	`;
	const result = Bun.spawnSync({
		cmd: [process.execPath, "-e", script],
		cwd: process.cwd(),
		env: { ...process.env, NODE_ENV: "production" },
	});

	expect(result.exitCode).toBe(0);
});

test("screen composer renders controlled fallback for missing custom widget data", async () => {
	const service = new DatabaseService(
		testDbPath("custom-widget-missing-data"),
		{
			bootstrap: true,
		},
	);
	const screenId = await service.screens.create("Missing data screen");
	const templates = await service.templates.findAll();
	const dataSourceId = await service.dataSources.create({
		name: "Empty source",
		url: "http://example.test/empty",
		method: "GET",
	});
	const customWidgetId = await service.customWidgets.create({
		name: "Missing data widget",
		data_source_id: dataSourceId,
		displayType: "text",
		template: "Value: {{weather.temperature}}",
		config: "{}",
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: templates[0].id,
		config: JSON.stringify({ customWidgetId }),
		x: 12,
		y: 24,
		width: 160,
		height: 80,
	});

	const composer = new ScreenComposer(service);
	const { html } = await composer.composeHtml(screenId);

	expect(html).toContain("Value: ");

	service.close();
});

test("custom widget writes invalidate screens that reference the custom widget", async () => {
	const service = new DatabaseService(
		testDbPath("custom-widget-invalidation"),
		{
			bootstrap: true,
		},
	);
	const cache = new RenderCache(
		nodePath.join("/tmp", `tiding-custom-cache-${Date.now()}-${Math.random()}`),
	);
	const screenId = await service.screens.create("Custom cache screen");
	const templates = await service.templates.findAll();
	const dataSourceId = await service.dataSources.create({
		name: "Source",
		url: "http://example.test/source",
		method: "GET",
	});
	const customWidgetId = await service.customWidgets.create({
		name: "Custom",
		data_source_id: dataSourceId,
		displayType: "text",
		template: "Before",
		config: "{}",
	});
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: templates[0].id,
		config: JSON.stringify({ customWidgetId, rotation: 15 }),
	});
	cache.write(screenId, Buffer.from("old-png"));

	const response = await handleCustomWidgets(
		new Request(`http://tiding.test/api/custom-widgets/${customWidgetId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ template: "After" }),
		}),
		service,
		(invalidatedScreenId) => cache.invalidate(invalidatedScreenId),
	);

	expect(response.status).toBe(204);
	expect(cache.read(screenId)).toBeNull();

	service.close();
});

test("custom widget preview endpoint renders a 1-bit BMP from cached source data", async () => {
	const service = new DatabaseService(testDbPath("custom-widget-preview"), {
		bootstrap: true,
	});
	const dataSourceId = await service.dataSources.create({
		name: "Preview source",
		url: "http://example.test/preview",
		method: "GET",
	});
	await service.dataSources.updateCache(dataSourceId, '{"value":"42"}', null);
	const customWidgetId = await service.customWidgets.create({
		name: "Preview widget",
		data_source_id: dataSourceId,
		displayType: "text",
		template: "Value {{value}}",
		config: "{}",
		min_width: 180,
		min_height: 80,
	});

	const response = await handleCustomWidgets(
		new Request(
			`http://tiding.test/api/custom-widgets/${customWidgetId}/preview`,
		),
		service,
		undefined,
		(id) => renderCustomWidgetPreview(service, id),
	);

	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toBe("image/bmp");
	const bmp = Buffer.from(await response.arrayBuffer());
	expect(bmp[0]).toBe(0x42);
	expect(bmp[1]).toBe(0x4d);
	expect(bmp.readInt32LE(18)).toBe(180);
	expect(bmp.readInt32LE(22)).toBe(80);
	expect(bmp.readUInt16LE(28)).toBe(1);

	service.close();
});

test("custom widget draft preview renders unsaved wizard form data", async () => {
	const service = new DatabaseService(
		testDbPath("custom-widget-draft-preview"),
		{
			bootstrap: true,
		},
	);
	const dataSourceId = await service.dataSources.create({
		name: "Draft preview source",
		url: "http://example.test/draft-preview",
		method: "GET",
	});
	await service.dataSources.updateCache(
		dataSourceId,
		'{"value":"draft"}',
		null,
	);

	const response = await handleCustomWidgets(
		new Request("http://tiding.test/api/custom-widgets/preview", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				name: "Unsaved framework widget",
				data_source_id: String(dataSourceId),
				displayType: "framework",
				template: "return <div>{$.value}</div>",
				config: "{}",
				context_schema: "{}",
				min_width: "140",
				min_height: "70",
			}),
		}),
		service,
		undefined,
		undefined,
		(input) => renderDraftCustomWidgetPreview(service, input),
	);

	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toBe("image/bmp");
	const bmp = Buffer.from(await response.arrayBuffer());
	expect(bmp[0]).toBe(0x42);
	expect(bmp[1]).toBe(0x4d);
	expect(bmp.readInt32LE(18)).toBe(140);
	expect(bmp.readInt32LE(22)).toBe(70);
	expect(bmp.readUInt16LE(28)).toBe(1);
	expect(await service.customWidgets.findAll()).toEqual([]);

	service.close();
});

test("custom widget wizard exposes source fields and persists context schema", async () => {
	const service = new DatabaseService(testDbPath("custom-widget-wizard"), {
		bootstrap: true,
	});
	const dataSourceId = await service.dataSources.create({
		name: "Wizard source",
		url: "http://example.test/wizard",
		method: "GET",
	});
	await service.dataSources.updateCache(
		dataSourceId,
		'{"value":42,"items":[{"title":"Now"}]}',
		null,
	);

	try {
		const page = await handleAdminPage(
			new Request(
				`http://tiding.test/custom-widgets/new?data_source_id=${dataSourceId}`,
			),
			service,
			{
				dbPath: ":memory:",
				port: 43337,
				cachePath: testDbPath("custom-widget-wizard-cache"),
				version: "0.1.0",
				mcpEnabled: false,
			},
		);
		const html = await page?.text();
		expect(html).toContain("Step 1");
		expect(html).toContain("Step 2");
		expect(html).toContain("Step 3");
		expect(html).toContain("Step 4");
		expect(html).toContain("wizardStepper");
		expect(html).toContain("wizardStep");
		expect(html).toContain('aria-controls="wizard-source-step"');
		expect(html).toContain('aria-controls="wizard-template-step"');
		expect(html).toContain("data-custom-widget-wizard");
		expect(html).toContain("Load Source");
		expect(html).toContain("Inspect cached data and available fields");
		expect(html).toContain("formnovalidate");
		expect(html).toContain('formaction="/custom-widgets/new"');
		expect(html).toContain('name="step"');
		expect(html).toContain("Available Fields");
		expect(html).toContain("$.items[0].title");
		expect(html).toContain('value="framework"');
		expect(html).toContain('value="script"');
		expect(html).toContain('name="context_schema"');
		expect(html).toContain('data-scope="text-field"');
		expect(html).toContain('data-scope="textarea-field"');
		expect(html).toContain("Live Preview");
		expect(html).toContain('formaction="/api/custom-widgets/preview"');
		expect(html).toContain('formtarget="custom-widget-preview"');
		expect(html).toContain("data-custom-widget-draft-preview");

		const createResponse = await handleCustomWidgets(
			new Request("http://tiding.test/api/custom-widgets", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					name: "Framework wizard",
					data_source_id: String(dataSourceId),
					displayType: "framework",
					template: "return <div>{$.value}</div>",
					context_schema: '{"city":{"type":"string"}}',
					config: "{}",
					min_width: "120",
					min_height: "60",
				}),
			}),
			service,
		);
		expect(createResponse.status).toBe(303);
		const id = Number(
			createResponse.headers.get("Location")?.match(/\d+$/)?.[0],
		);
		const widget = await service.customWidgets.findById(id);
		expect(widget?.displayType).toBe("framework");
		expect(widget?.context_schema).toBe('{"city":{"type":"string"}}');
	} finally {
		service.close();
	}
});

test("setup endpoint provisions devices with a BMP setup image URL", async () => {
	const service = new DatabaseService(testDbPath("device-setup"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;

	const missingResponse = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/setup"),
		service,
	);
	expect(missingResponse?.status).toBe(422);
	const missing = (await missingResponse?.json()) as {
		statusCode: number;
		type: string;
		detail: string;
		extensions: { errors: unknown };
	};
	expect(missing.statusCode).toBe(422);
	expect(missing.type).toBe("/problem_details#device_setup");
	expect(missing.detail).toBe("Invalid request headers.");
	expect(missing.extensions.errors).toEqual({ HTTP_ID: ["is missing"] });

	const response = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/setup", {
			headers: { ID: "AA:BB:CC:DD:EE:01" },
		}),
		service,
	);

	expect(response?.status).toBe(200);
	const body = (await response?.json()) as {
		status: number;
		api_key: string;
		friendly_id: string;
		image_url: string;
		message: string;
	};
	expect(body.status).toBe(200);
	expect(body.api_key.length).toBeGreaterThan(20);
	expect(body.friendly_id).toMatch(/^tiding-[0-9a-f]{6}$/);
	expect(body.image_url).toBe("http://tiding.test/api/setup-screen.bmp");
	expect(body.message).toBe("Welcome to Tiding!");

	const device = db
		.query(
			"SELECT mac_address, api_key, friendly_id, is_active, width, height FROM devices WHERE mac_address = ?",
		)
		.get("AA:BB:CC:DD:EE:01") as {
		mac_address: string;
		api_key: string;
		friendly_id: string;
		is_active: number;
		width: number;
		height: number;
	};
	expect(device.mac_address).toBe("AA:BB:CC:DD:EE:01");
	expect(device.api_key).toBe(body.api_key);
	expect(device.friendly_id).toBe(body.friendly_id);
	expect(device.is_active).toBe(1);
	expect(device.width).toBe(800);
	expect(device.height).toBe(480);
	const assignedPlaylistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, description, is_active, updated_at) VALUES (?, ?, true, CURRENT_TIMESTAMP)",
			)
			.run("Existing assignment", "Must survive repeated setup")
			.lastInsertRowid,
	);
	db.query("UPDATE devices SET playlist_id = ? WHERE mac_address = ?").run(
		assignedPlaylistId,
		"AA:BB:CC:DD:EE:01",
	);

	const repeat = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/setup", {
			headers: { HTTP_ID: "AA:BB:CC:DD:EE:01" },
		}),
		service,
	);
	const repeatBody = (await repeat?.json()) as { api_key: string };
	expect(repeatBody.api_key).toBe(body.api_key);
	expect(
		(
			db
				.query("SELECT playlist_id FROM devices WHERE mac_address = ?")
				.get("AA:BB:CC:DD:EE:01") as { playlist_id: number }
		).playlist_id,
	).toBe(assignedPlaylistId);

	service.close();
});

test("log endpoint persists simple and public TRMNL log payloads", async () => {
	const service = new DatabaseService(testDbPath("device-log"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, is_active, updated_at) VALUES (?, ?, ?, ?, true, CURRENT_TIMESTAMP)",
			)
			.run("Log Device", "log-device", "AA:BB:CC:DD:EE:02", "log-api-key")
			.lastInsertRowid,
	);

	const missingResponse = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/log", {
			method: "POST",
			headers: { "Content-Type": "application/json", HTTP_ID: "missing" },
			body: JSON.stringify({ level: "info", message: "unknown" }),
		}),
		service,
	);
	expect(missingResponse?.status).toBe(404);
	expect(await missingResponse?.json()).toMatchObject({
		statusCode: 404,
		message: "Device not found",
		error: "Not Found",
	});

	const badResponse = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/log", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				HTTP_ID: "AA:BB:CC:DD:EE:02",
			},
			body: JSON.stringify({ level: "this-level-is-way-too-long" }),
		}),
		service,
	);
	expect(badResponse?.status).toBe(400);
	const bad = (await badResponse?.json()) as { message: string[] };
	expect(bad.message).toContain(
		"level must be shorter than or equal to 20 characters",
	);
	expect(bad.message).toContain("message must be a string");

	const simpleResponse = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/log", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				HTTP_ID: "AA:BB:CC:DD:EE:02",
			},
			body: JSON.stringify({
				level: "error",
				message: "Display render failed",
				metadata: { source: "device" },
			}),
		}),
		service,
	);
	expect(simpleResponse?.status).toBe(200);
	expect(await simpleResponse?.json()).toEqual({
		status: "ok",
		message: "Log created successfully",
	});

	const publicResponse = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/log", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				ID: "AA:BB:CC:DD:EE:02",
			},
			body: JSON.stringify({
				logs_array: [
					{
						log_id: 7,
						log_message: "returned code is not OK: 404",
						device_status_stamp: { current_fw_version: "1.8.6" },
					},
				],
			}),
		}),
		service,
	);
	expect(publicResponse?.status).toBe(200);

	const firmwareResponse = await handleDeviceLifecycle(
		new Request("http://tiding.test/api/log", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				ID: "AA:BB:CC:DD:EE:02",
				"Access-Token": "log-api-key",
			},
			body: JSON.stringify({
				logs: [
					{
						created_at: 1_784_000_000,
						id: 42,
						message: "Error fetching API display: 7",
						source_line: 101,
						source_path: "src/api-client/display.cpp",
						wifi_signal: -61,
						firmware_version: "1.6.10",
					},
				],
			}),
		}),
		service,
	);
	expect(firmwareResponse?.status).toBe(200);

	const rows = db
		.query(
			"SELECT level, message, metadata FROM device_logs WHERE device_id = ? ORDER BY id ASC",
		)
		.all(deviceId) as Array<{
		level: string;
		message: string;
		metadata: string;
	}>;
	expect(rows).toHaveLength(3);
	expect(rows[0]).toMatchObject({
		level: "error",
		message: "Display render failed",
	});
	expect(rows[0].metadata).toContain('"source":"device"');
	expect(rows[1]).toMatchObject({
		level: "error",
		message: "returned code is not OK: 404",
	});
	expect(rows[1].metadata).toContain('"source":"logs_array"');
	expect(rows[2]).toMatchObject({
		level: "error",
		message: "Error fetching API display: 7",
	});
	expect(rows[2].metadata).toContain('"source":"logs"');
	expect(rows[2].metadata).toContain('"firmware_version":"1.6.10"');

	service.close();
});

test("device endpoints expose redacted inventory, assignments, and logs", async () => {
	const service = new DatabaseService(testDbPath("device-api"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("Device API screen");
	const playlistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, is_active, updated_at) VALUES (?, true, CURRENT_TIMESTAMP)",
			)
			.run("Device playlist").lastInsertRowid,
	);
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, firmware_version, playlist_id, is_active, wifi, battery, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, ?, ?, true, ?, ?, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				"Desk",
				"swift-device",
				"AA:BB:CC:DD:EE:FF",
				"secret-api-key-123456",
				"1.8.6",
				playlistId,
				-42,
				88,
				300,
				15,
				800,
				480,
			).lastInsertRowid,
	);
	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(deviceId, screenId);
	await service.devices.log(deviceId, "info", "inventory_test", { ok: true });

	const listResponse = await handleDevices(
		new Request("http://tiding.test/api/devices"),
		service,
	);
	expect(listResponse.status).toBe(200);
	const list = (await listResponse.json()) as {
		data: {
			items: Array<{
				id: number;
				label: string;
				friendlyId: string;
				apiKeyPreview: string;
				hasApiKey: boolean;
			}>;
			total: number;
		};
	};
	expect(list.data.total).toBe(1);
	expect(list.data.items[0]).toMatchObject({
		id: deviceId,
		label: "Desk",
		friendlyId: "swift-device",
		apiKeyPreview: "secr...3456",
		hasApiKey: true,
	});
	expect(JSON.stringify(list)).not.toContain("secret-api-key-123456");

	const detailResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}`),
		service,
	);
	expect(detailResponse.status).toBe(200);
	expect(await detailResponse.json()).toMatchObject({
		data: {
			id: deviceId,
			macAddress: "AA:BB:CC:DD:EE:FF",
			firmwareVersion: "1.8.6",
			playlistId,
			isActive: true,
			wifi: -42,
			battery: 88,
			refreshRate: 300,
			imageTimeout: 15,
			width: 800,
			height: 480,
			assignmentsUrl: `/api/devices/${deviceId}/assignments`,
			logsUrl: `/api/devices/${deviceId}/logs`,
		},
	});

	const assignmentsResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}/assignments`),
		service,
	);
	expect(assignmentsResponse.status).toBe(200);
	const assignments = (await assignmentsResponse.json()) as {
		data: { items: Array<{ screenDesignId: number; isActive: boolean }> };
	};
	expect(assignments.data.items[0]).toMatchObject({
		screenDesignId: screenId,
		isActive: true,
	});

	const logsResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}/logs?limit=1`),
		service,
	);
	expect(logsResponse.status).toBe(200);
	const logs = (await logsResponse.json()) as {
		data: {
			items: Array<{ level: string; message: string; metadata: string }>;
		};
	};
	expect(logs.data.items[0]).toMatchObject({
		level: "info",
		message: "inventory_test",
	});
	expect(logs.data.items[0].metadata).toContain('"ok":true');

	const nextPlaylistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, is_active, updated_at) VALUES (?, true, CURRENT_TIMESTAMP)",
			)
			.run("Evening playlist").lastInsertRowid,
	);
	const assignResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}/playlist`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({ playlist_id: String(nextPlaylistId) }),
		}),
		service,
	);
	expect(assignResponse.status).toBe(200);
	expect(await assignResponse.json()).toMatchObject({
		data: { id: deviceId, playlistId: nextPlaylistId },
	});
	expect((await service.devices.findById(deviceId))?.playlist_id).toBe(
		nextPlaylistId,
	);

	const unassignResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}/playlist`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ playlist_id: "" }),
		}),
		service,
	);
	expect(unassignResponse.status).toBe(303);
	expect((await service.devices.findById(deviceId))?.playlist_id).toBeNull();

	const updateResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				_method: "PATCH",
				label: "Desk renamed",
				mac_address: "SHOULD-NOT-CHANGE",
			}),
		}),
		service,
	);
	expect(updateResponse.status).toBe(200);
	expect(await updateResponse.json()).toMatchObject({
		data: { id: deviceId, label: "Desk renamed" },
	});
	const updatedDevice = await service.devices.findById(deviceId);
	expect(updatedDevice?.label).toBe("Desk renamed");
	expect(updatedDevice?.mac_address).toBe("AA:BB:CC:DD:EE:FF");

	const missingResponse = await handleDevices(
		new Request("http://tiding.test/api/devices/99999"),
		service,
	);
	expect(missingResponse.status).toBe(404);

	const deleteResponse = await handleDevices(
		new Request(`http://tiding.test/api/devices/${deviceId}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ _method: "DELETE" }),
		}),
		service,
	);
	expect(deleteResponse.status).toBe(303);
	expect(deleteResponse.headers.get("Location")).toBe("/devices");
	expect(await service.devices.findById(deviceId)).toBeNull();

	service.close();
});

test("manual device registration creates playlist-backed devices", async () => {
	const service = new DatabaseService(testDbPath("manual-device"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const playlistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, is_active, updated_at) VALUES (?, true, CURRENT_TIMESTAMP)",
			)
			.run("Manual playlist").lastInsertRowid,
	);

	const pageResponse = await handleAdminPage(
		new Request("http://tiding.test/devices/new"),
		service,
		{
			dbPath: testDbPath("manual-device-options"),
			port: 43337,
			cachePath: "/tmp/tiding-manual-device-cache",
			version: "test",
			mcpEnabled: false,
		},
	);
	expect(pageResponse?.status).toBe(200);
	const html = await pageResponse?.text();
	expect(html).toContain("TRMNL Wi-Fi Setup");
	expect(html).toContain("enter Wi-Fi credentials");
	expect(html).toContain("assign the device to a playlist");
	expect(html).toContain('data-scope="text-field"');
	expect(html).toContain('data-scope="number-field"');
	expect(html).toContain('name="mac_address"');
	expect(html).toContain("http://localhost:43337/api/setup-screen.bmp");
	expect(html).toContain("Setup QR");
	expect(html).toContain("setupQr");
	expect(html).toContain("data-qr-code");
	expect(html).toContain('aria-label="Device server URL QR code"');
	expect(html).toContain('data-copy-source="device-server-url"');
	expect(html).toContain('data-copy-target="device-server-url"');
	expect(html).toContain('data-copy-source="device-setup-image-url"');
	expect(html).toContain('data-copy-target="device-setup-image-url"');
	expect(html).toContain('name="mac_address"');
	expect(html).toContain("Manual playlist");

	const createResponse = await handleDevices(
		new Request("http://tiding.test/api/devices", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				label: "Manual Device",
				mac_address: "AA:BB:CC:DD:11:22",
				width: "640",
				height: "384",
				playlist_id: String(playlistId),
			}),
		}),
		service,
	);
	expect(createResponse.status).toBe(303);
	const id = Number(createResponse.headers.get("Location")?.match(/\d+$/)?.[0]);
	const device = await service.devices.findById(id);
	expect(device).toMatchObject({
		label: "Manual Device",
		friendly_id: "manual-device",
		mac_address: "AA:BB:CC:DD:11:22",
		playlist_id: playlistId,
		width: 640,
		height: 384,
	});
	expect(device?.api_key.length).toBeGreaterThan(20);

	const invalidPlaylist = await handleDevices(
		new Request("http://tiding.test/api/devices", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				label: "Bad Device",
				mac_address: "AA:BB:CC:DD:11:33",
				playlist_id: 99999,
			}),
		}),
		service,
	);
	expect(invalidPlaylist.status).toBe(404);

	service.close();
});

test("display endpoint requires the TRMNL device ID header", async () => {
	const service = new DatabaseService(testDbPath("display-missing-id"), {
		bootstrap: true,
	});

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display"),
		service,
		null,
	);

	expect(response.status).toBe(422);
	const body = (await response.json()) as {
		statusCode: number;
		timestamp: string;
		path: string;
		method: string;
		type: string;
		status: string;
		detail: string;
		instance: string;
		extensions: { errors: unknown };
	};
	expect(body.statusCode).toBe(422);
	expect(Date.parse(body.timestamp)).toBeGreaterThan(0);
	expect(body.path).toBe("/api/display");
	expect(body.method).toBe("GET");
	expect(body.type).toBe("/problem_details#device_id");
	expect(body.status).toBe("unprocessable_content");
	expect(body.detail).toBe("Invalid device ID.");
	expect(body.instance).toBe("/api/display");
	expect(body.extensions.errors).toEqual({ HTTP_ID: ["is missing"] });

	service.close();
});

test("display endpoint returns removed-device payload for unknown device IDs", async () => {
	const service = new DatabaseService(testDbPath("display-unknown-device"), {
		bootstrap: true,
	});

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "missing-device" },
		}),
		service,
		(screenId) => `/cache/screen-${screenId}.bmp`,
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		status: number;
		image_url: string;
		filename: string;
		reset_firmware: boolean;
		message: string;
	};
	expect(body.status).toBe(0);
	expect(body.image_url).toBe("");
	expect(body.filename).toBe("");
	expect(body.reset_firmware).toBe(true);
	expect(body.message).toBe("Device removed from server");

	service.close();
});

test("display endpoint returns assigned screen metadata for configured devices", async () => {
	const service = new DatabaseService(testDbPath("display-metadata"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("Display screen");
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, true, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				"Kitchen",
				"kitchen-device",
				"AA:BB:CC:DD:EE:FF",
				"secret-key",
				123,
				45,
				800,
				480,
			).lastInsertRowid,
	);
	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(deviceId, screenId);

	const renderContexts: Array<{
		now: Date;
		device: {
			id: number;
			label: string;
			battery: number;
			wifi: number;
			firmwareVersion: string | null;
		};
	}> = [];
	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: {
				HTTP_ID: "kitchen-device",
				battery: "87",
				rssi: "-48",
				"Firmware-Version": "1.8.6",
			},
		}),
		service,
		(assignedScreenId, context) => {
			renderContexts.push(context);
			return `/cache/screen-${assignedScreenId}.bmp?v=abc123def456`;
		},
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		status: number;
		image_url: string;
		filename: string;
		screen_id: number;
		refresh_rate: number;
		image_url_timeout: number;
		update_firmware: boolean;
		maximum_compatibility: boolean;
		refresh_at: number;
		battery: number;
		wifi: number;
	};
	expect(body.status).toBe(0);
	expectDisplayImageUrl(body.image_url, {
		origin: "http://tiding.test",
		pathname: "/cache/screen-1.bmp",
		battery: 87,
		wifi: -48,
		deviceName: "Kitchen",
	});
	expect(body.filename).toBe("screen-1-abc123def456.bmp");
	expect(body.screen_id).toBe(screenId);
	expect(body.refresh_rate).toBe(123);
	expect(body.image_url_timeout).toBe(45);
	expect(body.update_firmware).toBe(false);
	expect(body.maximum_compatibility).toBe(true);
	expect(body.refresh_at).toBeGreaterThan(Date.now());
	expect(body.battery).toBe(87);
	expect(body.wifi).toBe(-48);
	const renderContext = renderContexts[0];
	expect(renderContext).toBeDefined();
	expect(renderContext?.now).toBeInstanceOf(Date);
	expect(renderContext?.device).toEqual({
		id: deviceId,
		label: "Kitchen",
		battery: 87,
		wifi: -48,
		firmwareVersion: "1.8.6",
	});
	const device = db
		.query(
			"SELECT last_seen_at, battery, wifi, firmware_version, refresh_pending, last_screen_id, screen_started_at FROM devices WHERE id = ?",
		)
		.get(deviceId) as {
		last_seen_at: string | null;
		battery: number;
		wifi: number;
		firmware_version: string | null;
		refresh_pending: number;
		last_screen_id: string | null;
		screen_started_at: string | null;
	};
	expect(device.last_seen_at).toBeTruthy();
	expect(device.battery).toBe(87);
	expect(device.wifi).toBe(-48);
	expect(device.firmware_version).toBe("1.8.6");
	expect(device.refresh_pending).toBe(0);
	expect(device.last_screen_id).toBe(String(screenId));
	expect(device.screen_started_at).toBeTruthy();
	const log = db
		.query(
			"SELECT level, message, metadata FROM device_logs WHERE device_id = ?",
		)
		.get(deviceId) as { level: string; message: string; metadata: string };
	expect(log.level).toBe("info");
	expect(log.message).toBe("display_request");
	expect(log.metadata).toContain('"maximumCompatibility":true');

	const steadyStateResponse = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "kitchen-device" },
		}),
		service,
		(assignedScreenId) =>
			`/cache/screen-${assignedScreenId}.bmp?v=def456abc123`,
	);
	const steadyStateBody = (await steadyStateResponse.json()) as {
		maximum_compatibility: boolean;
	};
	expect(steadyStateBody.maximum_compatibility).toBe(false);

	service.close();
});

test("display endpoint accepts TRMNL firmware v1.6.10 headers", async () => {
	const service = new DatabaseService(testDbPath("display-firmware-v1-6-10"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("Firmware screen");
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, true, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				"Firmware Device",
				"firmware-device",
				"AA:BB:CC:DD:EE:10",
				"firmware-api-key",
				900,
				0,
				800,
				480,
			).lastInsertRowid,
	);
	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(deviceId, screenId);

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: {
				ID: "AA:BB:CC:DD:EE:10",
				"Access-Token": "firmware-api-key",
				"Refresh-Rate": "900",
				"Battery-Voltage": "3.9",
				"FW-Version": "1.6.10",
				Model: "OG",
				RSSI: "-61",
				Width: "800",
				Height: "480",
			},
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);

	expect(response.status).toBe(200);
	expect(await response.json()).toMatchObject({
		status: 0,
		screen_id: screenId,
		battery: 75,
		wifi: -61,
	});
	expect(
		db
			.query(
				"SELECT battery, wifi, firmware_version, last_screen_id FROM devices WHERE id = ?",
			)
			.get(deviceId),
	).toMatchObject({
		battery: 75,
		wifi: -61,
		firmware_version: "1.6.10",
		last_screen_id: String(screenId),
	});

	service.close();
});

test("playlist repository rotates active screen items by duration", async () => {
	const service = new DatabaseService(testDbPath("playlist-rotation"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const firstScreenId = await service.screens.create("First playlist screen");
	const secondScreenId = await service.screens.create("Second playlist screen");
	const playlistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, is_active, updated_at) VALUES (?, true, CURRENT_TIMESTAMP)",
			)
			.run("Rotation").lastInsertRowid,
	);
	db.query(
		'INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?)',
	).run(playlistId, firstScreenId, "screen", 0, 10);
	db.query(
		'INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?)',
	).run(playlistId, secondScreenId, "screen", 1, 20);

	const firstSlot = await service.playlists.findCurrentScreenDesign(
		playlistId,
		5000,
	);
	const secondSlot = await service.playlists.findCurrentScreenDesign(
		playlistId,
		12000,
	);

	expect(firstSlot?.screenDesignId).toBe(firstScreenId);
	expect(firstSlot?.remainingSeconds).toBe(5);
	expect(secondSlot?.screenDesignId).toBe(secondScreenId);
	expect(secondSlot?.remainingSeconds).toBe(18);

	service.close();
});

test("playlist endpoints expose ordered playlist inventory", async () => {
	const service = new DatabaseService(testDbPath("playlist-api"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const firstScreenId = await service.screens.create("Morning");
	const secondScreenId = await service.screens.create("Evening");
	const playlistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, description, is_active, updated_at) VALUES (?, ?, true, CURRENT_TIMESTAMP)",
			)
			.run("Daily loop", "Kitchen rotation").lastInsertRowid,
	);
	db.query(
		'INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?)',
	).run(playlistId, secondScreenId, "screen", 2, 20);
	db.query(
		'INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?)',
	).run(playlistId, firstScreenId, "screen", 1, 10);

	const listResponse = await handlePlaylists(
		new Request("http://tiding.test/api/playlists"),
		service,
	);
	expect(listResponse.status).toBe(200);
	const list = (await listResponse.json()) as {
		data: { items: Array<{ id: number; name: string }>; total: number };
	};
	expect(list.data.total).toBe(1);
	expect(list.data.items[0]).toMatchObject({
		id: playlistId,
		name: "Daily loop",
	});

	const detailResponse = await handlePlaylists(
		new Request(`http://tiding.test/api/playlists/${playlistId}`),
		service,
	);
	expect(detailResponse.status).toBe(200);
	expect(await detailResponse.json()).toMatchObject({
		data: {
			id: playlistId,
			name: "Daily loop",
			description: "Kitchen rotation",
			isActive: true,
			itemsUrl: `/api/playlists/${playlistId}/items`,
		},
	});

	const itemsResponse = await handlePlaylists(
		new Request(`http://tiding.test/api/playlists/${playlistId}/items`),
		service,
	);
	expect(itemsResponse.status).toBe(200);
	const items = (await itemsResponse.json()) as {
		data: {
			items: Array<{
				screenDesignId: number;
				order: number;
				duration: number;
				config: string | null;
			}>;
			total: number;
		};
	};
	expect(items.data.total).toBe(2);
	expect(items.data.items.map((item) => item.screenDesignId)).toEqual([
		firstScreenId,
		secondScreenId,
	]);
	expect(items.data.items.map((item) => item.duration)).toEqual([10, 20]);
	expect(items.data.items[0].config).toBeNull();

	const missingResponse = await handlePlaylists(
		new Request("http://tiding.test/api/playlists/99999/items"),
		service,
	);
	expect(missingResponse.status).toBe(404);

	service.close();
});

test("playlist admin workflow creates playlist and manages screen items", async () => {
	const service = new DatabaseService(testDbPath("playlist-admin-workflow"), {
		bootstrap: true,
	});
	const firstScreenId = await service.screens.create("Menu");
	const secondScreenId = await service.screens.create("Weather");
	const options = {
		dbPath: ":memory:",
		port: 43337,
		cachePath: testDbPath("playlist-admin-workflow-cache"),
		version: "0.1.0",
		mcpEnabled: false,
	};

	try {
		const newPage = await handleAdminPage(
			new Request("http://tiding.test/playlists/new"),
			service,
			options,
		);
		const newHtml = await newPage?.text();
		expect(newHtml).toContain("Create Playlist");
		expect(newHtml).toContain('name="is_active"');
		expect(newHtml).toContain('data-scope="text-field"');
		expect(newHtml).toContain('data-scope="textarea-field"');

		const createResponse = await handlePlaylists(
			new Request("http://tiding.test/api/playlists", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					name: "Breakfast Loop",
					description: "Kitchen morning",
					is_active: "on",
				}),
			}),
			service,
		);
		expect(createResponse.status).toBe(303);
		const playlistId = Number(
			createResponse.headers.get("Location")?.match(/\d+$/)?.[0],
		);
		expect((await service.playlists.findById(playlistId))?.name).toBe(
			"Breakfast Loop",
		);

		const addResponse = await handlePlaylists(
			new Request(`http://tiding.test/api/playlists/${playlistId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					screen_design_id: String(firstScreenId),
					duration: "45",
					order: "0",
					layout: "2x2",
					slot: "3",
				}),
			}),
			service,
		);
		expect(addResponse.status).toBe(303);
		expect((await service.playlists.findItems(playlistId))[0]).toMatchObject({
			screen_design_id: firstScreenId,
			duration: 45,
			order: 0,
			config: '{"layout":"2x2","slot":3}',
		});

		const detailPage = await handleAdminPage(
			new Request(`http://tiding.test/playlists/${playlistId}`),
			service,
			options,
		);
		const detailHtml = await detailPage?.text();
		expect(detailHtml).toContain("Playlist Details");
		expect(detailHtml).toContain("Add Screens");
		expect(detailHtml).toContain('data-scope="number-field"');
		expect(detailHtml).toContain('data-scope="select"');
		expect(detailHtml).toContain("Screen Composer");
		expect(detailHtml).toContain("2x2");
		expect(detailHtml).toContain('data-composer-layout="2x2"');
		expect(detailHtml).toContain('data-composer-slot="3"');
		expect(detailHtml).toContain("slot");
		expect(detailHtml).toContain(`href="/playlists/${playlistId}?layout=2x2`);
		expect(detailHtml).toContain("#add-screen");
		expect(detailHtml).toContain("playlist-item-layout-");
		expect(detailHtml).toContain('name="_method" value="PATCH"');
		expect(detailHtml).toContain('data-scope="number-field"');
		expect(detailHtml).toContain('name="duration"');
		expect(detailHtml).toContain('value="45"');
		expect(detailHtml).toContain('name="slot"');
		expect(detailHtml).toContain('value="3"');
		expect(detailHtml).toContain("Save");
		expect(detailHtml).not.toContain("disabled");
		expect(detailHtml).toContain(String(secondScreenId));
		expect(detailHtml).toContain("45");

		const presetPage = await handleAdminPage(
			new Request(
				`http://tiding.test/playlists/${playlistId}?layout=1x2&slot=7`,
			),
			service,
			options,
		);
		const presetHtml = await presetPage?.text();
		expect(presetHtml).toContain('<option value="1x2" selected>');
		expect(presetHtml).toContain('name="slot" value="7"');

		const itemId = (await service.playlists.findItems(playlistId))[0].id;
		const updateItemResponse = await handlePlaylists(
			new Request(
				`http://tiding.test/api/playlists/${playlistId}/items/${itemId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						_method: "PATCH",
						screen_design_id: String(firstScreenId),
						duration: "30",
						order: "5",
						layout: "1x2",
						slot: "8",
					}),
				},
			),
			service,
		);
		expect(updateItemResponse.status).toBe(303);
		expect((await service.playlists.findItems(playlistId))[0]).toMatchObject({
			duration: 30,
			order: 5,
			config: '{"layout":"1x2","slot":8}',
		});

		const deleteItemResponse = await handlePlaylists(
			new Request(
				`http://tiding.test/api/playlists/${playlistId}/items/${itemId}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({ _method: "DELETE" }),
				},
			),
			service,
		);
		expect(deleteItemResponse.status).toBe(303);
		expect(await service.playlists.findItems(playlistId)).toEqual([]);
	} finally {
		service.close();
	}
});

test("playlist detail explains mixed screen resolutions", async () => {
	const service = new DatabaseService(
		testDbPath("playlist-resolution-warning"),
		{
			bootstrap: true,
		},
	);
	const landscapeId = await service.screens.create("Landscape");
	const portraitId = await service.screens.create("Portrait", undefined, {
		width: 480,
		height: 800,
	});
	const playlistId = await service.playlists.create({
		name: "Mixed screens",
		is_active: true,
	});
	await service.playlists.addItem({
		playlist_id: playlistId,
		screen_design_id: landscapeId,
		order: 0,
		duration: 30,
	});
	await service.playlists.addItem({
		playlist_id: playlistId,
		screen_design_id: portraitId,
		order: 1,
		duration: 30,
	});

	const detailPage = await handleAdminPage(
		new Request(`http://tiding.test/playlists/${playlistId}`),
		service,
		{
			dbPath: ":memory:",
			port: 43337,
			cachePath: testDbPath("playlist-resolution-warning-cache"),
			version: "0.1.0",
			mcpEnabled: false,
		},
	);
	const detailHtml = await detailPage?.text();
	expect(detailHtml).toContain("Resolution mismatch");
	expect(detailHtml).toContain("data-playlist-resolution-warning");
	expect(detailHtml).toContain("800x480");
	expect(detailHtml).toContain("480x800");

	service.close();
});

test("display endpoint falls back to device playlist when no screen assignment exists", async () => {
	const service = new DatabaseService(testDbPath("display-playlist"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("Playlist display screen");
	const playlistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, is_active, updated_at) VALUES (?, true, CURRENT_TIMESTAMP)",
			)
			.run("Single screen").lastInsertRowid,
	);
	db.query(
		'INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?)',
	).run(playlistId, screenId, "screen", 0, 60);
	db.query(
		"INSERT INTO devices (label, friendly_id, mac_address, api_key, playlist_id, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, ?, true, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
	).run(
		"Playlist Device",
		"playlist-device",
		"22:33:44:55:66:77",
		"playlist-key",
		playlistId,
		900,
		0,
		800,
		480,
	);

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "playlist-device" },
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		image_url: string;
		filename: string;
		screen_id: number;
		refresh_rate: number;
		maximum_compatibility: boolean;
	};
	expectDisplayImageUrl(body.image_url, {
		origin: "http://tiding.test",
		pathname: `/cache/screen-${screenId}.bmp`,
		battery: 0,
		wifi: 0,
		deviceName: "Playlist Device",
	});
	expect(body.filename).toBe(`screen-${screenId}.bmp`);
	expect(body.screen_id).toBe(screenId);
	expect(body.refresh_rate).toBeGreaterThan(0);
	expect(body.refresh_rate).toBeLessThanOrEqual(60);
	expect(body.maximum_compatibility).toBe(true);

	const device = await service.devices.findByHttpId("playlist-device");
	expect(device).toBeTruthy();
	if (device) {
		const selection = await selectedScreenForDevice(service, device);
		expect(selection.source).toBe("playlist");
		expect(selection.playlistName).toBe("Single screen");
		expect(selection.screen?.id).toBe(screenId);
		expect(selection.playlist?.remainingSeconds).toBeGreaterThan(0);
	}

	service.close();
});

test("synthetic compatibility database display uses playlist-backed screen metadata", async () => {
	const service = new DatabaseService(
		syntheticCompatDbPath("compat-display-playlist"),
	);

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "AA:BB:CC:DD:EE:03" },
		}),
		service,
		(screenId) => `/cache/screen-${screenId}.bmp`,
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		image_url: string;
		filename: string;
		screen_id: number;
		refresh_rate: number;
		refresh_at: number;
		firmware_url: string;
		update_firmware: boolean;
	};
	expect(body.screen_id).toBe(1);
	expectDisplayImageUrl(body.image_url, {
		origin: "http://tiding.test",
		pathname: "/cache/screen-1.bmp",
		battery: 34,
		wifi: -54,
		deviceName: "Sample TRMNL",
	});
	expect(body.filename).toBe("screen-1.bmp");
	expect(body.refresh_rate).toBeGreaterThan(0);
	expect(body.refresh_rate).toBeLessThanOrEqual(60);
	expect(body.refresh_at).toBeGreaterThan(Date.now());
	expect(body.firmware_url).toBe("");
	expect(body.update_firmware).toBe(false);

	service.close();
});

test("display endpoint only requests firmware update for a newer stable artifact", async () => {
	const service = new DatabaseService(testDbPath("display-firmware-update"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("Firmware update screen");
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, firmware_version, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, ?, true, ?, ?, true, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				"Firmware Device",
				"firmware-device",
				"55:66:77:88:99:AA",
				"firmware-key",
				"1.0.0",
				120,
				0,
				800,
				480,
			).lastInsertRowid,
	);
	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(deviceId, screenId);
	db.query(
		"INSERT INTO firmware (version, download_url, release_notes, is_stable) VALUES (?, ?, ?, true)",
	).run("1.1.0", "/firmware/v1.1.0.bin", "Stable update");

	const updateResponse = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "firmware-device" },
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);
	const updateBody = (await updateResponse.json()) as {
		firmware_url: string;
		update_firmware: boolean;
	};
	expect(updateBody.update_firmware).toBe(true);
	expect(updateBody.firmware_url).toBe(
		"http://tiding.test/firmware/v1.1.0.bin",
	);

	const currentResponse = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "firmware-device", "Firmware-Version": "1.1.0" },
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);
	const currentBody = (await currentResponse.json()) as {
		firmware_url: string;
		update_firmware: boolean;
	};
	expect(currentBody.update_firmware).toBe(false);
	expect(currentBody.firmware_url).toBe("");

	const newerDeviceResponse = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "firmware-device", "Firmware-Version": "2.0.0" },
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);
	const newerDeviceBody = (await newerDeviceResponse.json()) as {
		firmware_url: string;
		update_firmware: boolean;
	};
	expect(newerDeviceBody.update_firmware).toBe(false);
	expect(newerDeviceBody.firmware_url).toBe("");

	db.query(
		"INSERT INTO firmware (version, download_url, release_notes, is_stable) VALUES (?, ?, ?, true)",
	).run("invalid-build", "/firmware/invalid.bin", "Bad version");
	const invalidStableResponse = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "firmware-device", "Firmware-Version": "1.0.0" },
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);
	const invalidStableBody = (await invalidStableResponse.json()) as {
		firmware_url: string;
		update_firmware: boolean;
	};
	expect(invalidStableBody.update_firmware).toBe(false);
	expect(invalidStableBody.firmware_url).toBe("");

	service.close();
});

test("display endpoint requests full refresh for pending refresh then clears the flag", async () => {
	const service = new DatabaseService(testDbPath("display-refresh-pending"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("Refresh screen");
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, is_active, refresh_rate, image_timeout, firmware_update, width, height, refresh_pending, last_screen_id, updated_at) VALUES (?, ?, ?, ?, true, ?, ?, false, ?, ?, true, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				"Desk",
				"desk-device",
				"11:22:33:44:55:66",
				"desk-key",
				60,
				0,
				800,
				480,
				String(screenId),
			).lastInsertRowid,
	);
	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(deviceId, screenId);

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "desk-device" },
		}),
		service,
		(assignedScreenId) => `/cache/screen-${assignedScreenId}.bmp`,
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		maximum_compatibility: boolean;
		refresh_rate: number;
		refresh_at: number;
	};
	expect(body.maximum_compatibility).toBe(true);
	expect(body.refresh_rate).toBe(60);
	expect(body.refresh_at).toBeGreaterThan(Date.now());
	const device = db
		.query("SELECT refresh_pending, last_screen_id FROM devices WHERE id = ?")
		.get(deviceId) as { refresh_pending: number; last_screen_id: string };
	expect(device.refresh_pending).toBe(0);
	expect(device.last_screen_id).toBe(String(screenId));

	service.close();
});

test("display endpoint treats blocked devices as removed", async () => {
	const service = new DatabaseService(testDbPath("display-blocked-device"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	db.query(
		"INSERT INTO devices (label, mac_address, api_key, is_active, updated_at) VALUES (?, ?, ?, true, CURRENT_TIMESTAMP)",
	).run("Blocked", "blocked-device", "blocked-key");
	db.query(
		"INSERT INTO blocked_devices (mac_address, reason) VALUES (?, ?)",
	).run("blocked-device", "test block");

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "blocked-device" },
		}),
		service,
		(screenId) => `/cache/screen-${screenId}.bmp`,
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		reset_firmware: boolean;
		message: string;
	};
	expect(body.reset_firmware).toBe(true);
	expect(body.message).toBe("Device removed from server");

	service.close();
});

test("display endpoint treats inactive devices as removed", async () => {
	const service = new DatabaseService(testDbPath("display-inactive-device"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	db.query(
		"INSERT INTO devices (label, mac_address, api_key, is_active, updated_at) VALUES (?, ?, ?, false, CURRENT_TIMESTAMP)",
	).run("Inactive", "inactive-device", "inactive-key");

	const response = await handleDisplay(
		new Request("http://tiding.test/api/display", {
			headers: { HTTP_ID: "inactive-device" },
		}),
		service,
		(screenId) => `/cache/screen-${screenId}.bmp`,
	);

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		reset_firmware: boolean;
		message: string;
	};
	expect(body.reset_firmware).toBe(true);
	expect(body.message).toBe("Device removed from server");

	service.close();
});

test("mcp exposes the minimum tool contract and is disabled by default", () => {
	const names = mcpToolDefinitions.map((tool) => tool.name);

	expect(names).toContain("screen_designs.list");
	expect(names).toContain("screen_designs.get");
	expect(names).toContain("screen_designs.create");
	expect(names).toContain("screen_designs.update");
	expect(names).toContain("widgets.list");
	expect(names).toContain("widgets.create");
	expect(names).toContain("widgets.update");
	expect(names).toContain("widgets.delete");
	expect(names).toContain("data_sources.list");
	expect(names).toContain("data_sources.create");
	expect(names).toContain("data_sources.update");
	expect(names).toContain("data_sources.fetch");
	expect(names).toContain("custom_widgets.list");
	expect(names).toContain("custom_widgets.get");
	expect(names).toContain("custom_widgets.create");
	expect(names).toContain("custom_widgets.update");
	expect(names).toContain("custom_widgets.delete");
	expect(names).toContain("custom_widgets.render_preview");
	expect(names).toContain("playlists.list");
	expect(names).toContain("playlists.get");
	expect(names).toContain("playlists.create");
	expect(names).toContain("playlists.update");
	expect(names).toContain("playlists.add_item");
	expect(names).toContain("playlists.update_item");
	expect(names).toContain("playlists.delete_item");
	expect(names).toContain("devices.list");
	expect(names).toContain("devices.get");
	expect(names).toContain("devices.create_manual");
	expect(names).toContain("devices.update_label");
	expect(names).toContain("devices.assign_playlist");
	expect(names).toContain("devices.logs");
	expect(names).toContain("devices.assignments");
	expect(names).toContain("devices.delete");
	expect(names).toContain("screen_designs.render_preview");
	expect(names).toContain("health.status");
	expect(
		mcpToolDefinitions.every(
			(tool) => Array.isArray(tool.storyIds) && tool.storyIds.includes("ST-18"),
		),
	).toBe(true);
	expect(
		mcpToolDefinitions.find(
			(tool) => tool.name === "screen_designs.render_preview",
		)?.description,
	).toContain("1-bit BMP");

	expect(isMcpAutoStartEnabled({})).toBe(false);
	expect(isMcpAutoStartEnabled({ TIDING_MCP: "1" })).toBe(true);
});

test("mcp screen and data-source lifecycle tools reuse repository validation", async () => {
	const service = new DatabaseService(testDbPath("mcp-lifecycle"), {
		bootstrap: true,
	});
	const invalidated: number[] = [];

	const screen = (await callMcpTool({ db: service }, "screen_designs.create", {
		name: "MCP lifecycle screen",
		description: "Created by MCP",
		width: 640,
		height: 384,
		background: "#eeeeee",
	})) as { id: number; width: number; height: number };
	expect(screen).toMatchObject({ width: 640, height: 384 });

	const updatedScreen = (await callMcpTool(
		{ db: service, invalidateRender: (id) => invalidated.push(id) },
		"screen_designs.update",
		{ id: screen.id, name: "Updated MCP screen", width: 800 },
	)) as { id: number; name: string; width: number };
	expect(updatedScreen).toMatchObject({
		id: screen.id,
		name: "Updated MCP screen",
		width: 800,
	});
	expect(invalidated).toEqual([screen.id]);

	const source = (await callMcpTool({ db: service }, "data_sources.create", {
		name: "MCP source lifecycle",
		url: "http://example.test/api",
		headers: { Authorization: "Bearer token" },
		context_schema: { city: { type: "string" } },
		refresh_interval: 120,
	})) as { id: number; name: string; refresh_interval: number };
	expect(source).toMatchObject({
		name: "MCP source lifecycle",
		refresh_interval: 120,
	});

	const updatedSource = (await callMcpTool(
		{ db: service },
		"data_sources.update",
		{ id: source.id, method: "POST", body: '{"query":"forecast"}' },
	)) as { id: number; method: string };
	expect(updatedSource.method).toBe("POST");

	await expect(
		callMcpTool({ db: service }, "data_sources.create", {
			name: "Bad source",
			url: "http://example.test",
			headers: "{bad json",
		}),
	).rejects.toThrow("headers must be valid JSON");

	const health = (await callMcpTool({ db: service }, "health.status")) as {
		ok: boolean;
		storyIds: string[];
		counts: { screens: number; dataSources: number; tools: number };
	};
	expect(health.ok).toBe(true);
	expect(health.storyIds).toContain("ST-18");
	expect(health.counts.screens).toBeGreaterThanOrEqual(1);
	expect(health.counts.dataSources).toBe(1);
	expect(health.counts.tools).toBe(mcpToolDefinitions.length);

	service.close();
});

test("mcp playlist tools reproduce playlist composition workflow", async () => {
	const service = new DatabaseService(testDbPath("mcp-playlists"), {
		bootstrap: true,
	});
	const firstScreenId = await service.screens.create("MCP playlist first");
	const secondScreenId = await service.screens.create("MCP playlist second");

	const playlist = (await callMcpTool({ db: service }, "playlists.create", {
		name: "MCP playlist",
		description: "Created by automation",
	})) as { id: number; name: string; is_active: boolean };
	expect(playlist).toMatchObject({
		name: "MCP playlist",
		is_active: 1,
	});

	const item = (await callMcpTool({ db: service }, "playlists.add_item", {
		playlist_id: playlist.id,
		screen_design_id: firstScreenId,
		order: 0,
		duration: 45,
		config: { layout: "2x1", slot: 1 },
	})) as { id: number };
	expect(item.id).toBeGreaterThan(0);

	const updatedItem = (await callMcpTool(
		{ db: service },
		"playlists.update_item",
		{
			id: item.id,
			screen_design_id: secondScreenId,
			order: 2,
			duration: 90,
			config: { layout: "2x2", slot: 3 },
		},
	)) as { id: number };
	expect(updatedItem.id).toBe(item.id);

	const detail = (await callMcpTool({ db: service }, "playlists.get", {
		id: playlist.id,
	})) as {
		items: Array<{
			id: number;
			screen_design_id: number;
			order: number;
			duration: number;
			config: string;
		}>;
	};
	expect(detail.items).toHaveLength(1);
	expect(detail.items[0]).toMatchObject({
		id: item.id,
		screen_design_id: secondScreenId,
		order: 2,
		duration: 90,
		config: '{"layout":"2x2","slot":3}',
	});

	await expect(
		callMcpTool({ db: service }, "playlists.add_item", {
			playlist_id: playlist.id,
			screen_design_id: 999999,
		}),
	).rejects.toThrow("Screen not found");

	await callMcpTool({ db: service }, "playlists.delete_item", {
		id: item.id,
	});
	expect(await service.playlists.findItems(playlist.id)).toEqual([]);

	const listed = (await callMcpTool(
		{ db: service },
		"playlists.list",
	)) as Array<{
		id: number;
	}>;
	expect(listed.map((entry) => entry.id)).toContain(playlist.id);

	service.close();
});

test("mcp device tools reproduce inventory and assignment workflow", async () => {
	const service = new DatabaseService(testDbPath("mcp-devices"), {
		bootstrap: true,
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const screenId = await service.screens.create("MCP device screen");
	const playlist = (await callMcpTool({ db: service }, "playlists.create", {
		name: "MCP device playlist",
	})) as { id: number };
	const device = (await callMcpTool({ db: service }, "devices.create_manual", {
		label: "Office Panel",
		mac_address: "AA:BB:CC:DD:EE:01",
		playlist_id: playlist.id,
		width: 800,
		height: 480,
	})) as {
		id: number;
		label: string;
		mac_address: string;
		api_key: string;
		playlist_id: number;
	};
	expect(device).toMatchObject({
		label: "Office Panel",
		mac_address: "AA:BB:CC:DD:EE:01",
		playlist_id: playlist.id,
	});
	expect(device.api_key).toBeTruthy();

	const renamed = (await callMcpTool({ db: service }, "devices.update_label", {
		id: device.id,
		label: "Office Wall",
	})) as { id: number; label: string };
	expect(renamed).toMatchObject({ id: device.id, label: "Office Wall" });

	await callMcpTool({ db: service }, "devices.assign_playlist", {
		id: device.id,
		playlist_id: null,
	});
	expect((await service.devices.findById(device.id))?.playlist_id).toBeNull();
	await callMcpTool({ db: service }, "devices.assign_playlist", {
		id: device.id,
		playlist_id: playlist.id,
	});
	expect((await service.devices.findById(device.id))?.playlist_id).toBe(
		playlist.id,
	);

	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(device.id, screenId);
	db.query(
		"INSERT INTO device_logs (device_id, level, message, metadata) VALUES (?, ?, ?, ?)",
	).run(device.id, "info", "mcp_display_request", '{"battery":77}');

	const assignments = (await callMcpTool(
		{ db: service },
		"devices.assignments",
		{ id: device.id },
	)) as unknown as Array<{ screen_design_id: number; is_active: number }>;
	expect(assignments).toHaveLength(1);
	expect(assignments[0]).toMatchObject({
		screen_design_id: screenId,
		is_active: 1,
	});

	const logs = (await callMcpTool({ db: service }, "devices.logs", {
		id: device.id,
		limit: 1,
	})) as Array<{ message: string; metadata: string }>;
	expect(logs).toEqual([
		expect.objectContaining({
			message: "mcp_display_request",
			metadata: '{"battery":77}',
		}),
	]);

	const listed = (await callMcpTool({ db: service }, "devices.list")) as Array<{
		id: number;
	}>;
	expect(listed.map((entry) => entry.id)).toContain(device.id);
	expect(
		await callMcpTool({ db: service }, "devices.get", { id: device.id }),
	).toMatchObject({ id: device.id, label: "Office Wall" });

	await expect(
		callMcpTool({ db: service }, "devices.assign_playlist", {
			id: device.id,
			playlist_id: 999999,
		}),
	).rejects.toThrow("Playlist not found");

	await callMcpTool({ db: service }, "devices.delete", { id: device.id });
	expect(await service.devices.findById(device.id)).toBeNull();

	service.close();
});

test("mcp custom widget tools reuse datasource and preview services", async () => {
	const service = new DatabaseService(testDbPath("mcp-custom-widgets"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("MCP custom host");
	const templates = await service.templates.findAll();
	const customTemplate = templates.find(
		(template) => template.name === CUSTOM_WIDGET_FRAMEWORK_NAME,
	);
	const invalidated: number[] = [];
	const sourceId = await service.dataSources.create({
		name: "MCP widget source",
		url: "http://example.test/data",
		method: "GET",
	});
	await service.dataSources.updateCache(sourceId, '{"temperature":21}', null);

	const created = (await callMcpTool({ db: service }, "custom_widgets.create", {
		name: "MCP Weather",
		data_source_id: sourceId,
		displayType: "framework",
		template: "return <div>{$.temperature}</div>",
		config: { templateMode: "jsx" },
		context_schema: { city: { type: "string" } },
		min_width: 180,
		min_height: 90,
	})) as {
		id: number;
		displayType: string;
		config: string;
		context_schema: string;
	};
	expect(created).toMatchObject({
		displayType: "framework",
		config: '{"templateMode":"jsx"}',
		context_schema: '{"city":{"type":"string"}}',
	});

	await service.widgets.create({
		screen_design_id: screenId,
		template_id: customTemplate?.id ?? templates[0].id,
		config: JSON.stringify({ customWidgetId: created.id }),
	});

	const preview = (await callMcpTool(
		{
			db: service,
			renderCustomWidgetPreview: (id) => renderCustomWidgetPreview(service, id),
		},
		"custom_widgets.render_preview",
		{ id: created.id },
	)) as { contentType: string; bytes: number; magic: string };
	expect(preview.contentType).toBe("image/bmp");
	expect(preview.magic).toBe("BM");
	expect(preview.bytes).toBeGreaterThan(62);

	const updated = (await callMcpTool(
		{
			db: service,
			invalidateRender: (id) => invalidated.push(id),
		},
		"custom_widgets.update",
		{
			id: created.id,
			template: "return <div>{ctx.city}: {$.temperature}</div>",
			config: { templateMode: "jsx", unit: "C" },
		},
	)) as { id: number; config: string };
	expect(updated.config).toBe('{"templateMode":"jsx","unit":"C"}');
	expect(invalidated).toEqual([screenId]);

	const list = (await callMcpTool(
		{ db: service },
		"custom_widgets.list",
	)) as Array<{
		id: number;
	}>;
	expect(list.map((widget) => widget.id)).toContain(created.id);

	await expect(
		callMcpTool({ db: service }, "custom_widgets.create", {
			name: "Missing source widget",
			data_source_id: 999999,
			config: {},
		}),
	).rejects.toThrow("Data source not found");

	await callMcpTool(
		{ db: service, invalidateRender: (id) => invalidated.push(id) },
		"custom_widgets.delete",
		{ id: created.id },
	);
	expect(await service.customWidgets.findById(created.id)).toBeNull();
	expect(invalidated).toEqual([screenId, screenId]);

	service.close();
});

test("mcp widget calls use HTTP-compatible validation and invalidate render cache", async () => {
	const service = new DatabaseService(testDbPath("mcp-widgets"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("MCP widgets");
	const templates = await service.templates.findAll();
	const invalidated: number[] = [];

	const created = (await callMcpTool(
		{
			db: service,
			invalidateRender: (id) => invalidated.push(id),
		},
		"widgets.create",
		{
			screen_design_id: screenId,
			template_id: templates[0].id,
			config: { text: "MCP text" },
		},
	)) as { id: number };

	expect(created.id).toBeGreaterThan(0);
	expect(invalidated).toEqual([screenId]);
	expect((await service.widgets.findById(created.id))?.config).toBe(
		'{"text":"MCP text"}',
	);

	await expect(
		callMcpTool({ db: service }, "widgets.create", {
			screen_design_id: screenId,
			template_id: templates[0].id,
			config: "{bad json",
		}),
	).rejects.toThrow("config must be valid JSON");

	await callMcpTool(
		{
			db: service,
			invalidateRender: (id) => invalidated.push(id),
		},
		"widgets.update",
		{ id: created.id, x: 0, y: 0, config: '{"text":"Updated"}' },
	);
	expect(await service.widgets.findById(created.id)).toMatchObject({
		x: 0,
		y: 0,
	});
	expect(invalidated).toEqual([screenId, screenId]);

	await callMcpTool(
		{
			db: service,
			invalidateRender: (id) => invalidated.push(id),
		},
		"widgets.delete",
		{ id: created.id },
	);
	expect(await service.widgets.findById(created.id)).toBeNull();
	expect(invalidated).toEqual([screenId, screenId, screenId]);

	service.close();
});

test("mcp data source fetch shares backend cache and screen invalidation service", async () => {
	const upstream = Bun.serve({
		port: 0,
		fetch() {
			return Response.json({ weather: { temperature: 21 } });
		},
	});
	const service = new DatabaseService(testDbPath("mcp-source-fetch"), {
		bootstrap: true,
	});
	const invalidated: number[] = [];

	try {
		await waitForHttp(`http://127.0.0.1:${upstream.port}/weather`);
		const screenId = await service.screens.create("MCP source screen");
		const templates = await service.templates.findAll();
		const dataSourceId = await service.dataSources.create({
			name: "MCP source",
			url: `http://127.0.0.1:${upstream.port}/weather`,
			method: "GET",
			json_path: "$.weather.temperature",
		});
		const customWidgetId = await service.customWidgets.create({
			name: "MCP custom widget",
			data_source_id: dataSourceId,
			displayType: "text",
			template: "{{data}} C",
			config: "{}",
		});
		await service.widgets.create({
			screen_design_id: screenId,
			template_id: templates[0].id,
			config: JSON.stringify({ customWidgetId }),
		});

		const result = await callMcpTool(
			{
				db: service,
				invalidateRender: (id) => invalidated.push(id),
			},
			"data_sources.fetch",
			{ id: dataSourceId },
		);

		expect(result).toEqual({
			ok: true,
			data: "21",
			fields: [{ path: "$", type: "number" }],
		});
		expect((await service.dataSources.findById(dataSourceId))?.last_data).toBe(
			21,
		);
		expect(invalidated).toEqual([screenId]);
	} finally {
		upstream.stop(true);
		service.close();
	}
});

test("mcp render preview returns 1-bit BMP render metadata", async () => {
	const service = new DatabaseService(testDbPath("mcp-render"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("MCP render");

	const result = await callMcpTool(
		{
			db: service,
			renderPreview: async (id) => ({
				imagePath: `/tmp/screen-${id}.bmp`,
				imageUrl: `/cache/screen-${id}.bmp`,
				mimeType: "image/bmp",
				width: 800,
				height: 480,
				renderedAt: "2026-07-07T00:00:00.000Z",
			}),
		},
		"screen_designs.render_preview",
		{ id: screenId },
	);

	expect(result).toEqual({
		imagePath: `/tmp/screen-${screenId}.bmp`,
		imageUrl: `/cache/screen-${screenId}.bmp`,
		mimeType: "image/bmp",
		width: 800,
		height: 480,
		renderedAt: "2026-07-07T00:00:00.000Z",
	});

	service.close();
});

test("mcp stdio server handles JSON-RPC tool list and calls", async () => {
	const dbPath = testDbPath("mcp-stdio");
	const cachePath = nodePath.join("/tmp", "tiding-tests", "mcp-stdio-cache");
	const service = new DatabaseService(dbPath, { bootstrap: true });
	const screenId = await service.screens.create("MCP stdio screen");
	service.close();

	const messages = [
		{ jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
		{ jsonrpc: "2.0", method: "notifications/initialized" },
		{ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
		{
			jsonrpc: "2.0",
			id: 3,
			method: "tools/call",
			params: {
				name: "screen_designs.get",
				arguments: { id: screenId },
			},
		},
		{
			jsonrpc: "2.0",
			id: 4,
			method: "tools/call",
			params: {
				name: "screen_designs.render_preview",
				arguments: { id: screenId },
			},
		},
	];
	const proc = Bun.spawn(["bun", "run", "src/mcp/server.ts"], {
		cwd: process.cwd(),
		env: {
			...process.env,
			DB_PATH: dbPath,
			TIDING_RENDER_CACHE_DIR: cachePath,
		},
		stdin: "pipe",
		stdout: "pipe",
		stderr: "pipe",
	});

	proc.stdin.write(
		`${messages.map((message) => JSON.stringify(message)).join("\n")}\n`,
	);
	proc.stdin.end();

	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	expect(exitCode).toBe(0);
	expect(stderr).toBe("");

	const responses = stdout
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line)) as Array<{
		id: number;
		result?: {
			serverInfo?: { name: string };
			tools?: Array<{ name: string }>;
			content?: Array<{ type: string; text: string }>;
		};
		error?: unknown;
	}>;
	expect(responses.map((response) => response.id)).toEqual([1, 2, 3, 4]);
	expect(responses[0].result?.serverInfo?.name).toBe("tiding");
	expect(responses[1].result?.tools?.map((tool) => tool.name)).toContain(
		"screen_designs.render_preview",
	);
	expect(responses[2].error).toBeUndefined();
	const screenResult = JSON.parse(
		responses[2].result?.content?.[0].text ?? "{}",
	);
	expect(screenResult.name).toBe("MCP stdio screen");

	expect(responses[3].error).toBeUndefined();
	const renderResult = JSON.parse(
		responses[3].result?.content?.[0].text ?? "{}",
	);
	expect(renderResult.mimeType).toBe("image/bmp");
	expect(renderResult.imagePath).toBe(
		nodePath.join(cachePath, `screen-${screenId}.bmp`),
	);
	expect(fs.existsSync(renderResult.imagePath)).toBe(true);
	const bmp = fs.readFileSync(renderResult.imagePath);
	expect(bmp[0]).toBe(0x42);
	expect(bmp[1]).toBe(0x4d);
	expect(bmp.readUInt16LE(28)).toBe(1);
});

test("admin page shells render screens, editor, data sources, custom widgets, and settings", async () => {
	const service = new DatabaseService(testDbPath("admin-pages"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Kitchen", "Daily info");
	const emptyScreenId = await service.screens.create("Empty", "No widgets yet");
	const sourceId = await service.dataSources.create({
		name: "Weather",
		url: "http://example.test/weather",
		method: "GET",
	});
	const customWidgetId = await service.customWidgets.create({
		name: "Temperature",
		data_source_id: sourceId,
		displayType: "text",
		template: "{{temperature}}",
		config: "{}",
		context_schema: '{"city":{"type":"string"},"limit":{"type":"number"}}',
	});
	const templates = await service.templates.findAll();
	const widgetId = await service.widgets.create({
		screen_design_id: screenId,
		template_id: templates[0].id,
		config: JSON.stringify({
			customWidgetId,
			rotation: 15,
			ctx: { city: "Berlin", limit: 3 },
		}),
	});
	const db = (
		service as unknown as {
			connection: { connection: import("bun:sqlite").Database };
		}
	).connection.connection;
	const playlistId = Number(
		db
			.query(
				"INSERT INTO playlists (name, description, is_active, updated_at) VALUES (?, ?, true, CURRENT_TIMESTAMP)",
			)
			.run("Kitchen Loop", "Daily kitchen screens").lastInsertRowid,
	);
	db.query(
		'INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?)',
	).run(playlistId, screenId, "screen", 0, 45);
	db.query(
		"INSERT INTO firmware (version, download_url, release_notes, is_stable) VALUES (?, ?, ?, true)",
	).run("1.1.0", "/firmware/v1.1.0.bin", "Stable update");
	const deviceId = Number(
		db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, firmware_version, playlist_id, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, ?, ?, true, ?, ?, true, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				"Kitchen TRMNL",
				"kitchen-trmnl",
				"AA:BB:CC:DD:EE:30",
				"kitchen-secret-key",
				"1.0.0",
				playlistId,
				300,
				15,
				800,
				480,
			).lastInsertRowid,
	);
	db.query(
		"INSERT INTO devices (label, friendly_id, mac_address, api_key, firmware_version, playlist_id, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, ?, ?, false, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
	).run(
		"Garage TRMNL",
		"garage-trmnl",
		"AA:BB:CC:DD:EE:31",
		"garage-secret-key",
		"1.1.0",
		null,
		900,
		0,
		800,
		480,
	);
	db.query(
		"INSERT INTO device_screen_assignments (device_id, screen_design_id, is_active) VALUES (?, ?, true)",
	).run(deviceId, screenId);
	await service.devices.log(deviceId, "info", "admin_page_test", {
		source: "admin",
	});

	const options = {
		dbPath: ":memory:",
		port: 43337,
		cachePath: testDbPath("admin-cache-dir"),
		version: "0.1.0",
		mcpEnabled: false,
	};

	for (const path of [
		"/dashboard",
		"/screens",
		"/screens/new",
		`/screens/${screenId}`,
		`/screens/designer/${screenId}`,
		`/screens/widgets/new?screenId=${screenId}`,
		`/screens/widgets/${widgetId}`,
		"/devices",
		"/devices/new",
		`/devices/${deviceId}`,
		"/playlists",
		`/playlists/${playlistId}`,
		"/data-sources",
		`/data-sources/${sourceId}`,
		"/custom-widgets",
		`/custom-widgets/${customWidgetId}`,
		"/plugins",
		"/settings",
	]) {
		const response = await handleAdminPage(
			new Request(`http://tiding.test${path}`),
			service,
			options,
		);
		expect(response?.status).toBe(200);
		const html = await response?.text();
		const pageHtml = html ?? "";
		expect(html).toContain("Admin Console");
		expect(html).toContain("/static/js/islands.js");
		expect(html).toContain("data-theme-picker");
		expect(html).not.toContain("data-theme-option");
		expect(html).toContain("data-theme-bootstrap");
		expect(pageHtml.indexOf("data-theme-bootstrap")).toBeLessThan(
			pageHtml.indexOf("/static/admin.css"),
		);
		expect(html).toContain("data-nav-link");
		expect(html).toContain("data-page-outlet");
	}

	const widgetFormResponse = await handleAdminPage(
		new Request(`http://tiding.test/screens/widgets/${widgetId}`),
		service,
		options,
	);
	const widgetFormHtml = await widgetFormResponse?.text();
	expect(widgetFormHtml).toContain("Framework Settings");
	expect(widgetFormHtml).toContain("data-framework-config-root");
	expect(widgetFormHtml).toContain("data-framework-config-input");
	expect(widgetFormHtml).toContain('data-config-key="text"');
	expect(widgetFormHtml).toContain("Placement Context");
	expect(widgetFormHtml).toContain("data-widget-context-root");
	expect(widgetFormHtml).toContain('data-context-key="city"');
	expect(widgetFormHtml).toContain('value="Berlin"');
	expect(widgetFormHtml).toContain('data-context-key="limit"');
	expect(widgetFormHtml).toContain('value="3"');
	expect(widgetFormHtml).toContain("Config JSON");
	expect(widgetFormHtml).toContain('data-scope="text-field"');
	expect(widgetFormHtml).toContain('data-scope="number-field"');
	expect(widgetFormHtml).toContain('data-scope="textarea-field"');

	const dashboardResponse = await handleAdminPage(
		new Request("http://tiding.test/dashboard"),
		service,
		options,
	);
	const dashboardHtml = await dashboardResponse?.text();
	expect(dashboardHtml).toContain("/devices/new");
	expect(dashboardHtml).toContain("/playlists/new");
	expect(dashboardHtml).toContain("System Status");
	expect(dashboardHtml).toContain("Takumi to 1-bit BMP");

	const pluginsResponse = await handleAdminPage(
		new Request("http://tiding.test/plugins"),
		service,
		options,
	);
	const pluginsHtml = await pluginsResponse?.text();
	expect(pluginsHtml).toContain("Coming Soon");
	expect(pluginsHtml).toContain("Plugin management");
	expect(pluginsHtml).toContain("Not implemented yet");
	expect(pluginsHtml).toContain("unsupported future widget");

	const screenResponse = await handleAdminPage(
		new Request(`http://tiding.test/screens/${screenId}`),
		service,
		options,
	);
	const screenHtml = await screenResponse?.text();
	expect(screenHtml).toContain(`/screens/designer/${screenId}`);
	expect(screenHtml).toContain('data-scope="text-field"');
	expect(screenHtml).toContain('data-scope="number-field"');
	expect(screenHtml).toContain("TRMNL Standard");
	expect(screenHtml).toContain("TRMNL Portrait");
	expect(screenHtml).toContain('data-confirm="Delete this item?"');
	expect(screenHtml).toContain('data-island="screen-preview"');
	expect(screenHtml).not.toContain("Config JSON");
	expect(screenHtml).not.toContain("Add widget inline");

	const emptyDesignerResponse = await handleAdminPage(
		new Request(`http://tiding.test/screens/designer/${emptyScreenId}`),
		service,
		options,
	);
	const emptyDesignerHtml = await emptyDesignerResponse?.text();
	expect(emptyDesignerHtml).toContain("data-designer-empty-state");
	expect(emptyDesignerHtml).toContain("Empty screen");
	expect(emptyDesignerHtml).not.toContain("designerWidgetCard");

	const designerResponse = await handleAdminPage(
		new Request(`http://tiding.test/screens/designer/${screenId}`),
		service,
		options,
	);
	const designerHtml = await designerResponse?.text();
	expect(designerHtml).toContain('data-island="screen-designer"');
	expect(designerHtml).toContain('aria-label="Screen designer"');
	expect(
		fs.readFileSync(
			"src/frontend/features/designer/screen-designer-island.ts",
			"utf8",
		),
	).not.toContain("hydrateDesignerKeyboard");
	expect(
		fs.readFileSync(
			"src/frontend/features/designer/screen-designer-interactions.ts",
			"utf8",
		),
	).toContain("hydrateDesignerKeyboard(root, canvas)");
	expect(
		fs.readFileSync(
			"src/frontend/features/designer/screen-designer-selection.ts",
			"utf8",
		),
	).toContain(".designerWidget[data-widget-id=");
	expect(
		fs.readFileSync("src/frontend/ark-dialog-island.tsx", "utf8"),
	).toContain("contentElement.hidden = false");
	expect(designerHtml).toContain('data-island="ark-dialog"');
	expect(designerHtml).toContain('data-dialog-content="true" hidden');
	expect(designerHtml).toContain('data-copy-source="screen-package"');
	expect(designerHtml).toContain('data-copy-target="screen-package"');
	expect(designerHtml).toContain('data-scope="textarea-field"');
	expect(designerHtml).toContain("Copy Code");
	expect(designerHtml).toContain(
		`data-create-url="/api/screen-designs/${screenId}/widgets"`,
	);
	expect(designerHtml).toContain("designerCanvas");
	expect(designerHtml).toContain("designerWidget");
	expect(designerHtml).toContain("data-canvas-widget-label");
	expect(designerHtml).toContain("data-widget-preview");
	expect(designerHtml).toContain(`/api/widgets/${widgetId}/preview`);
	expect(designerHtml).toContain("designerResizeHandle");
	expect(designerHtml).toContain("data-palette-search");
	expect(designerHtml).toContain('type="search"');
	expect(designerHtml).toContain('data-scope="text-field"');
	expect(designerHtml).toContain("data-palette-add");
	expect(designerHtml).toContain("data-framework-palette");
	expect(designerHtml).toContain("Widgets");
	expect(designerHtml).toContain("data-selection-panel");
	expect(designerHtml).toContain("data-selection-delete");
	expect(designerHtml).toContain("data-selection-save");
	expect(designerHtml).toContain('data-property-field="x"');
	expect(designerHtml).toContain('data-property-field="rotation"');
	expect(designerHtml).toContain('data-property-field="fontSize"');
	expect(designerHtml).toContain('data-property-field="opacity"');
	expect(designerHtml).toContain('data-property-field="textAlign"');
	expect(designerHtml).toContain('data-property-field="zIndex"');
	expect(designerHtml).toContain('data-scope="number-field"');
	expect(designerHtml).toContain("data-widget-row");
	expect(designerHtml).toContain("designerWidgetList");
	expect(designerHtml).toContain("designerWidgetCard");
	expect(designerHtml).toContain("data-widget-card-title");
	expect(designerHtml).toContain("designerIconActions");
	expect(designerHtml).toContain("/static/icons/lucide-1.23.0/");
	expect(designerHtml).not.toContain("strokewidth=");
	expect(designerHtml).not.toContain("react.forward_ref");
	expect(designerHtml).toContain("Widget Config");
	expect(designerHtml).toContain("data-widget-config-panel");
	expect(designerHtml).toContain("data-widget-config-field");
	expect(designerHtml).toContain('data-config-key="text"');
	expect(designerHtml).toContain('data-scope="text-field"');
	expect(designerHtml).toContain("Edit common Framework fields");
	expect(designerHtml).toContain('aria-label="Send to back"');
	expect(designerHtml).toContain('aria-label="Bring to front"');
	expect(designerHtml).toContain('aria-label="Rotate left"');
	expect(designerHtml).toContain('aria-label="Rotate right"');
	expect(designerHtml).toContain("Palette");
	expect(designerHtml).toContain("Plugin Widget");
	expect(designerHtml).toContain("Custom");
	expect(designerHtml).toContain("Active Widgets");
	expect(designerHtml).toContain("Grid");
	expect(designerHtml).toContain('data-scope="segmented-control"');
	expect(designerHtml).toContain('data-part="item"');
	expect(designerHtml).toContain('data-state="checked"');
	expect(designerHtml).toContain('data-park-variant="surface"');
	expect(designerHtml).toContain("data-snap-toggle");
	expect(designerHtml).toContain('aria-label="Zoom out"');
	expect(designerHtml).toContain('aria-label="Reset zoom"');
	expect(designerHtml).toContain('aria-label="Zoom in"');
	expect(designerHtml).toContain('data-designer-zoom-action="out"');
	expect(designerHtml).toContain('data-designer-zoom-action="reset"');
	expect(designerHtml).toContain('data-designer-zoom-action="in"');
	expect(designerHtml).toContain("data-designer-zoom-value");
	expect(designerHtml).toContain("data-designer-status");
	expect(designerHtml).toContain("data-designer-selection-summary");
	expect(designerHtml).toContain("data-designer-widget-count");
	expect(designerHtml).toContain("data-designer-canvas-bounds");
	expect(designerHtml).toContain("800px");
	expect(designerHtml).toContain("480px");
	expect(designerHtml).toContain("data-designer-empty-state");
	expect(designerHtml).toContain("data-designer-save");
	expect(designerHtml).toContain("Save Layout");
	expect(designerHtml).toContain("Render BMP");
	expect(designerHtml).toContain("designerCanvasViewport");
	expect(designerHtml).not.toContain(
		'<button type="button" class="small" disabled>Snap',
	);
	expect(designerHtml).toContain("Ready");
	expect(designerHtml).toContain("No selection");
	expect(designerHtml).toContain("1 widget");
	expect(designerHtml).toContain('data-update-url="/api/widgets/');
	expect(designerHtml).toContain("data-template-id=");
	expect(designerHtml).toContain("data-layer-url=");
	expect(designerHtml).toContain("data-z-index=");
	expect(designerHtml).toContain("data-rotate-url=");
	expect(designerHtml).not.toContain("<table><tbody>");
	expect(designerHtml).toContain('data-rotation="15"');
	expect(designerHtml).toContain("transform:rotate(15deg)");
	expect(designerHtml).toContain("Temperature");
	expect(designerHtml).toContain("draggable");

	const customWidgetResponse = await handleAdminPage(
		new Request(`http://tiding.test/custom-widgets/${customWidgetId}`),
		service,
		options,
	);
	const customWidgetHtml = await customWidgetResponse?.text();
	expect(customWidgetHtml).toContain(
		`/api/custom-widgets/${customWidgetId}/preview`,
	);
	expect(customWidgetHtml).toContain('alt="Custom widget preview"');
	expect(customWidgetHtml).toContain('data-scope="text-field"');
	expect(customWidgetHtml).toContain('data-scope="number-field"');
	expect(customWidgetHtml).toContain('data-scope="textarea-field"');

	const customWidgetsResponse = await handleAdminPage(
		new Request("http://tiding.test/custom-widgets"),
		service,
		options,
	);
	const customWidgetsHtml = await customWidgetsResponse?.text();
	expect(customWidgetsHtml).toContain("Temperature");
	expect(customWidgetsHtml).toContain("Weather");
	expect(customWidgetsHtml).toContain("100 × 50");

	const devicesResponse = await handleAdminPage(
		new Request("http://tiding.test/devices"),
		service,
		options,
	);
	const devicesHtml = await devicesResponse?.text();
	expect(devicesHtml).toContain("data-device-grid");
	expect(devicesHtml).toContain('name="q"');
	expect(devicesHtml).toContain('data-scope="text-field"');
	expect(devicesHtml).toContain('name="view"');
	expect(devicesHtml).toContain('value="grid"');
	expect(devicesHtml).toContain('value="list"');
	expect(devicesHtml).toContain('data-scope="segmented-control"');
	expect(devicesHtml).toContain("Kitchen TRMNL");
	expect(devicesHtml).toContain("kitchen-trmnl");
	expect(devicesHtml).toContain("/devices/");
	expect(devicesHtml).toContain("Firmware");
	expect(devicesHtml).toContain("1.0.0");
	expect(devicesHtml).toContain("update available");
	expect(devicesHtml).toContain("Garage TRMNL");
	expect(devicesHtml).toContain("2 / 2 devices");

	const listDevicesResponse = await handleAdminPage(
		new Request("http://tiding.test/devices?view=list"),
		service,
		options,
	);
	const listDevicesHtml = await listDevicesResponse?.text();
	expect(listDevicesHtml).toContain("<table");
	expect(listDevicesHtml).not.toContain("data-device-grid");
	expect(listDevicesHtml).toContain("Kitchen TRMNL");

	const filteredDevicesResponse = await handleAdminPage(
		new Request("http://tiding.test/devices?q=kitchen&status=update&view=grid"),
		service,
		options,
	);
	const filteredDevicesHtml = await filteredDevicesResponse?.text();
	expect(filteredDevicesHtml).toContain('value="kitchen"');
	expect(filteredDevicesHtml).toContain("Kitchen TRMNL");
	expect(filteredDevicesHtml).not.toContain("Garage TRMNL");
	expect(filteredDevicesHtml).toContain("1 / 2 devices");

	const disabledUpdateResponse = await handleAdminPage(
		new Request("http://tiding.test/devices?status=updates-disabled"),
		service,
		options,
	);
	const disabledUpdateHtml = await disabledUpdateResponse?.text();
	expect(disabledUpdateHtml).toContain("Garage TRMNL");
	expect(disabledUpdateHtml).not.toContain("Kitchen TRMNL");

	const deviceResponse = await handleAdminPage(
		new Request(`http://tiding.test/devices/${deviceId}`),
		service,
		options,
	);
	const deviceHtml = await deviceResponse?.text();
	expect(deviceHtml).toContain("Playlist Assignment");
	expect(deviceHtml).toContain(`/api/devices/${deviceId}/playlist`);
	expect(deviceHtml).toContain("Kitchen Loop");
	expect(deviceHtml).toContain("Current Screen");
	expect(deviceHtml).toContain("Direct assignment");
	expect(deviceHtml).toContain("Current screen preview");
	expect(deviceHtml).toContain(`/api/devices/${deviceId}/current-screen.bmp`);
	expect(deviceHtml).not.toContain(`/api/screen-designs/${screenId}/preview`);
	expect(deviceHtml).toContain(`/screens/designer/${screenId}`);
	expect(deviceHtml).toContain("Edit Device");
	expect(deviceHtml).toContain(`/api/devices/${deviceId}`);
	expect(deviceHtml).toContain('name="label"');
	expect(deviceHtml).toContain('data-scope="text-field"');
	expect(deviceHtml).toContain("Save Device");
	expect(deviceHtml).toContain("Delete");
	expect(deviceHtml).toContain("Screen Assignments");
	expect(deviceHtml).toContain("Recent Logs");
	expect(deviceHtml).toContain("admin_page_test");
	expect(deviceHtml).toContain("kitc...-key");
	expect(deviceHtml).toContain("Firmware updates");
	expect(deviceHtml).toContain("Enabled");
	expect(deviceHtml).toContain("5 min (300 s)");
	expect(deviceHtml).toContain("15 s");
	expect(deviceHtml).toContain("Latest stable");
	expect(deviceHtml).toContain("1.1.0");
	expect(deviceHtml).toContain("/firmware/v1.1.0.bin");
	expect(deviceHtml).not.toContain("kitchen-secret-key");

	const playlistsResponse = await handleAdminPage(
		new Request("http://tiding.test/playlists"),
		service,
		options,
	);
	const playlistsHtml = await playlistsResponse?.text();
	expect(playlistsHtml).toContain("Kitchen Loop");
	expect(playlistsHtml).toContain("Daily kitchen screens");

	const playlistResponse = await handleAdminPage(
		new Request(`http://tiding.test/playlists/${playlistId}`),
		service,
		options,
	);
	const playlistHtml = await playlistResponse?.text();
	expect(playlistHtml).toContain("Playlist State");
	expect(playlistHtml).toContain("Connected Devices");
	expect(playlistHtml).toContain("Kitchen TRMNL");
	expect(playlistHtml).toContain("Screen Composer");
	expect(playlistHtml).toContain("composerSlot");
	expect(playlistHtml).toContain("Kitchen");
	expect(playlistHtml).toContain("800x480");
	expect(playlistHtml).toContain("Items");
	expect(playlistHtml).toContain("45");

	const settingsResponse = await handleAdminPage(
		new Request("http://tiding.test/settings"),
		service,
		options,
	);
	const settingsHtml = await settingsResponse?.text();
	expect(settingsHtml).toContain('data-island="ark-tabs"');
	expect(settingsHtml).toContain('data-scope="tabs"');
	expect(settingsHtml).toContain('data-tab-value="runtime"');
	expect(settingsHtml).toContain('data-tab-value="rendering"');
	expect(settingsHtml).toContain('data-tab-value="compatibility"');
	expect(settingsHtml).toContain('data-tab-value="security" hidden');
	expect(settingsHtml).toContain("Disabled by default");
	expect(settingsHtml).toContain("1-bit monochrome");
	expect(settingsHtml).toContain('name="data_source_timeout_ms"');
	expect(settingsHtml).toContain('data-scope="number-field"');
	expect(settingsHtml).toContain("Runtime Settings");
	expect(settingsHtml).toContain("E-ink Rendering");
	expect(settingsHtml).toContain("Floyd-Steinberg");
	expect(settingsHtml).toContain('name="render_threshold"');
	expect(settingsHtml).toContain('data-scope="text-field"');
	expect(settingsHtml).toContain('name="github_api_token"');
	expect(settingsHtml).toContain('name="welcome_title"');
	expect(settingsHtml).toContain('formaction="/api/settings/render-preview"');
	expect(settingsHtml).toContain('formtarget="render-bmp-preview"');
	expect(settingsHtml).toContain("data-render-bmp-preview");
	expect(settingsHtml).toContain("Server Status");
	expect(settingsHtml).toContain("Device URL");
	expect(settingsHtml).toContain('data-island="server-status"');
	expect(settingsHtml).toContain("data-server-status-refresh");
	expect(settingsHtml).toContain('data-server-status-field="lastChecked"');
	expect(settingsHtml).toContain("Troubleshooting");
	expect(settingsHtml).toContain("Device connection");

	const screensResponse = await handleAdminPage(
		new Request("http://tiding.test/screens"),
		service,
		options,
	);
	const screensHtml = await screensResponse?.text();
	expect(screensHtml).toContain("Import Screen Package");
	expect(screensHtml).toContain('data-island="ark-dialog"');
	expect(screensHtml).toContain('name="package"');
	expect(screensHtml).toContain('data-scope="textarea-field"');
	expect(screensHtml).toContain("screenThumb");
	expect(screensHtml).toContain(
		`src="/api/screen-designs/${screenId}/preview"`,
	);
	expect(screensHtml).toContain('loading="lazy"');
	expect(screensHtml).toContain("Cached BMP");
	expect(screensHtml).toContain("Designer");
	expect(screensHtml).toContain("Details");
	expect(screensHtml).toContain("Open BMP");
	expect(screensHtml).toContain(`/api/screen-designs/${screenId}/export`);
	expect(screensHtml).toContain(`/api/screen-designs/${screenId}`);
	expect(screensHtml).toContain('data-confirm="Delete this item?"');

	service.close();
});

test("screen package export and import preserves widgets without leaking request secrets", async () => {
	const service = new DatabaseService(testDbPath("screen-package"), {
		bootstrap: true,
	});
	const sourceId = await service.dataSources.create({
		name: "Secret source",
		url: "https://example.test/weather",
		method: "POST",
		headers: '{"Authorization":"Bearer secret"}',
		body: '{"zip":"10115"}',
	});
	const customWidgetId = await service.customWidgets.create({
		name: "Weather custom",
		data_source_id: sourceId,
		displayType: "framework",
		template:
			'return <div style={{display:"flex"}}>{ctx.city}: {$.temp}{config.unit}</div>',
		config: '{"templateMode":"jsx","unit":"C"}',
		context_schema: '{"city":{"type":"string"}}',
	});
	await service.dataSources.updateCache(sourceId, '{"temp":21}', null);
	const screenId = await service.screens.create("Package screen");
	const template = (await service.templates.findAll())[0];
	await service.widgets.create({
		screen_design_id: screenId,
		template_id: template.id,
		x: 20,
		y: 40,
		width: 300,
		height: 120,
		z_index: 3,
		config: JSON.stringify({
			customWidgetId,
			text: "Weather",
			ctx: { city: "Berlin" },
		}),
	});

	const exportResponse = await handleScreenDesigns(
		new Request(`http://tiding.test/api/screen-designs/${screenId}/export`),
		service,
	);
	expect(exportResponse.status).toBe(200);
	const pkg = await exportResponse.json();
	expect(JSON.stringify(pkg)).not.toContain("Bearer secret");
	expect(JSON.stringify(pkg)).not.toContain('"zip"');
	expect(pkg.widgets[0]).toMatchObject({ x: 20, y: 40, z_index: 3 });
	expect(pkg.customWidgets[0]).toMatchObject({
		displayType: "framework",
		context_schema: '{"city":{"type":"string"}}',
	});

	const importResponse = await handleScreenDesigns(
		new Request("http://tiding.test/api/screen-designs/import", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(pkg),
		}),
		service,
	);
	expect(importResponse.status).toBe(201);
	const importedId = ((await importResponse.json()) as { id: number }).id;
	const importedWidgets = await service.widgets.findByScreenDesign(importedId);
	expect(importedWidgets).toHaveLength(1);
	expect(importedWidgets[0].config).not.toContain(String(customWidgetId));
	const importedCustomWidgetId = customWidgetIdFromConfig(
		importedWidgets[0].config,
	);
	expect(importedCustomWidgetId).toBeTruthy();
	const importedCustomWidget = await service.customWidgets.findById(
		importedCustomWidgetId ?? 0,
	);
	expect(importedCustomWidget).toMatchObject({
		displayType: "framework",
		context_schema: '{"city":{"type":"string"}}',
	});
	if (importedCustomWidget) {
		await service.dataSources.updateCache(
			importedCustomWidget.data_source_id,
			'{"temp":22}',
			null,
		);
	}
	const { html } = await new ScreenComposer(service).composeHtml(importedId);
	expect(html).toContain("Berlin: 22");
	expect(html).toContain('style="display:flex;"');
	expect(await service.screens.findById(importedId)).toMatchObject({
		name: "Package screen Copy",
		width: 800,
		height: 480,
	});

	service.close();
});

test("admin form actions redirect and preserve screen geometry", async () => {
	const service = new DatabaseService(testDbPath("admin-form-actions"), {
		bootstrap: true,
	});

	const createResponse = await handleScreenDesigns(
		new Request("http://tiding.test/api/screen-designs", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				name: "Geometry",
				description: "form-created",
				width: "640",
				height: "384",
				background: "#EEEEEE",
			}),
		}),
		service,
	);

	expect(createResponse.status).toBe(303);
	const location = createResponse.headers.get("Location") || "";
	expect(location).toMatch(/^\/screens\/\d+$/);
	const screenId = Number.parseInt(location.split("/").pop() || "", 10);
	const created = await service.screens.findById(screenId);
	expect(created?.width).toBe(640);
	expect(created?.height).toBe(384);
	expect(created?.background).toBe("#EEEEEE");

	const updateResponse = await handleScreenDesigns(
		new Request(`http://tiding.test/api/screen-designs/${screenId}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				_method: "PATCH",
				name: "Geometry Updated",
				width: "800",
				height: "480",
				background: "#FFFFFF",
			}),
		}),
		service,
	);

	expect(updateResponse.status).toBe(303);
	const updated = await service.screens.findById(screenId);
	expect(updated?.name).toBe("Geometry Updated");
	expect(updated?.width).toBe(800);
	expect(updated?.height).toBe(480);

	const deleteResponse = await handleScreenDesigns(
		new Request(`http://tiding.test/api/screen-designs/${screenId}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ _method: "DELETE" }),
		}),
		service,
	);
	expect(deleteResponse.status).toBe(303);
	expect(deleteResponse.headers.get("Location")).toBe("/screens");
	expect(await service.screens.findById(screenId)).toBeNull();

	service.close();
});

test("admin widget edit and delete forms invalidate preview cache", async () => {
	const service = new DatabaseService(testDbPath("admin-widget-forms"), {
		bootstrap: true,
	});
	const screenId = await service.screens.create("Widget Forms");
	const templates = await service.templates.findAll();
	const widgetId = await service.widgets.create({
		screen_design_id: screenId,
		template_id: templates[0].id,
		config: '{"text":"Before"}',
	});
	const invalidated: number[] = [];

	const updateResponse = await handleWidgets(
		new Request(`http://tiding.test/api/widgets/${widgetId}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				_method: "PATCH",
				x: "11",
				y: "12",
				width: "210",
				height: "110",
				z_index: "3",
				config: '{"text":"After"}',
			}),
		}),
		service,
		(id) => invalidated.push(id),
	);

	expect(updateResponse.status).toBe(303);
	expect((await service.widgets.findById(widgetId))?.x).toBe(11);
	expect(invalidated).toEqual([screenId]);

	const deleteResponse = await handleWidgets(
		new Request(`http://tiding.test/api/widgets/${widgetId}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ _method: "DELETE" }),
		}),
		service,
		(id) => invalidated.push(id),
	);

	expect(deleteResponse.status).toBe(303);
	expect(await service.widgets.findById(widgetId)).toBeNull();
	expect(invalidated).toEqual([screenId, screenId]);

	service.close();
});
