import type { DatabaseService } from "../db";
import type { FrameworkRenderContext } from "../rendering/composer/framework-widgets";
import { selectedScreenForDevice } from "./device-screen-selection";

type RenderScreen = (
	screenId: number,
	context: FrameworkRenderContext,
	cacheVariant: string,
) => Promise<Buffer>;

export async function renderDeviceCurrentScreenPreview(
	db: DatabaseService,
	deviceId: number,
	renderScreen: RenderScreen,
	now = new Date(),
) {
	const device = await db.devices.findById(deviceId);
	if (!device) return null;
	const selection = await selectedScreenForDevice(db, device, now.getTime());
	if (!selection.screen) return null;
	return renderScreen(
		selection.screen.id,
		{
			now,
			device: {
				id: device.id,
				label: device.label,
				battery: device.battery,
				wifi: device.wifi,
				firmwareVersion: device.firmware_version ?? null,
			},
		},
		`device-${device.id}`,
	);
}
