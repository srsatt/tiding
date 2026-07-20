import { t } from "ttag";
import type { DatabaseService } from "../../db";
import {
	deviceFilters,
	filterDevices,
} from "../features/devices/device-inventory";
import {
	DeviceInventoryPage,
	NewDevicePage,
} from "../features/devices/device-pages";
import type { AdminPageOptions } from "../types";
import { Page } from "../ui";

export async function renderDevicesPage(
	db: DatabaseService,
	params?: URLSearchParams,
) {
	const [devices, latestFirmware] = await Promise.all([
		db.devices.findAll(),
		db.devices.findLatestStableFirmware(),
	]);
	const filters = deviceFilters(params);
	const visibleDevices = filterDevices(devices, filters, latestFirmware);
	return Page({
		title: t`Devices`,
		children: (
			<DeviceInventoryPage
				devices={devices}
				filters={filters}
				latestFirmware={latestFirmware}
				visibleDevices={visibleDevices}
			/>
		),
	});
}

export async function renderNewDevicePage(
	db: DatabaseService,
	options: AdminPageOptions,
) {
	const playlists = await db.playlists.findAll();
	const serverUrl = `http://localhost:${options.port}`;
	return Page({
		title: t`Add Device`,
		children: <NewDevicePage playlists={playlists} serverUrl={serverUrl} />,
	});
}
