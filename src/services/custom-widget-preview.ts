import { h } from "preact";
import type { DatabaseService } from "../db";
import type { CustomWidget } from "../db/repositories/custom-widget.repository";
import { renderCustomWidgetContent } from "../rendering/composer/custom-widget-content";
import { parseJsonValue } from "../rendering/composer/custom-widget-runtime";
import { ScreenComposer } from "../rendering/composer/screen-composer";
import {
	CustomWidgetPreviewFrame,
	renderScreenDocument,
} from "../rendering/composer/screen-document";
import { takumiRenderer } from "../rendering/takumi/renderer";
import { renderSettings } from "./render-settings";

export async function renderCustomWidgetPreview(
	db: DatabaseService,
	customWidgetId: number,
) {
	const composer = new ScreenComposer(db);
	const composed = await composer.composeCustomWidgetHtml(customWidgetId);
	const settings = await renderSettings(db);
	return await takumiRenderer.renderHtmlToBmp(composed.html, {
		width: composed.width,
		height: composed.height,
		threshold: settings.threshold,
		ditherMode: settings.ditherMode,
	});
}

export async function renderDraftCustomWidgetPreview(
	db: DatabaseService,
	input: {
		name: string;
		data_source_id: number;
		displayType?: string;
		template?: string | null;
		config: string;
		context_schema?: string | null;
		min_width?: number | null;
		min_height?: number | null;
	},
) {
	const customWidget: CustomWidget = {
		id: 0,
		name: input.name,
		data_source_id: input.data_source_id,
		displayType: input.displayType || "text",
		template: input.template ?? null,
		config: input.config,
		context_schema: input.context_schema ?? null,
		min_width: input.min_width || 100,
		min_height: input.min_height || 50,
		created_at: "",
		updated_at: "",
	};
	const width = Math.max(1, customWidget.min_width);
	const height = Math.max(1, customWidget.min_height);
	const config = parseJsonValue(input.config);
	const content = await renderCustomWidgetContent(
		db,
		customWidget,
		typeof config === "object" && config ? config : {},
	);
	const html = renderScreenDocument({
		background: "#ffffff",
		bodyBackground: "#ffffff",
		width,
		height,
		children: h(CustomWidgetPreviewFrame, { width, height, children: content }),
	});
	const settings = await renderSettings(db);
	return await takumiRenderer.renderHtmlToBmp(html, {
		width,
		height,
		threshold: settings.threshold,
		ditherMode: settings.ditherMode,
	});
}
