import type { DatabaseService } from "../db";
import { ScreenComposer } from "../rendering/composer/screen-composer";
import type { RenderCache } from "../rendering/render-cache";
import { takumiRenderer } from "../rendering/takumi/renderer";
import { renderSettings } from "./render-settings";

export interface RenderPreviewResult {
	imagePath: string;
	imageUrl: string;
	mimeType: "image/bmp";
	width: number;
	height: number;
	renderedAt: string;
}

export async function renderScreenPreview(
	db: DatabaseService,
	cache: RenderCache,
	screenId: number,
): Promise<RenderPreviewResult> {
	const composer = new ScreenComposer(db);
	const composed = await composer.composeHtml(screenId);
	const settings = await renderSettings(db);
	const image = await takumiRenderer.renderHtmlToBmp(composed.html, {
		width: composed.width,
		height: composed.height,
		threshold: settings.threshold,
		ditherMode: settings.ditherMode,
		ditherRegions: composed.ditherRegions,
	});
	cache.write(screenId, image);
	return {
		imagePath: cache.artifactPath(screenId),
		imageUrl: cache.artifactUrl(screenId),
		mimeType: "image/bmp",
		width: composed.width,
		height: composed.height,
		renderedAt: new Date().toISOString(),
	};
}
