import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { DashboardOverview } from "../features/dashboard/dashboard-overview";
import { Page } from "../ui";

export async function renderDashboardPage(db: DatabaseService) {
	const [screens, devices, playlists] = await Promise.all([
		db.screens.findAll(),
		db.devices.findAll(),
		db.playlists.findAll(),
	]);
	return Page({
		title: t`Dashboard`,
		children: (
			<DashboardOverview
				devices={devices}
				playlists={playlists}
				screens={screens}
			/>
		),
	});
}
