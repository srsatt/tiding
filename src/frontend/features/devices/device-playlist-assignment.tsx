import { t } from "ttag";
import type { Device } from "../../../db/repositories/device.repository";
import type { Playlist } from "../../../db/repositories/playlist.repository";
import { SelectControl } from "../../design-system/native-controls";
import { Button } from "../../ui";

export function DevicePlaylistAssignment({
	device,
	playlists,
}: {
	device: Device;
	playlists: Playlist[];
}) {
	return (
		<form
			action={`/api/devices/${device.id}/playlist`}
			method="POST"
			className={"formGrid"}
		>
			<label htmlFor={`device-playlist-${device.id}`}>
				{t`Playlist`}
				<SelectControl id={`device-playlist-${device.id}`} name="playlist_id">
					<option value="">{t`No playlist`}</option>
					{playlists.map((playlist) => (
						<option
							key={playlist.id}
							value={playlist.id}
							selected={playlist.id === device.playlist_id}
						>
							{playlist.name}
						</option>
					))}
				</SelectControl>
			</label>
			<div className={"formActions"}>
				<Button type="submit">{t`Assign Playlist`}</Button>
			</div>
		</form>
	);
}

export function ConnectedDeviceRows({ devices }: { devices: Device[] }) {
	if (devices.length === 0) {
		return (
			<tr>
				<td colSpan={3}>{t`No connected devices.`}</td>
			</tr>
		);
	}
	return (
		<>
			{devices.map((device) => (
				<tr key={device.id}>
					<td>
						<a href={`/devices/${device.id}`}>{device.label}</a>
					</td>
					<td>{device.friendly_id || t`none`}</td>
					<td>{device.is_active ? t`active` : t`inactive`}</td>
				</tr>
			))}
		</>
	);
}

export function ConnectedDevicesPanel({ devices }: { devices: Device[] }) {
	return (
		<section className={"panel"}>
			<h2>{t`Connected Devices`}</h2>
			<table>
				<tbody>
					<ConnectedDeviceRows devices={devices} />
				</tbody>
			</table>
		</section>
	);
}
