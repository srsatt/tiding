import { t } from "ttag";
import type {
	Device,
	FirmwareArtifact,
} from "../../../db/repositories/device.repository";
import { formatTimestamp } from "../../format";
import { cx } from "../../ui";
import { firmwareStatusLabel } from "./device-firmware";

export function DeviceGrid({
	devices,
	latestFirmware,
}: {
	devices: Device[];
	latestFirmware: FirmwareArtifact | null;
}) {
	if (devices.length === 0) {
		return <p className={"mutedText"}>{t`No matching devices.`}</p>;
	}
	return (
		<div className={"deviceGrid"} data-device-grid>
			{devices.map((device) => (
				<a
					className={"deviceCard"}
					href={`/devices/${device.id}`}
					key={device.id}
				>
					<header>
						<strong>{device.label}</strong>
						<span className={cx("status", device.is_active ? "ok" : "muted")}>
							{device.is_active ? t`active` : t`inactive`}
						</span>
					</header>
					<dl>
						<dt>{t`Friendly ID`}</dt>
						<dd>{device.friendly_id || t`none`}</dd>
						<dt>{t`Firmware`}</dt>
						<dd>{device.firmware_version || t`unknown`}</dd>
						<dt>{t`Update`}</dt>
						<dd>{firmwareStatusLabel(device, latestFirmware)}</dd>
						<dt>{t`Battery`}</dt>
						<dd>{device.battery}%</dd>
						<dt>{t`Wi-Fi`}</dt>
						<dd>{device.wifi}</dd>
						<dt>{t`Playlist`}</dt>
						<dd>{device.playlist_id ?? t`none`}</dd>
						<dt>{t`Last seen`}</dt>
						<dd>{formatTimestamp(device.last_seen_at)}</dd>
					</dl>
				</a>
			))}
		</div>
	);
}
