import type { DatabaseService } from "../../db";
import { renderDraftRenderSettingsPreview } from "../../services/render-settings-preview";
import { renderDraftWelcomePreview } from "../../services/welcome-preview";
import {
	regenerateWelcomeScreen,
	resetWelcomeSettings,
} from "../../services/welcome-screen";
import {
	HttpError,
	handleError,
	jsonResponse,
	parseBody,
	redirectResponse,
} from "../http";

const INTEGER_SETTINGS: Record<string, { min: number; max: number }> = {
	data_source_timeout_ms: { min: 250, max: 60000 },
	render_threshold: { min: 0, max: 255 },
};

function isSecretSetting(key: string) {
	return /token|secret|password|key/i.test(key);
}

function redactSetting(setting: { key: string; value: string }) {
	return isSecretSetting(setting.key)
		? { ...setting, value: setting.value ? "******" : "" }
		: setting;
}

export function normalizeSettingValue(key: string, value: string) {
	const integerRule = INTEGER_SETTINGS[key];
	if (!integerRule) return value;

	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed)) {
		throw new HttpError(400, `${key} must be an integer`);
	}
	return String(Math.max(integerRule.min, Math.min(integerRule.max, parsed)));
}

function serverStatus(
	req: Request,
	options?: { port?: number; version?: string },
) {
	const url = new URL(req.url);
	const origin = `${url.protocol}//${url.hostname}${options?.port ? `:${options.port}` : url.port ? `:${url.port}` : ""}`;
	return {
		state: "Online",
		serverIp: url.hostname || "localhost",
		deviceUrl: `${origin}/api/display`,
		lastChecked: new Date().toISOString(),
		port: options?.port ?? Number(url.port || 80),
		version: options?.version ?? "0.1.0",
	};
}

export async function handleSettings(req: Request, db: DatabaseService) {
	const url = new URL(req.url);
	const path = url.pathname;
	const method = req.method;

	try {
		if (path === "/api/settings/server-status" && method === "GET") {
			return jsonResponse({ ok: true, data: serverStatus(req) });
		}

		if (path === "/api/settings/render-preview" && method === "POST") {
			const body = await parseBody(req);
			const image = await renderDraftRenderSettingsPreview(body);
			return new Response(new Uint8Array(image), {
				headers: { "Content-Type": "image/bmp" },
			});
		}

		if (path === "/api/settings" && method === "GET") {
			return jsonResponse((await db.settings.findAll()).map(redactSetting));
		}

		if (path === "/api/settings" && method === "POST") {
			const body = await parseBody(req);
			const entries = Object.entries(body).filter(
				([key, value]) => key !== "_method" && value !== undefined,
			);
			for (const [key, value] of entries) {
				if (key === "github_api_token" && !String(value).trim()) continue;
				await db.settings.set(key, normalizeSettingValue(key, String(value)));
			}
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse("/settings");
			return jsonResponse({ ok: true });
		}

		if (path === "/api/settings/welcome/regenerate" && method === "POST") {
			const body = await parseBody(req);
			for (const [key, value] of Object.entries(body)) {
				if (key === "_method" || value === undefined) continue;
				await db.settings.set(key, normalizeSettingValue(key, String(value)));
			}
			const result = await regenerateWelcomeScreen(db);
			if (req.headers.get("content-type")?.includes("form-urlencoded")) {
				return redirectResponse("/settings");
			}
			return jsonResponse({ ok: true, data: result });
		}

		if (path === "/api/settings/welcome/preview" && method === "POST") {
			const body = await parseBody(req);
			const image = await renderDraftWelcomePreview(db, body);
			return new Response(new Uint8Array(image), {
				headers: { "Content-Type": "image/bmp" },
			});
		}

		if (path === "/api/settings/welcome/reset" && method === "POST") {
			await resetWelcomeSettings(db);
			const result = await regenerateWelcomeScreen(db);
			if (req.headers.get("content-type")?.includes("form-urlencoded")) {
				return redirectResponse("/settings");
			}
			return jsonResponse({ ok: true, data: result });
		}

		if (path === "/api/settings/github-token/test" && method === "POST") {
			const body = await parseBody(req);
			const token = String(
				body.github_api_token ||
					(await db.settings.get("github_api_token")) ||
					"",
			).trim();
			if (!token) throw new HttpError(400, "github_api_token is required");
			const testUrl =
				(await db.settings.get("github_api_test_url")) ||
				"https://api.github.com/rate_limit";
			const response = await fetch(testUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
				},
			});
			if (!response.ok)
				throw new HttpError(502, `GitHub HTTP ${response.status}`);
			return jsonResponse({
				ok: true,
				token: "******",
				rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
			});
		}

		const keyMatch = path.match(/^\/api\/settings\/([^/]+)$/);
		if (keyMatch && method === "GET") {
			const key = decodeURIComponent(keyMatch[1]);
			const value = await db.settings.get(key);
			if (value === null) return new Response("Not Found", { status: 404 });
			return jsonResponse(redactSetting({ key, value }));
		}

		if (keyMatch && (method === "PUT" || method === "PATCH")) {
			const key = decodeURIComponent(keyMatch[1]);
			const body = await parseBody(req);
			const value = body.value ?? "";
			await db.settings.set(key, normalizeSettingValue(key, String(value)));
			return jsonResponse({ key, value: await db.settings.get(key) });
		}
	} catch (e) {
		return handleError(e);
	}

	return new Response("Not Found", { status: 404 });
}
