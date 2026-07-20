import { t } from "ttag";
import type { Playlist } from "../../../db/repositories/playlist.repository";
import { QrCodeSvg } from "../../../shared/qr-code";
import {
	NumberField,
	SelectControl,
	TextField,
} from "../../design-system/native-controls";
import { Button, ButtonLink } from "../../ui";

export function NewDeviceForm({ playlists }: { playlists: Playlist[] }) {
	return (
		<form action="/api/devices" method="POST" className={"formGrid"}>
			<TextField label={t`Device Name`} name="label" required />
			<TextField label={t`MAC Address`} name="mac_address" required />
			<NumberField label={t`Width`} name="width" value="800" min="1" />
			<NumberField label={t`Height`} name="height" value="480" min="1" />
			<label className={"wide"} htmlFor="device-playlist">
				{t`Playlist`}
				<SelectControl id="device-playlist" name="playlist_id">
					<option value="">{t`No playlist`}</option>
					{playlists.map((playlist) => (
						<option key={playlist.id} value={playlist.id}>
							{playlist.name}
						</option>
					))}
				</SelectControl>
			</label>
			<div className={"formActions"}>
				<Button type="submit">{t`Register Device`}</Button>
				<ButtonLink href="/devices" variant="secondary">
					{t`Cancel`}
				</ButtonLink>
			</div>
		</form>
	);
}

export function DeviceSetupGuide({ serverUrl }: { serverUrl: string }) {
	const setupImageUrl = `${serverUrl}/api/setup-screen.bmp`;
	return (
		<section className={"panel"}>
			<h2>{t`TRMNL Wi-Fi Setup`}</h2>
			<ol>
				<li>{t`Power on the device.`}</li>
				<li>{t`Connect to the TRMNL Wi-Fi setup network.`}</li>
				<li>{t`Open the captive portal and enter Wi-Fi credentials.`}</li>
				<li>{t`Set API Server URL to the value below.`}</li>
				<li>{t`Wait for registration, then assign the device to a playlist.`}</li>
			</ol>
			<dl className={"facts"}>
				<dt>{t`Server URL`}</dt>
				<dd>
					<code data-copy-source="device-server-url">{serverUrl}</code>{" "}
					<Button
						type="button"
						tone="secondary"
						size="sm"
						data-copy-target="device-server-url"
					>
						{t`Copy`}
					</Button>
				</dd>
				<dt>{t`Setup QR`}</dt>
				<dd>
					<div className={"setupQr"}>
						<QrCodeSvg value={serverUrl} label={t`Device server URL QR code`} />
					</div>
				</dd>
				<dt>{t`Setup image`}</dt>
				<dd>
					<code data-copy-source="device-setup-image-url">{setupImageUrl}</code>{" "}
					<Button
						type="button"
						tone="secondary"
						size="sm"
						data-copy-target="device-setup-image-url"
					>
						{t`Copy`}
					</Button>
				</dd>
			</dl>
		</section>
	);
}
