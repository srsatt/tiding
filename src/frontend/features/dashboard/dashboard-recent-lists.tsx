import { t } from "ttag";
import type { Device } from "../../../db/repositories/device.repository";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import { ButtonLink, EmptyRow } from "../../ui";

export function DashboardRecentLists({
	devices,
	screens,
}: {
	devices: Device[];
	screens: ScreenDesign[];
}) {
	return (
		<div className={"splitLayout"}>
			<RecentDevices devices={devices.slice(0, 5)} />
			<RecentScreens screens={screens.slice(0, 5)} />
		</div>
	);
}

function RecentDevices({ devices }: { devices: Device[] }) {
	return (
		<section className={"panel"}>
			<header className={"sectionHeader"}>
				<h2>{t`Recent Devices`}</h2>
				<ButtonLink href="/devices" variant="small">
					{t`View all`}
				</ButtonLink>
			</header>
			<table>
				<tbody>
					{devices.length === 0 ? (
						<EmptyRow colSpan={3}>{t`No devices yet.`}</EmptyRow>
					) : (
						devices.map((device) => (
							<tr key={device.id}>
								<td>
									<a href={`/devices/${device.id}`}>{device.label}</a>
								</td>
								<td>{device.friendly_id ?? device.mac_address}</td>
								<td>{device.is_active ? t`Online` : t`Offline`}</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</section>
	);
}

function RecentScreens({ screens }: { screens: ScreenDesign[] }) {
	return (
		<section className={"panel"}>
			<header className={"sectionHeader"}>
				<h2>{t`Recent Screens`}</h2>
				<ButtonLink href="/screens" variant="small">
					{t`View all`}
				</ButtonLink>
			</header>
			<table>
				<tbody>
					{screens.length === 0 ? (
						<EmptyRow colSpan={2}>{t`No screens yet.`}</EmptyRow>
					) : (
						screens.map((screen) => (
							<tr key={screen.id}>
								<td>
									<a href={`/screens/${screen.id}`}>{screen.name}</a>
								</td>
								<td>
									{screen.width}x{screen.height}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</section>
	);
}
