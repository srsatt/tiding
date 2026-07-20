import type { DatabaseService } from "../../db";
import type { Device } from "../../db/repositories/device.repository";
import type { CurrentPlaylistScreen } from "../../db/repositories/playlist.repository";
import { selectedScreenForDevice } from "../../services/device-screen-selection";
import { deviceIdHeader } from "../device-request";
import { jsonResponse } from "../http";

function removedDeviceResponse() {
	return jsonResponse({
		status: 0,
		image_url: "",
		filename: "",
		image_url_timeout: 0,
		firmware_url: "",
		update_firmware: false,
		refresh_rate: 0,
		reset_firmware: true,
		special_function: "",
		temperature_profile: "default",
		maximum_compatibility: false,
		message: "Device removed from server",
	});
}

function missingDeviceIdResponse(req: Request) {
	return jsonResponse(
		{
			statusCode: 422,
			timestamp: new Date().toISOString(),
			path: new URL(req.url).pathname,
			method: req.method,
			type: "/problem_details#device_id",
			status: "unprocessable_content",
			detail: "Invalid device ID.",
			instance: "/api/display",
			extensions: { errors: { HTTP_ID: ["is missing"] } },
		},
		{ status: 422 },
	);
}

function numericHeader(req: Request, names: string[]) {
	for (const name of names) {
		const value = req.headers.get(name);
		if (!value) continue;
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return undefined;
}

function stringHeader(req: Request, names: string[]) {
	for (const name of names) {
		const value = req.headers.get(name);
		if (value?.trim()) return value.trim();
	}
	return undefined;
}

function voltageToPercentage(voltage: number) {
	const minVoltage = 3;
	const maxVoltage = 4.2;
	if (voltage >= maxVoltage) return 100;
	if (voltage <= minVoltage) return 0;
	return Math.round(((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100);
}

function deviceTelemetry(req: Request) {
	const battery = numericHeader(req, ["battery", "Battery", "BATTERY"]);
	const batteryVoltage = numericHeader(req, [
		"battery-voltage",
		"battery_voltage",
		"batteryvoltage",
	]);
	return {
		battery:
			battery ??
			(batteryVoltage === undefined
				? undefined
				: voltageToPercentage(batteryVoltage)),
		wifi: numericHeader(req, [
			"wifi",
			"Wifi",
			"WIFI",
			"rssi",
			"RSSI",
			"wifi_signal",
		]),
		firmwareVersion: stringHeader(req, [
			"fw-version",
			"http-fw-version",
			"HTTP_FW_VERSION",
			"firmware-version",
			"Firmware-Version",
			"FW_VERSION",
			"firmware_version",
		]),
		deviceName: stringHeader(req, ["device-name", "Device-Name", "NAME"]),
	};
}

function isTruthy(value: unknown) {
	return value === true || value === 1 || value === "1";
}

function displayFilename(
	imageUrl: string,
	screenId: number,
	renderedAt: number,
) {
	try {
		const parsed = new URL(imageUrl);
		const basename = parsed.pathname.split("/").pop();
		if (!basename) return `design-${screenId}-${renderedAt}.bmp`;
		const revision = parsed.searchParams.get("v")?.replace(/[^a-z0-9_-]/gi, "");
		if (!revision) return basename;
		const extension = basename.lastIndexOf(".");
		return extension > 0
			? `${basename.slice(0, extension)}-${revision}${basename.slice(extension)}`
			: `${basename}-${revision}`;
	} catch {
		const basename = imageUrl.split("?")[0].split("/").pop();
		return basename || `design-${screenId}-${renderedAt}.bmp`;
	}
}

function imageUrlForRequest(req: Request, relativeOrAbsolute: string) {
	if (!relativeOrAbsolute) return "";
	return new URL(relativeOrAbsolute, req.url).toString();
}

function firmwareUrlForRequest(req: Request, relativeOrAbsolute: string) {
	return imageUrlForRequest(req, relativeOrAbsolute);
}

function imageUrlWithDeviceMetadata(
	req: Request,
	relativeOrAbsolute: string,
	params: {
		renderedAt: number;
		battery: number;
		wifi: number;
		deviceName: string;
		firmwareVersion?: string | null;
		macAddress: string;
	},
) {
	const imageUrl = imageUrlForRequest(req, relativeOrAbsolute);
	if (!imageUrl) return "";
	const parsed = new URL(imageUrl);
	parsed.searchParams.set("t", String(params.renderedAt));
	parsed.searchParams.set("battery", String(params.battery));
	parsed.searchParams.set("wifi", String(params.wifi));
	parsed.searchParams.set("deviceName", params.deviceName);
	if (params.firmwareVersion) {
		parsed.searchParams.set("firmwareVersion", params.firmwareVersion);
	}
	parsed.searchParams.set("macAddress", params.macAddress);
	parsed.searchParams.set("format", "bmp");
	return parsed.toString();
}

function refreshAt(refreshRate: number) {
	if (!refreshRate) return undefined;
	return Date.now() + refreshRate * 1000;
}

function screenChanged(device: Device, screenId: number) {
	const lastScreenId = device.last_screen_id;
	return lastScreenId !== String(screenId);
}

function shouldUseFullRefresh(device: Device, screenId: number) {
	return isTruthy(device.refresh_pending) || screenChanged(device, screenId);
}

function firmwareVersionParts(version: string) {
	const match = version.trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/i);
	if (!match) return null;
	return [match[1], match[2] ?? "0", match[3] ?? "0"].map((part) =>
		Number.parseInt(part, 10),
	);
}

function isNewerFirmwareVersion(candidate: string, current?: string | null) {
	const candidateParts = firmwareVersionParts(candidate);
	if (!candidateParts) return false;
	if (!current) return true;
	const currentParts = firmwareVersionParts(current);
	if (!currentParts) return true;
	for (let index = 0; index < candidateParts.length; index += 1) {
		if (candidateParts[index] > currentParts[index]) return true;
		if (candidateParts[index] < currentParts[index]) return false;
	}
	return false;
}

async function firmwareUpdateForDevice(
	req: Request,
	db: DatabaseService,
	device: Device,
	reportedFirmwareVersion?: string | null,
) {
	if (!isTruthy(device.firmware_update)) {
		return { update: false, url: "" };
	}

	const firmware = await db.devices.findLatestStableFirmware();
	if (!firmware) return { update: false, url: "" };
	if (!isNewerFirmwareVersion(firmware.version, reportedFirmwareVersion)) {
		return { update: false, url: "" };
	}
	return {
		update: true,
		url: firmwareUrlForRequest(req, firmware.download_url),
	};
}

export async function handleDisplay(
	req: Request,
	db: DatabaseService,
	imageUrlForScreen:
		| ((
				screenId: number,
				context: {
					now: Date;
					device: {
						id: number;
						label: string;
						battery: number;
						wifi: number;
						firmwareVersion: string | null;
					};
				},
		  ) => string | Promise<string>)
		| null = null,
) {
	try {
		const deviceId = deviceIdHeader(req);
		if (!deviceId) {
			return missingDeviceIdResponse(req);
		}

		const device = await db.devices.findByHttpId(deviceId);
		if (await db.devices.isBlocked(deviceId, device?.mac_address))
			return removedDeviceResponse();
		if (!device?.is_active) return removedDeviceResponse();

		const telemetry = deviceTelemetry(req);
		await db.devices.markSeen(device.id);
		await db.devices.updateTelemetry(device.id, telemetry);

		const selection = await selectedScreenForDevice(db, device);
		const screen = selection.screen;
		const renderedAt = Date.now();
		const responseBattery = telemetry.battery ?? device.battery;
		const responseWifi = telemetry.wifi ?? device.wifi;
		const responseFirmwareVersion =
			telemetry.firmwareVersion ?? device.firmware_version;
		const responseDeviceName =
			telemetry.deviceName ?? device.label ?? device.friendly_id ?? deviceId;
		const relativeImageUrl =
			screen && imageUrlForScreen
				? await imageUrlForScreen(screen.id, {
						now: new Date(renderedAt),
						device: {
							id: device.id,
							label: responseDeviceName,
							battery: responseBattery,
							wifi: responseWifi,
							firmwareVersion: responseFirmwareVersion ?? null,
						},
					})
				: "";
		const imageUrl = screen
			? imageUrlWithDeviceMetadata(req, relativeImageUrl, {
					renderedAt,
					battery: responseBattery,
					wifi: responseWifi,
					deviceName: responseDeviceName,
					firmwareVersion: responseFirmwareVersion,
					macAddress: device.mac_address,
				})
			: "";
		const playlistSelection =
			selection.playlist as CurrentPlaylistScreen | null;
		const effectiveRefreshRate = screen
			? (playlistSelection?.remainingSeconds ?? device.refresh_rate)
			: 0;
		const maximumCompatibility = screen
			? shouldUseFullRefresh(device, screen.id)
			: false;
		const firmwareUpdate = await firmwareUpdateForDevice(
			req,
			db,
			device,
			responseFirmwareVersion,
		);

		if (screen) {
			await db.devices.updateDisplayState(device.id, {
				screenId: screen.id,
				clearRefreshPending: true,
				updateScreenStartedAt: screenChanged(device, screen.id),
			});
		}
		await db.devices.log(device.id, "info", "display_request", {
			screenId: screen?.id ?? null,
			source: selection.source,
			playlistId: device.playlist_id ?? null,
			playlistItemId: playlistSelection?.item.id ?? null,
			imageUrl,
			battery: responseBattery,
			wifi: responseWifi,
			firmwareVersion: responseFirmwareVersion,
			firmwareUpdate,
			maximumCompatibility,
		});

		return jsonResponse({
			status: 0,
			image_url: imageUrl,
			filename: screen ? displayFilename(imageUrl, screen.id, renderedAt) : "",
			image_url_timeout: device.image_timeout ?? 0,
			firmware_url: firmwareUpdate.url,
			update_firmware: firmwareUpdate.update,
			refresh_rate: effectiveRefreshRate,
			reset_firmware: false,
			special_function: "",
			temperature_profile: "default",
			maximum_compatibility: maximumCompatibility,
			refresh_at: refreshAt(effectiveRefreshRate),
			battery: responseBattery,
			wifi: responseWifi,
			message: screen ? undefined : "No screen available",
			screen_id: screen?.id ?? null,
			width: screen?.width ?? device.width ?? null,
			height: screen?.height ?? device.height ?? null,
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: e }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
