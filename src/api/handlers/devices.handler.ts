import type { DatabaseService } from "../../db";
import type {
	Device,
	DeviceLog,
	DeviceScreenAssignment,
} from "../../db/repositories/device.repository";
import { applyWelcomePlaylistToDevice } from "../../services/welcome-screen";
import {
	handleError,
	jsonResponse,
	optionalInteger,
	parseBody,
	redirectResponse,
	requireInteger,
	requireText,
	textResponse,
} from "../http";

function isActive(value: unknown) {
	return value === true || value === 1 || value === "1";
}

function redactApiKey(apiKey: string) {
	if (!apiKey) return "";
	if (apiKey.length <= 8) return `${apiKey.slice(0, 2)}...`;
	return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

function deviceDto(device: Device) {
	return {
		id: device.id,
		label: device.label,
		friendlyId: device.friendly_id ?? null,
		macAddress: device.mac_address,
		apiKeyPreview: redactApiKey(device.api_key),
		hasApiKey: Boolean(device.api_key),
		firmwareVersion: device.firmware_version ?? null,
		modelId: device.model_id ?? null,
		playlistId: device.playlist_id ?? null,
		isActive: isActive(device.is_active),
		wifi: device.wifi,
		battery: device.battery,
		refreshRate: device.refresh_rate,
		imageTimeout: device.image_timeout,
		proxy: isActive(device.proxy),
		firmwareUpdate: isActive(device.firmware_update),
		width: device.width,
		height: device.height,
		sleepStartAt: device.sleep_start_at ?? null,
		sleepStopAt: device.sleep_stop_at ?? null,
		lastSeenAt: device.last_seen_at ?? null,
		refreshPending: isActive(device.refresh_pending),
		lastScreenId: device.last_screen_id ?? null,
		screenStartedAt: device.screen_started_at ?? null,
		createdAt: device.created_at ?? null,
		updatedAt: device.updated_at ?? null,
		assignmentsUrl: `/api/devices/${device.id}/assignments`,
		logsUrl: `/api/devices/${device.id}/logs`,
	};
}

function assignmentDto(assignment: DeviceScreenAssignment) {
	return {
		id: assignment.id,
		deviceId: assignment.device_id,
		screenDesignId: assignment.screen_design_id,
		isActive: isActive(assignment.is_active),
		createdAt: assignment.created_at,
	};
}

function logDto(log: DeviceLog) {
	return {
		id: log.id,
		deviceId: log.device_id,
		level: log.level,
		message: log.message,
		metadata: log.metadata ?? null,
		createdAt: log.created_at,
	};
}

export async function handleDevices(req: Request, db: DatabaseService) {
	const url = new URL(req.url);
	const path = url.pathname;
	const idMatch = path.match(
		/^\/api\/devices\/(\d+)(?:\/(logs|assignments|playlist))?$/,
	);
	const deviceId = idMatch ? Number.parseInt(idMatch[1], 10) : null;
	const childRoute = idMatch?.[2] ?? null;

	try {
		if (path === "/api/devices" && req.method === "GET") {
			const items = (await db.devices.findAll()).map(deviceDto);
			return jsonResponse({ data: { items, total: items.length } });
		}

		if (path === "/api/devices" && req.method === "POST") {
			const body = await parseBody(req);
			const playlistId =
				body.playlist_id === "" || body.playlist_id === undefined
					? null
					: requireInteger(body.playlist_id, "playlist_id");
			if (playlistId !== null && !(await db.playlists.findById(playlistId))) {
				return textResponse("Playlist Not Found", 404);
			}
			const id = await db.devices.createManualDevice({
				label: requireText(body.label, "label"),
				macAddress: requireText(body.mac_address, "mac_address"),
				playlistId,
				width: optionalInteger(body.width, "width") ?? 800,
				height: optionalInteger(body.height, "height") ?? 480,
			});
			if (playlistId === null) await applyWelcomePlaylistToDevice(db, id);
			if (req.headers.get("content-type")?.includes("form-urlencoded")) {
				return redirectResponse(`/devices/${id}`);
			}
			return jsonResponse({ id }, { status: 201 });
		}

		if (deviceId && childRoute === "assignments" && req.method === "GET") {
			const device = await db.devices.findById(deviceId);
			if (!device) return textResponse("Not Found", 404);
			const items = (await db.devices.findScreenAssignments(deviceId)).map(
				assignmentDto,
			);
			return jsonResponse({ data: { items, total: items.length } });
		}

		if (deviceId && childRoute === "logs" && req.method === "GET") {
			const device = await db.devices.findById(deviceId);
			if (!device) return textResponse("Not Found", 404);
			const limitParam = Number(url.searchParams.get("limit") || 50);
			const items = (await db.devices.findLogs(deviceId, limitParam)).map(
				logDto,
			);
			return jsonResponse({ data: { items, total: items.length } });
		}

		if (deviceId && childRoute === "playlist" && req.method === "POST") {
			const device = await db.devices.findById(deviceId);
			if (!device) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			const playlistId =
				body.playlist_id === "" || body.playlist_id === undefined
					? null
					: requireInteger(body.playlist_id, "playlist_id");
			if (playlistId !== null && !(await db.playlists.findById(playlistId))) {
				return textResponse("Playlist Not Found", 404);
			}
			await db.devices.updatePlaylist(deviceId, playlistId);
			if (req.headers.get("accept")?.includes("application/json")) {
				const updated = await db.devices.findById(deviceId);
				if (!updated) return textResponse("Not Found", 404);
				return jsonResponse({ data: deviceDto(updated) });
			}
			return redirectResponse(`/devices/${deviceId}`);
		}

		if (deviceId && !childRoute && req.method === "GET") {
			const device = await db.devices.findById(deviceId);
			if (!device) return textResponse("Not Found", 404);
			return jsonResponse({ data: deviceDto(device) });
		}

		if (deviceId && !childRoute && req.method === "POST") {
			const device = await db.devices.findById(deviceId);
			if (!device) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			if (body._method === "PATCH") {
				await db.devices.updateLabel(
					deviceId,
					requireText(body.label, "label"),
				);
				if (req.headers.get("accept")?.includes("application/json")) {
					const updated = await db.devices.findById(deviceId);
					if (!updated) return textResponse("Not Found", 404);
					return jsonResponse({ data: deviceDto(updated) });
				}
				return redirectResponse(`/devices/${deviceId}`);
			}
			if (body._method === "DELETE") {
				await db.devices.delete(deviceId);
				return redirectResponse("/devices");
			}
		}
	} catch (error) {
		return handleError(error);
	}

	return textResponse("Not Found", 404);
}
