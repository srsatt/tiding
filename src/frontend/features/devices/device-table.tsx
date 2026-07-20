import { t } from "ttag";
import type {
	Device,
	FirmwareArtifact,
} from "../../../db/repositories/device.repository";
import { formatTimestamp } from "../../format";
import { cx, EmptyRow } from "../../ui";
import { firmwareStatusLabel } from "./device-firmware";

export function DeviceTable({
	devices,
	latestFirmware,
}: {
	devices: Device[];
	latestFirmware: FirmwareArtifact | null;
}) {
	return (
		<table>
			<thead>
				<tr>
					<th>{t`Label`}</th>
					<th>{t`Friendly ID`}</th>
					<th>{t`MAC address`}</th>
					<th>{t`Status`}</th>
					<th>{t`Firmware`}</th>
					<th>{t`Update`}</th>
					<th>{t`Playlist`}</th>
					<th>{t`Last seen`}</th>
				</tr>
			</thead>
			<tbody>
				{devices.length === 0 ? (
					<EmptyRow colSpan={8}>{t`No matching devices.`}</EmptyRow>
				) : (
					devices.map((device) => (
						<tr key={device.id}>
							<td>
								<a href={`/devices/${device.id}`}>{device.label}</a>
							</td>
							<td>{device.friendly_id || t`none`}</td>
							<td>
								<code>{device.mac_address}</code>
							</td>
							<td>
								<span
									className={cx("status", device.is_active ? "ok" : "muted")}
								>
									{device.is_active ? t`active` : t`inactive`}
								</span>
							</td>
							<td>{device.firmware_version || t`unknown`}</td>
							<td>{firmwareStatusLabel(device, latestFirmware)}</td>
							<td>{device.playlist_id ?? t`none`}</td>
							<td>{formatTimestamp(device.last_seen_at)}</td>
						</tr>
					))
				)}
			</tbody>
		</table>
	);
}
