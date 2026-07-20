import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { selectedScreenForDevice } from "../../services/device-screen-selection";
import { DeviceDetailPage } from "../features/devices/device-detail-page";
import { Page } from "../ui";

export async function renderDeviceDetailPage(
	db: DatabaseService,
	deviceId: number,
) {
	const device = await db.devices.findById(deviceId);
	if (!device) return null;
	const [assignments, logs, playlists, latestFirmware, currentScreen] =
		await Promise.all([
			db.devices.findScreenAssignments(deviceId),
			db.devices.findLogs(deviceId, 20),
			db.playlists.findAll(),
			db.devices.findLatestStableFirmware(),
			selectedScreenForDevice(db, device),
		]);
	return Page({
		title: t`Device ${device.label}`,
		children: (
			<DeviceDetailPage
				assignments={assignments}
				currentScreen={currentScreen}
				device={device}
				latestFirmware={latestFirmware}
				logs={logs}
				playlists={playlists}
			/>
		),
	});
}
