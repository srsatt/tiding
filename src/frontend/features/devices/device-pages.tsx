import { t } from "ttag";
import type {
	Device,
	FirmwareArtifact,
} from "../../../db/repositories/device.repository";
import type { Playlist } from "../../../db/repositories/playlist.repository";
import { ButtonLink } from "../../ui";
import { DeviceSetupGuide, NewDeviceForm } from "./device-form";
import { DeviceGrid } from "./device-grid";
import type { DeviceFilters } from "./device-inventory";
import { DeviceInventoryFilters } from "./device-inventory-filters";
import { DeviceTable } from "./device-table";

export function DeviceInventoryPage({
	devices,
	filters,
	latestFirmware,
	visibleDevices,
}: {
	devices: Device[];
	filters: DeviceFilters;
	latestFirmware: FirmwareArtifact | null;
	visibleDevices: Device[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Devices`}</h1>
					<p>{t`Inspect TRMNL device state, display linkage, and telemetry.`}</p>
				</div>
				<ButtonLink href="/devices/new">{t`Add Device`}</ButtonLink>
			</header>
			<section className={"panel"}>
				<DeviceInventoryFilters
					filters={filters}
					total={devices.length}
					shown={visibleDevices.length}
				/>
			</section>
			<section className={"panel"}>
				{filters.view === "grid" ? (
					<DeviceGrid
						devices={visibleDevices}
						latestFirmware={latestFirmware}
					/>
				) : (
					<DeviceTable
						devices={visibleDevices}
						latestFirmware={latestFirmware}
					/>
				)}
			</section>
		</>
	);
}

export function NewDevicePage({
	playlists,
	serverUrl,
}: {
	playlists: Playlist[];
	serverUrl: string;
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{t`Add Device`}</h1>
			</header>
			<DeviceSetupGuide serverUrl={serverUrl} />
			<section className={"panel"}>
				<h2>{t`Alternative Connection`}</h2>
				<NewDeviceForm playlists={playlists} />
			</section>
		</>
	);
}
