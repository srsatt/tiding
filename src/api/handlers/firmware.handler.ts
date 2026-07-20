import type { DatabaseService } from "../../db";
import type { Firmware } from "../../db/repositories/firmware.repository";
import { jsonResponse, textResponse } from "../http";

function observedTimestamp(value: string | number) {
	if (typeof value === "number") return new Date(value).toISOString();
	const numeric = Number(value);
	if (Number.isFinite(numeric)) return new Date(numeric).toISOString();
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value;
}

function firmwareDto(firmware: Firmware) {
	return {
		id: firmware.id,
		version: firmware.version,
		downloadUrl: firmware.download_url,
		releaseNotes: firmware.release_notes ?? null,
		isStable: firmware.is_stable === true || firmware.is_stable === 1,
		createdAt: observedTimestamp(firmware.created_at),
	};
}

function firmwareNotFound(req: Request) {
	return jsonResponse(
		{
			statusCode: 404,
			timestamp: new Date().toISOString(),
			path: new URL(req.url).pathname,
			method: req.method,
			message: "Firmware not found",
			error: "Not Found",
		},
		{ status: 404 },
	);
}

export async function handleFirmware(req: Request, db: DatabaseService) {
	const path = new URL(req.url).pathname;
	const idMatch = path.match(/^\/api\/firmware\/(\d+)$/);

	if (path === "/api/firmware" && req.method === "GET") {
		const items = (await db.firmware.findAll()).map(firmwareDto);
		return jsonResponse({ data: { items, total: items.length } });
	}

	if (idMatch && req.method === "GET") {
		const firmware = await db.firmware.findById(
			Number.parseInt(idMatch[1], 10),
		);
		if (!firmware) return firmwareNotFound(req);
		return jsonResponse({ data: firmwareDto(firmware) });
	}

	return textResponse("Not Found", 404);
}
