import { t } from "ttag";
import { positionFromEvent } from "./screen-designer-geometry";
import type { DesignerWidgetPayload } from "./screen-designer-payload";
import { parseDesignerWidgetPayload } from "./screen-designer-payload";
import { setDesignerStatus } from "./screen-designer-status";

function canvasSize(canvas: HTMLElement) {
	const width = Number.parseInt(
		getComputedStyle(canvas).getPropertyValue("--design-width"),
		10,
	);
	const height = Number.parseInt(
		getComputedStyle(canvas).getPropertyValue("--design-height"),
		10,
	);
	return {
		width: Number.isFinite(width) ? width : 800,
		height: Number.isFinite(height) ? height : 480,
	};
}

function clamp(value: number, max: number) {
	return Math.max(0, Math.min(value, max));
}

function placedWidgetCount(canvas: HTMLElement) {
	return canvas.querySelectorAll(".designerWidget").length;
}

export async function addDesignerPaletteWidget(
	root: HTMLElement,
	payload: DesignerWidgetPayload,
	position: { x: number; y: number },
) {
	const createUrl = root.dataset.createUrl;
	if (!createUrl) return;
	setDesignerStatus(root, t`Adding widget`);
	const response = await fetch(createUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			template_id: payload.template_id,
			x: position.x,
			y: position.y,
			width: payload.width,
			height: payload.height,
			config: payload.config,
		}),
	});
	if (response.ok) window.location.reload();
	else setDesignerStatus(root, t`Add failed`, "error");
}

export function payloadFromPaletteItem(item: HTMLElement) {
	return parseDesignerWidgetPayload(item.dataset.createPayload || "");
}

export function payloadFromPaletteData(payload: string | undefined) {
	return parseDesignerWidgetPayload(payload || "");
}

export function paletteClickPosition(
	canvas: HTMLElement,
	payload: DesignerWidgetPayload,
) {
	const { width, height } = canvasSize(canvas);
	const offset = placedWidgetCount(canvas) * 32;
	const baseX = Math.floor(width * 0.08);
	const baseY = Math.floor(height * 0.08);
	return {
		x: clamp(baseX + offset, width - payload.width),
		y: clamp(baseY + offset, height - payload.height),
	};
}

export function paletteDropPosition(canvas: HTMLElement, event: DragEvent) {
	return positionFromEvent(canvas, event);
}
