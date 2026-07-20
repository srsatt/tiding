import * as fs from "node:fs";
import * as nodePath from "node:path";
import { t } from "ttag";
import type { DataSource } from "../db/repositories/data-source.repository";
import type { Setting } from "../db/repositories/settings.repository";
import { configuredTimeZone } from "../shared/time-zone";

export { customWidgetIdFromConfig } from "../shared/widget-config";

export function jsonPreview(value: unknown) {
	if (value === null || value === undefined || value === "") return t`No data`;
	const text = typeof value === "string" ? value : JSON.stringify(value);
	return text.length > 1600 ? `${text.slice(0, 1600)}...` : text;
}

export function requestBodyValue(source: DataSource) {
	const value = source.body ?? source.request_body ?? source.payload;
	if (value === null || value === undefined) return "";
	return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

export function enabledLabel(value: unknown) {
	return value === true || value === 1 || value === "1" ? t`yes` : t`no`;
}

export function formatTimestamp(value: unknown) {
	if (value === null || value === undefined || value === "") return t`Never`;
	const text = String(value);
	const epochMilliseconds = /^\d{10,}$/.test(text) ? Number(text) : null;
	const date = new Date(epochMilliseconds ?? text);
	if (Number.isNaN(date.getTime())) return text;
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
		hour12: false,
		timeZone: configuredTimeZone(),
	}).format(date);
}

export function apiKeyPreview(apiKey: string) {
	if (!apiKey) return "";
	if (apiKey.length <= 8) return `${apiKey.slice(0, 2)}...`;
	return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export function cacheExists(cachePath: string, screenId: number) {
	return fs.existsSync(nodePath.join(cachePath, `screen-${screenId}.bmp`));
}

export function settingValue(
	settings: Setting[],
	key: string,
	fallback: string,
) {
	return settings.find((setting) => setting.key === key)?.value ?? fallback;
}
