import type { DatabaseService } from "../db";
import {
	discoverJsonFields,
	parseContext,
	resolveContextJsonText,
	resolveContextPlaceholders,
} from "./data-source-context";
import { assertNetworkAllowed, githubHeaders } from "./data-source-security";
import { parseFeedXml } from "./feed-parser";

const DEFAULT_FETCH_TIMEOUT_MS = 2000;

function clampTimeout(value: number) {
	return Math.max(250, Math.min(60000, value));
}

async function fetchTimeoutMs(db?: DatabaseService) {
	if (process.env.TIDING_FETCH_TIMEOUT_MS) {
		const parsed = Number.parseInt(process.env.TIDING_FETCH_TIMEOUT_MS, 10);
		if (Number.isInteger(parsed)) return clampTimeout(parsed);
	}
	if (!db) return DEFAULT_FETCH_TIMEOUT_MS;
	return clampTimeout(
		await db.settings.getInteger(
			"data_source_timeout_ms",
			DEFAULT_FETCH_TIMEOUT_MS,
		),
	);
}

function parseQuotedPathKey(path: string, start: number) {
	const quote = path[start];
	let key = "";
	let index = start + 1;

	while (index < path.length) {
		const char = path[index];
		if (char === "\\") {
			index += 1;
			if (index >= path.length) break;
			key += path[index];
			index += 1;
			continue;
		}
		if (char === quote) return { key, nextIndex: index + 1 };
		key += char;
		index += 1;
	}

	throw new Error(`Unsupported JSON path: ${path}`);
}

function parseBracketPathSegment(path: string, start: number) {
	let index = start + 1;
	if (index >= path.length) throw new Error(`Unsupported JSON path: ${path}`);

	const quote = path[index];
	if (quote === "'" || quote === '"') {
		const parsed = parseQuotedPathKey(path, index);
		if (path[parsed.nextIndex] !== "]")
			throw new Error(`Unsupported JSON path: ${path}`);
		return { segment: parsed.key, nextIndex: parsed.nextIndex + 1 };
	}

	let value = "";
	while (index < path.length && path[index] !== "]") {
		value += path[index];
		index += 1;
	}
	if (path[index] !== "]" || !/^\d+$/.test(value)) {
		throw new Error(`Unsupported JSON path: ${path}`);
	}
	return { segment: Number.parseInt(value, 10), nextIndex: index + 1 };
}

function tokenizeJsonPath(path: string) {
	const trimmed = path.trim();
	if (!trimmed || trimmed === "$") return [];
	if (!trimmed.startsWith("$"))
		throw new Error(`Unsupported JSON path: ${path}`);

	const segments: Array<string | number> = [];
	let index = 1;

	while (index < trimmed.length) {
		const char = trimmed[index];
		if (char === ".") {
			index += 1;
			const start = index;
			while (
				index < trimmed.length &&
				trimmed[index] !== "." &&
				trimmed[index] !== "["
			) {
				index += 1;
			}
			if (start === index) throw new Error(`Unsupported JSON path: ${path}`);
			segments.push(trimmed.slice(start, index));
			continue;
		}

		if (char === "[") {
			const parsed = parseBracketPathSegment(trimmed, index);
			segments.push(parsed.segment);
			index = parsed.nextIndex;
			continue;
		}

		throw new Error(`Unsupported JSON path: ${path}`);
	}

	return segments;
}

function selectJsonPath(data: string, jsonPath?: string | null) {
	if (!jsonPath?.trim()) return data;

	const parsed = JSON.parse(data);
	const pathSegments = tokenizeJsonPath(jsonPath);

	let current: unknown = parsed;
	for (const segment of pathSegments) {
		if (current === null || current === undefined) {
			throw new Error(`JSON path not found: ${jsonPath}`);
		}

		if (typeof segment === "number") {
			if (!Array.isArray(current))
				throw new Error(`JSON path not found: ${jsonPath}`);
			current = current[segment];
			continue;
		}

		current = (current as Record<string, unknown>)[segment];
	}

	if (current === undefined)
		throw new Error(`JSON path not found: ${jsonPath}`);
	return JSON.stringify(current);
}

export async function fetchDataSource(
	source: {
		url: string;
		type?: string | null;
		method: string;
		headers?: string | null;
		body?: unknown;
		request_body?: unknown;
		payload?: unknown;
		json_path?: string | null;
	},
	db?: DatabaseService,
	options: { context?: unknown } = {},
) {
	const sourceType = source.type?.toLowerCase() ?? "http";

	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		await fetchTimeoutMs(db),
	);
	try {
		const context = parseContext(options.context);
		const headers = (
			source.headers
				? JSON.parse(resolveContextJsonText(source.headers, context))
				: {}
		) as Record<string, string>;
		const method = source.method || "GET";
		const body = source.body ?? source.request_body ?? source.payload;
		const resolvedBody =
			typeof body === "string" ? resolveContextJsonText(body, context) : body;
		const resolvedUrl = resolveContextPlaceholders(source.url, context, {
			encode: true,
		});
		await assertNetworkAllowed(resolvedUrl, db);
		const response = await fetch(resolvedUrl, {
			method,
			headers: await githubHeaders(resolvedUrl, headers, db),
			body:
				method.toUpperCase() === "GET" || resolvedBody == null
					? undefined
					: String(resolvedBody),
			signal: controller.signal,
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const responseText = await response.text();
		if (!responseText.trim()) {
			throw new Error("Upstream returned an empty response");
		}
		const data =
			sourceType === "rss" || sourceType === "atom"
				? parseFeedXml(responseText)
				: responseText;
		return selectJsonPath(data, source.json_path);
	} finally {
		clearTimeout(timeout);
	}
}

export async function invalidateDataSourceScreens(
	db: DatabaseService,
	dataSourceId: number,
	invalidateRender?: (screenId: number) => void,
) {
	if (!invalidateRender) return;

	const customWidgets = await db.customWidgets.findByDataSourceId(dataSourceId);
	const screenIds = new Set<number>();
	for (const customWidget of customWidgets) {
		const widgets = await db.widgets.findByCustomWidgetId(customWidget.id);
		for (const widget of widgets) screenIds.add(widget.screen_design_id);
	}
	for (const screenId of screenIds) invalidateRender(screenId);
}

export async function fetchAndCacheDataSource(
	db: DatabaseService,
	id: number,
	invalidateRender?: (screenId: number) => void,
	options: { context?: unknown } = {},
) {
	const source = await db.dataSources.findById(id);
	if (!source) throw new Error("Data source not found");

	try {
		const data = await fetchDataSource(source, db, options);
		await db.dataSources.updateCache(id, data, null);
		await invalidateDataSourceScreens(db, id, invalidateRender);
		return { ok: true as const, data, fields: discoverJsonFields(data) };
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e);
		await db.dataSources.updateCache(id, null, error);
		await invalidateDataSourceScreens(db, id, invalidateRender);
		return { ok: false as const, error };
	}
}
