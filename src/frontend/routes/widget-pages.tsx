import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { WidgetEditorPage } from "../features/widgets/widget-pages";
import { Page } from "../ui";

export async function renderNewWidgetPage(
	db: DatabaseService,
	screenId: number,
) {
	const [templates, customWidgets] = await Promise.all([
		db.templates.findAll(),
		db.customWidgets.findAll(),
	]);
	return Page({
		title: t`Add Widget`,
		children: (
			<WidgetEditorPage
				cancelHref={`/screens/${screenId}`}
				customWidgets={customWidgets}
				screenId={screenId}
				templates={templates}
			/>
		),
	});
}

export async function renderWidgetEditorPage(
	db: DatabaseService,
	widgetId: number,
) {
	const widget = await db.widgets.findById(widgetId);
	if (!widget) return null;
	const [templates, customWidgets] = await Promise.all([
		db.templates.findAll(),
		db.customWidgets.findAll(),
	]);
	return Page({
		title: t`Edit Widget ${widget.id}`,
		children: (
			<WidgetEditorPage
				cancelHref={`/screens/${widget.screen_design_id}`}
				customWidgets={customWidgets}
				screenId={widget.screen_design_id}
				templates={templates}
				widget={widget}
			/>
		),
	});
}
