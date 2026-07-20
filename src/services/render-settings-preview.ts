import { h } from "preact";
import type { DitherMode } from "../rendering/bmp/mono-bmp";
import { renderScreenDocument } from "../rendering/composer/screen-document";
import { takumiRenderer } from "../rendering/takumi/renderer";
import { RENDER_DEFAULTS } from "./render-settings";

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 192;
const modes = new Set<DitherMode>([
	"threshold",
	"floyd-steinberg",
	"grayscale",
]);

function previewOptions(input: Record<string, unknown>) {
	const mode = String(input.render_dither_mode || RENDER_DEFAULTS.ditherMode);
	const threshold = Number.parseInt(String(input.render_threshold || ""), 10);
	return {
		ditherMode: modes.has(mode as DitherMode)
			? (mode as DitherMode)
			: RENDER_DEFAULTS.ditherMode,
		threshold: Number.isInteger(threshold)
			? Math.max(0, Math.min(255, threshold))
			: RENDER_DEFAULTS.threshold,
	};
}

export async function renderDraftRenderSettingsPreview(
	input: Record<string, unknown>,
) {
	const options = previewOptions(input);
	const html = renderScreenDocument({
		background: "#ffffff",
		bodyBackground: "#ffffff",
		width: PREVIEW_WIDTH,
		height: PREVIEW_HEIGHT,
		children: h(
			"main",
			{
				style: {
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: "16px",
					width: "100%",
					height: "100%",
					padding: "24px",
					boxSizing: "border-box",
					color: "#000",
				},
			},
			h("strong", { style: { fontSize: "28px" } }, "Tiding"),
			h("div", {
				style: {
					background: "#777",
					borderRadius: "999px",
					width: "84px",
					height: "84px",
				},
			}),
			h("span", { style: { fontSize: "18px" } }, "1-bit BMP preview"),
			h("div", {
				style: {
					background: "linear-gradient(90deg,#000,#fff)",
					height: "28px",
				},
			}),
		),
	});
	return takumiRenderer.renderHtmlToBmp(html, {
		width: PREVIEW_WIDTH,
		height: PREVIEW_HEIGHT,
		threshold: options.threshold,
		ditherMode: options.ditherMode,
	});
}
