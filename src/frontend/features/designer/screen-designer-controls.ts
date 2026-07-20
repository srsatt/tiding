import interact from "interactjs";
import { t } from "ttag";
import { applyWidgetStyle, designSize } from "./screen-designer-geometry";
import { refreshWidgetPreview } from "./screen-designer-preview";
import { snapToGrid, syncDesignerRow } from "./screen-designer-state";
import { setDesignerStatus } from "./screen-designer-status";

export async function patchWidget(
	widget: HTMLElement,
	patch: Record<string, unknown>,
) {
	if (!widget.dataset.updateUrl) return false;
	widget.dataset.saveState = "saving";
	const response = await fetch(widget.dataset.updateUrl, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(patch),
	});
	widget.dataset.saveState = response.ok ? "saved" : "error";
	const root = widget.closest<HTMLElement>("[data-island]");
	if (root) {
		setDesignerStatus(
			root,
			response.ok ? t`Widget saved` : t`Widget save failed`,
			response.ok ? "saved" : "error",
		);
	}
	return response.ok;
}

function updateByDelta(
	canvas: HTMLElement,
	widget: HTMLElement,
	dx: number,
	dy: number,
) {
	const rect = canvas.getBoundingClientRect();
	const design = designSize(canvas);
	const snap =
		canvas.closest<HTMLElement>("[data-island]")?.dataset.snap === "true";
	widget.dataset.x = String(
		snapToGrid(
			Math.round(
				Number(widget.dataset.x || 0) + (dx / rect.width) * design.width,
			),
			snap,
		),
	);
	widget.dataset.y = String(
		snapToGrid(
			Math.round(
				Number(widget.dataset.y || 0) + (dy / rect.height) * design.height,
			),
			snap,
		),
	);
	applyWidgetStyle(canvas, widget);
}

function resizeByPixels(
	canvas: HTMLElement,
	widget: HTMLElement,
	widthPx: number,
	heightPx: number,
) {
	const rect = canvas.getBoundingClientRect();
	const design = designSize(canvas);
	const snap =
		canvas.closest<HTMLElement>("[data-island]")?.dataset.snap === "true";
	widget.dataset.width = String(
		snapToGrid(
			Math.round((Math.max(24, widthPx) / rect.width) * design.width),
			snap,
		),
	);
	widget.dataset.height = String(
		snapToGrid(
			Math.round((Math.max(24, heightPx) / rect.height) * design.height),
			snap,
		),
	);
	applyWidgetStyle(canvas, widget);
}

export function hydrateDesignerCanvasWidgets(canvas: HTMLElement) {
	const root = canvas.closest<HTMLElement>("[data-island]");
	canvas.querySelectorAll<HTMLElement>(".designerWidget").forEach((widget) => {
		interact(widget)
			.draggable({
				modifiers: [
					interact.modifiers.restrictRect({
						restriction: canvas,
						endOnly: false,
					}),
				],
				listeners: {
					start() {
						widget.dataset.dragging = "true";
					},
					move(event) {
						updateByDelta(canvas, widget, event.dx, event.dy);
					},
					async end() {
						widget.dataset.dragging = "false";
						await patchWidget(widget, {
							x: widget.dataset.x,
							y: widget.dataset.y,
						});
						if (root) syncDesignerRow(root, widget);
					},
				},
			})
			.resizable({
				edges: {
					right: ".designerResizeHandle",
					bottom: ".designerResizeHandle",
				},
				modifiers: [
					interact.modifiers.restrictEdges({ outer: canvas }),
					interact.modifiers.restrictSize({ min: { width: 24, height: 24 } }),
				],
				listeners: {
					start() {
						widget.dataset.resizing = "true";
					},
					move(event) {
						resizeByPixels(canvas, widget, event.rect.width, event.rect.height);
					},
					async end() {
						widget.dataset.resizing = "false";
						await patchWidget(widget, {
							width: widget.dataset.width,
							height: widget.dataset.height,
						});
						refreshWidgetPreview(widget);
						if (root) syncDesignerRow(root, widget);
					},
				},
			});
	});
}
