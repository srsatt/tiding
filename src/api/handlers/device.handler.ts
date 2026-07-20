import type { DatabaseService } from "../../db";
import { applyWelcomePlaylistToDevice } from "../../services/welcome-screen";
import { deviceIdHeader } from "../device-request";
import {
	handleError,
	jsonResponse,
	parseBody,
	type RequestBody,
} from "../http";

function timestamp() {
	return new Date().toISOString();
}

function setupHeaderError(req: Request) {
	const path = new URL(req.url).pathname;
	return jsonResponse(
		{
			statusCode: 422,
			timestamp: timestamp(),
			path,
			method: req.method,
			type: "/problem_details#device_setup",
			status: "unprocessable_content",
			detail: "Invalid request headers.",
			instance: path,
			extensions: { errors: { HTTP_ID: ["is missing"] } },
		},
		{ status: 422 },
	);
}

function logNotFound(req: Request) {
	const path = new URL(req.url).pathname;
	return jsonResponse(
		{
			statusCode: 404,
			timestamp: timestamp(),
			path,
			method: req.method,
			message: "Device not found",
			error: "Not Found",
		},
		{ status: 404 },
	);
}

function logValidationError(req: Request, messages: string[]) {
	const path = new URL(req.url).pathname;
	return jsonResponse(
		{
			statusCode: 400,
			timestamp: timestamp(),
			path,
			method: req.method,
			message: messages,
			error: "Bad Request",
		},
		{ status: 400 },
	);
}

function setupImageUrl(req: Request) {
	return new URL("/api/setup-screen.bmp", req.url).toString();
}

function requireSimpleLog(req: Request, body: RequestBody) {
	const messages: string[] = [];
	const level = body.level;
	const message = body.message;

	if (typeof level !== "string") messages.push("level must be a string");
	else if (level.length > 20)
		messages.push("level must be shorter than or equal to 20 characters");

	if (typeof message !== "string") messages.push("message must be a string");
	else if (message.length > 5000)
		messages.push("message must be shorter than or equal to 5000 characters");

	if (messages.length > 0) return logValidationError(req, messages);

	return {
		level: level as string,
		message: message as string,
		metadata: body.metadata ?? null,
	};
}

function publicLogEntries(body: RequestBody) {
	const value = Array.isArray(body.logs_array)
		? body.logs_array
		: Array.isArray(body.logs)
			? body.logs
			: null;
	if (!value) return null;
	const source = Array.isArray(body.logs_array) ? "logs_array" : "logs";
	return value.map((entry, index) => {
		const record =
			typeof entry === "object" && entry !== null
				? (entry as Record<string, unknown>)
				: {};
		return {
			level: "error",
			message:
				typeof record.log_message === "string"
					? record.log_message.slice(0, 5000)
					: typeof record.message === "string"
						? record.message.slice(0, 5000)
						: `TRMNL log ${index + 1}`,
			source,
			metadata: record,
		};
	});
}

export async function handleDeviceLifecycle(req: Request, db: DatabaseService) {
	const path = new URL(req.url).pathname;

	try {
		if (path === "/api/setup" && req.method === "GET") {
			const deviceId = deviceIdHeader(req);
			if (!deviceId) return setupHeaderError(req);
			const existing = await db.devices.findByHttpId(deviceId);
			const device = existing ?? (await db.devices.createSetupDevice(deviceId));
			if (!existing) await applyWelcomePlaylistToDevice(db, device.id);
			const updated = await db.devices.findById(device.id);
			return jsonResponse({
				status: 200,
				api_key: updated?.api_key ?? device.api_key,
				friendly_id:
					updated?.friendly_id ?? device.friendly_id ?? device.mac_address,
				image_url: setupImageUrl(req),
				message: "Welcome to Tiding!",
			});
		}

		if (path === "/api/log" && req.method === "POST") {
			const deviceId = deviceIdHeader(req);
			const device = deviceId ? await db.devices.findByHttpId(deviceId) : null;
			if (!device) return logNotFound(req);

			const body = await parseBody(req);
			const publicEntries = publicLogEntries(body);
			if (publicEntries) {
				for (const entry of publicEntries) {
					await db.devices.log(device.id, entry.level, entry.message, {
						source: entry.source,
						entry: entry.metadata,
					});
				}
			} else {
				const simpleLog = requireSimpleLog(req, body);
				if (simpleLog instanceof Response) return simpleLog;
				await db.devices.log(
					device.id,
					simpleLog.level,
					simpleLog.message,
					simpleLog.metadata,
				);
			}

			return jsonResponse({
				status: "ok",
				message: "Log created successfully",
			});
		}
	} catch (error) {
		return handleError(error);
	}

	return null;
}
