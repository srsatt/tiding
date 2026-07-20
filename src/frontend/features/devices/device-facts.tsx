import { t } from "ttag";
import type { Device } from "../../../db/repositories/device.repository";
import { apiKeyPreview, enabledLabel, formatTimestamp } from "../../format";

function statusLabel(value: unknown) {
	return value === true || value === 1 || value === "1"
		? t`Enabled`
		: t`Disabled`;
}

function activeLabel(value: unknown) {
	return value === true || value === 1 || value === "1"
		? t`Active`
		: t`Inactive`;
}

function secondsLabel(value: unknown) {
	const seconds = Number(value);
	if (!Number.isFinite(seconds)) return String(value ?? t`unknown`);
	if (seconds > 0 && seconds % 60 === 0) {
		return `${seconds / 60} min (${seconds} s)`;
	}
	return `${seconds} s`;
}

export function DeviceFacts({ device }: { device: Device }) {
	return (
		<dl className={"facts"}>
			<dt>{t`Friendly ID`}</dt>
			<dd>{device.friendly_id || t`none`}</dd>
			<dt>{t`MAC address`}</dt>
			<dd>
				<code>{device.mac_address}</code>
			</dd>
			<dt>{t`API key`}</dt>
			<dd>
				<code>{apiKeyPreview(device.api_key)}</code>
			</dd>
			<dt>{t`Firmware`}</dt>
			<dd>{device.firmware_version || t`unknown`}</dd>
			<dt>{t`Firmware updates`}</dt>
			<dd>{statusLabel(device.firmware_update)}</dd>
			<dt>{t`Model ID`}</dt>
			<dd>{device.model_id ?? t`unknown`}</dd>
			<dt>{t`Playlist ID`}</dt>
			<dd>{device.playlist_id ?? t`none`}</dd>
			<dt>{t`Status`}</dt>
			<dd>{activeLabel(device.is_active)}</dd>
			<dt>{t`Battery`}</dt>
			<dd>{device.battery}%</dd>
			<dt>Wi-Fi</dt>
			<dd>{device.wifi} dBm</dd>
			<dt>{t`Refresh rate`}</dt>
			<dd>{secondsLabel(device.refresh_rate)}</dd>
			<dt>{t`Image URL timeout`}</dt>
			<dd>{secondsLabel(device.image_timeout)}</dd>
			<dt>{t`Size`}</dt>
			<dd>
				{device.width}x{device.height}
			</dd>
			<dt>{t`Refresh pending`}</dt>
			<dd>{enabledLabel(device.refresh_pending)}</dd>
			<dt>{t`Last screen ID`}</dt>
			<dd>{device.last_screen_id || t`none`}</dd>
			<dt>{t`Last seen`}</dt>
			<dd>{formatTimestamp(device.last_seen_at)}</dd>
		</dl>
	);
}
