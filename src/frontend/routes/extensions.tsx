import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { ExtensionsOverview } from "../features/extensions/extensions-overview";
import { Page } from "../ui";

export async function renderExtensionsPage(db: DatabaseService) {
	const [sources, widgets] = await Promise.all([
		db.dataSources.findAll(),
		db.customWidgets.findAll(),
	]);
	return Page({
		title: t`Extensions`,
		children: <ExtensionsOverview sources={sources} widgets={widgets} />,
	});
}
