import { t } from "ttag";
import type { Device } from "../../../db/repositories/device.repository";
import type { Playlist } from "../../../db/repositories/playlist.repository";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import { ButtonLink } from "../../ui";
import { DashboardRecentLists } from "./dashboard-recent-lists";

export function DashboardOverview({
	devices,
	playlists,
	screens,
}: {
	devices: Device[];
	playlists: Playlist[];
	screens: ScreenDesign[];
}) {
	const onlineDevices = devices.filter((device) => device.is_active).length;
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Dashboard`}</h1>
					<p>{t`Manage devices, screens, playlists, and dynamic content.`}</p>
				</div>
				<div className={"actions"}>
					<ButtonLink href="/devices/new">{t`Add Device`}</ButtonLink>
					<ButtonLink href="/screens/new" variant="secondary">
						{t`Create Screen`}
					</ButtonLink>
					<ButtonLink href="/playlists/new" variant="secondary">
						{t`Create Playlist`}
					</ButtonLink>
				</div>
			</header>
			<DashboardStats
				devices={devices}
				onlineDevices={onlineDevices}
				playlists={playlists}
				screens={screens}
			/>
			<SystemStatusPanel />
			<DashboardRecentLists devices={devices} screens={screens} />
		</>
	);
}

function DashboardStats({
	devices,
	onlineDevices,
	playlists,
	screens,
}: {
	devices: Device[];
	onlineDevices: number;
	playlists: Playlist[];
	screens: ScreenDesign[];
}) {
	return (
		<section className={"statGrid"}>
			<a className={"statPanel"} href="/devices">
				<span>{t`Online Devices`}</span>
				<strong>{onlineDevices}</strong>
				<p>
					{devices.length - onlineDevices} {t`offline`}
				</p>
			</a>
			<a className={"statPanel"} href="/screens">
				<span>{t`Total Screens`}</span>
				<strong>{screens.length}</strong>
				<p>{t`View details`}</p>
			</a>
			<a className={"statPanel"} href="/playlists">
				<span>{t`Total Playlists`}</span>
				<strong>{playlists.length}</strong>
				<p>{t`View details`}</p>
			</a>
		</section>
	);
}

function SystemStatusPanel() {
	return (
		<section className={"panel"}>
			<header className={"sectionHeader"}>
				<h2>{t`System Status`}</h2>
				<span className={"status ok"}>{t`Ready`}</span>
			</header>
			<dl className={"facts"}>
				<dt>{t`Signed in as`}</dt>
				<dd>{t`Admin`}</dd>
				<dt>{t`Renderer`}</dt>
				<dd>{t`Takumi to 1-bit BMP`}</dd>
				<dt>{t`Today`}</dt>
				<dd>{new Date().toISOString().slice(0, 10)}</dd>
			</dl>
		</section>
	);
}
