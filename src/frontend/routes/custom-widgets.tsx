import { t } from "ttag";
import type { DatabaseService } from "../../db";
import {
	CustomWidgetEditorPanel,
	CustomWidgetsOverview,
	NewCustomWidgetPanel,
} from "../features/custom-widgets/custom-widget-pages";
import { Page } from "../ui";

export async function renderCustomWidgetsPage(db: DatabaseService) {
	const [widgets, sources] = await Promise.all([
		db.customWidgets.findAll(),
		db.dataSources.findAll(),
	]);
	return Page({
		title: t`Custom Widgets`,
		children: <CustomWidgetsOverview widgets={widgets} sources={sources} />,
	});
}

export async function renderNewCustomWidgetPage(
	db: DatabaseService,
	selectedSourceId?: number,
) {
	const sources = await db.dataSources.findAll();
	return Page({
		title: t`New Custom Widget`,
		children: (
			<NewCustomWidgetPanel
				sources={sources}
				selectedSourceId={selectedSourceId}
			/>
		),
	});
}

export async function renderCustomWidgetEditorPage(
	db: DatabaseService,
	id: number,
) {
	const [widget, sources] = await Promise.all([
		db.customWidgets.findById(id),
		db.dataSources.findAll(),
	]);
	if (!widget) return null;
	return Page({
		title: t`Edit ${widget.name}`,
		children: <CustomWidgetEditorPanel sources={sources} widget={widget} />,
	});
}
