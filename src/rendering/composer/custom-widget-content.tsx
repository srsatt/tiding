import type { DatabaseService } from "../../db";
import type { CustomWidget } from "../../db/repositories/custom-widget.repository";
import type { Widget } from "../../db/repositories/widget.repository";
import {
	parseJsonValue,
	renderCustomWidgetTemplate,
} from "./custom-widget-runtime";
import { CustomWidgetFrame } from "./screen-document";

export async function renderCustomWidgetContent(
	db: DatabaseService,
	customWidget: CustomWidget,
	config: Record<string, unknown>,
	widget: Widget | null = null,
) {
	const dataSource = await db.dataSources.findById(customWidget.data_source_id);
	const data = dataSource ? parseJsonValue(dataSource.last_data) : null;
	return renderCustomWidgetTemplate({
		customWidget,
		config,
		dataSource,
		data,
		widget,
	});
}

export async function renderCustomWidgetFrame(
	db: DatabaseService,
	widget: Widget,
	config: Record<string, unknown>,
	customWidgetId: number,
) {
	const customWidget = await db.customWidgets.findById(customWidgetId);
	if (!customWidget) return `Missing custom widget ${customWidgetId}`;

	const html = await renderCustomWidgetContent(
		db,
		customWidget,
		config,
		widget,
	);
	return <CustomWidgetFrame>{html}</CustomWidgetFrame>;
}
