import type {
	Device,
	FirmwareArtifact,
} from "../../../db/repositories/device.repository";

export type DeviceStatusFilter =
	| "all"
	| "active"
	| "inactive"
	| "update"
	| "updates-disabled";

export type DeviceFilters = {
	query: string;
	status: DeviceStatusFilter;
	view: "grid" | "list";
};

const statusValues = new Set<DeviceStatusFilter>([
	"all",
	"active",
	"inactive",
	"update",
	"updates-disabled",
]);

export function deviceFilters(params?: URLSearchParams): DeviceFilters {
	const status = String(params?.get("status") || "all") as DeviceStatusFilter;
	const view = params?.get("view") === "list" ? "list" : "grid";
	return {
		query: String(params?.get("q") || "").trim(),
		status: statusValues.has(status) ? status : "all",
		view,
	};
}

function searchableText(device: Device) {
	return [
		device.label,
		device.friendly_id,
		device.mac_address,
		device.firmware_version,
		device.model_id,
		device.playlist_id,
	]
		.filter((value) => value !== null && value !== undefined)
		.join(" ")
		.toLowerCase();
}

function matchesStatus(
	device: Device,
	status: DeviceStatusFilter,
	latestFirmware: FirmwareArtifact | null,
) {
	if (status === "active") return Boolean(device.is_active);
	if (status === "inactive") return !device.is_active;
	if (status === "updates-disabled") return !device.firmware_update;
	if (status === "update") {
		return Boolean(
			device.firmware_update &&
				latestFirmware &&
				device.firmware_version !== latestFirmware.version,
		);
	}
	return true;
}

export function filterDevices(
	devices: Device[],
	filters: DeviceFilters,
	latestFirmware: FirmwareArtifact | null,
) {
	const query = filters.query.toLowerCase();
	return devices.filter(
		(device) =>
			(!query || searchableText(device).includes(query)) &&
			matchesStatus(device, filters.status, latestFirmware),
	);
}
