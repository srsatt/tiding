import { selectDesignerWidget } from "./screen-designer-selection";

export function syncDesignerRow(root: HTMLElement, widget: HTMLElement) {
	const row = root.querySelector<HTMLElement>(
		`[data-widget-row][data-widget-id="${widget.dataset.widgetId}"]`,
	);
	if (!row) return;
	for (const key of [
		"x",
		"y",
		"width",
		"height",
		"zIndex",
		"rotation",
		"fontSize",
		"opacity",
		"textAlign",
	]) {
		row.dataset[key] = widget.dataset[key] || "";
	}
	const position = row.querySelector<HTMLElement>("[data-widget-position]");
	const size = row.querySelector<HTMLElement>("[data-widget-size]");
	const layer = row.querySelector<HTMLElement>("[data-widget-layer]");
	if (position) position.textContent = `${row.dataset.x}, ${row.dataset.y}`;
	if (size) size.textContent = `${row.dataset.width}x${row.dataset.height}`;
	if (layer) layer.textContent = `Layer ${row.dataset.zIndex || 0}`;
	if (row.dataset.selected === "true") {
		selectDesignerWidget(root, widget.dataset.widgetId || "");
	}
}

export function snapToGrid(value: number, enabled: boolean, grid = 20) {
	return enabled ? Math.round(value / grid) * grid : value;
}
