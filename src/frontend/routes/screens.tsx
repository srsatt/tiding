import { t } from "ttag";
import type { DatabaseService } from "../../db";
import {
	NewScreenPage,
	ScreensOverviewPage,
} from "../features/screens/screen-pages";
import { Page } from "../ui";

export async function renderScreensPage(
	db: DatabaseService,
	cachePath: string,
) {
	const screens = await db.screens.findAll();
	return Page({
		title: t`Screens`,
		children: <ScreensOverviewPage cachePath={cachePath} screens={screens} />,
	});
}

export function renderNewScreenPage() {
	return Page({
		title: t`New Screen`,
		children: <NewScreenPage />,
	});
}
