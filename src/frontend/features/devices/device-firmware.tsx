import { t } from "ttag";
import type {
	Device,
	FirmwareArtifact,
} from "../../../db/repositories/device.repository";

function updateSettingLabel(value: unknown) {
	return value === true || value === 1 || value === "1"
		? t`Enabled`
		: t`Disabled`;
}

export function firmwareStatusLabel(
	device: Device,
	latestFirmware: FirmwareArtifact | null,
) {
	if (!device.firmware_update) return t`updates disabled`;
	if (!latestFirmware) return t`no stable firmware`;
	if (device.firmware_version === latestFirmware.version) return t`current`;
	return t`update available`;
}

export function DeviceFirmwarePanel({
	device,
	latestFirmware,
}: {
	device: Device;
	latestFirmware: FirmwareArtifact | null;
}) {
	return (
		<section className={"panel"}>
			<h2>{t`Firmware`}</h2>
			<dl className={"facts"}>
				<dt>{t`Current version`}</dt>
				<dd>{device.firmware_version || t`unknown`}</dd>
				<dt>{t`Automatic updates`}</dt>
				<dd>{updateSettingLabel(device.firmware_update)}</dd>
				<dt>{t`Update state`}</dt>
				<dd>{firmwareStatusLabel(device, latestFirmware)}</dd>
				<dt>{t`Latest stable`}</dt>
				<dd>{latestFirmware?.version ?? t`none`}</dd>
				<dt>{t`Firmware URL`}</dt>
				<dd>
					{latestFirmware ? (
						<code>{latestFirmware.download_url}</code>
					) : (
						t`none`
					)}
				</dd>
			</dl>
		</section>
	);
}
