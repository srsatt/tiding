import type { DatabaseService } from "../db";
import { ScreenComposer } from "../rendering/composer/screen-composer";
import { takumiRenderer } from "../rendering/takumi/renderer";
import { renderSettings } from "./render-settings";

export async function renderWidgetPreview(
	db: DatabaseService,
	widgetId: number,
) {
	const composed = await new ScreenComposer(db).composeWidgetHtml(widgetId);
	const settings = await renderSettings(db);
	return takumiRenderer.renderHtmlToBmp(composed.html, {
		width: composed.width,
		height: composed.height,
		threshold: settings.threshold,
		ditherMode: settings.ditherMode,
		ditherRegions: composed.ditherRegions,
		supersample: 1,
		topDown: false,
	});
}
