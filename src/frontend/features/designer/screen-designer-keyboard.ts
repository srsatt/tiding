import { t } from "ttag";
import { patchWidget } from "./screen-designer-controls";
import { applyWidgetStyle } from "./screen-designer-geometry";
import { syncDesignerRow } from "./screen-designer-state";
import { setDesignerStatus } from "./screen-designer-status";

const ARROW_DELTAS: Record<string, [number, number]> = {
	ArrowDown: [0, 1],
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	ArrowUp: [0, -1],
};

function selectedWidget(root: HTMLElement) {
	if (!root.dataset.selectedWidgetId) return null;
	return root.querySelector<HTMLElement>(
		`.designerWidget[data-widget-id="${root.dataset.selectedWidgetId}"]`,
	);
}

function isFormTarget(target: EventTarget | null) {
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	) {
		return true;
	}
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(target.closest("button, a:not(.designerWidget)"));
}

export function hydrateDesignerKeyboard(
	root: HTMLElement,
	canvas: HTMLElement,
) {
	root.addEventListener("keydown", async (event) => {
		if (isFormTarget(event.target)) return;
		const delta = ARROW_DELTAS[event.key];
		if (!delta) return;
		const widget = selectedWidget(root);
		if (!widget) return;
		event.preventDefault();
		const step = event.shiftKey ? 10 : 1;
		widget.dataset.x = String(Number(widget.dataset.x || 0) + delta[0] * step);
		widget.dataset.y = String(Number(widget.dataset.y || 0) + delta[1] * step);
		applyWidgetStyle(canvas, widget);
		syncDesignerRow(root, widget);
		const ok = await patchWidget(widget, {
			x: widget.dataset.x,
			y: widget.dataset.y,
		});
		setDesignerStatus(
			root,
			ok ? t`Widget moved` : t`Move failed`,
			ok ? "saved" : "error",
		);
	});
}
