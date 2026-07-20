import { t } from "ttag";
import {
	setDesignerSelectionSummary,
	setDesignerStatus,
} from "./screen-designer-status";
import { syncDesignerWidgetCount } from "./screen-designer-widget-count";

function setText(parent: HTMLElement, selector: string, text: string) {
	const element = parent.querySelector<HTMLElement>(selector);
	if (element) element.textContent = text;
}

function setField(parent: HTMLElement, field: string, value: string) {
	const input = parent.querySelector<HTMLInputElement | HTMLSelectElement>(
		`[data-property-field="${field}"]`,
	);
	if (input) input.value = value;
}

function showWidgetConfigPanel(root: HTMLElement, widgetId: string) {
	root
		.querySelectorAll<HTMLElement>("[data-widget-config-panel]")
		.forEach((panel) => {
			panel.hidden = panel.dataset.widgetId !== widgetId;
		});
}

export function selectDesignerWidget(root: HTMLElement, widgetId: string) {
	root.querySelectorAll<HTMLElement>("[data-widget-id]").forEach((element) => {
		element.dataset.selected = String(element.dataset.widgetId === widgetId);
	});
	const row = root.querySelector<HTMLElement>(
		`[data-widget-row][data-widget-id="${widgetId}"]`,
	);
	const panel = root.querySelector<HTMLElement>("[data-selection-panel]");
	const empty = root.querySelector<HTMLElement>("[data-selection-empty]");
	if (!row || !panel || !empty) return;
	root.dataset.selectedWidgetId = widgetId;
	root
		.querySelector<HTMLElement>(`.designerWidget[data-widget-id="${widgetId}"]`)
		?.focus({ preventScroll: true });
	empty.hidden = true;
	panel.hidden = false;
	setText(panel, "[data-selection-label]", row.dataset.label || "");
	setDesignerSelectionSummary(root, row.dataset.label || t`Selected widget`);
	setText(
		panel,
		"[data-selection-position]",
		`${row.dataset.x}, ${row.dataset.y}`,
	);
	setText(
		panel,
		"[data-selection-size]",
		`${row.dataset.width}x${row.dataset.height}`,
	);
	setText(
		panel,
		"[data-selection-rotation]",
		`${row.dataset.rotation || 0}deg`,
	);
	setField(panel, "x", row.dataset.x || "0");
	setField(panel, "y", row.dataset.y || "0");
	setField(panel, "width", row.dataset.width || "1");
	setField(panel, "height", row.dataset.height || "1");
	setField(panel, "zIndex", row.dataset.zIndex || "0");
	setField(panel, "rotation", row.dataset.rotation || "0");
	setField(panel, "fontSize", row.dataset.fontSize || "12");
	setField(panel, "opacity", row.dataset.opacity || "1");
	setField(panel, "textAlign", row.dataset.textAlign || "center");
	showWidgetConfigPanel(root, widgetId);
	const edit = panel.querySelector<HTMLAnchorElement>("[data-selection-edit]");
	const remove = panel.querySelector<HTMLButtonElement>(
		"[data-selection-delete]",
	);
	if (edit) edit.href = `/screens/widgets/${widgetId}`;
	if (remove) remove.dataset.deleteUrl = `/api/widgets/${widgetId}`;
}

export function hydrateDesignerSelection(root: HTMLElement) {
	root.querySelectorAll<HTMLElement>(".designerWidget").forEach((widget) => {
		widget.addEventListener("click", (event) => {
			event.preventDefault();
			selectDesignerWidget(root, widget.dataset.widgetId || "");
		});
	});
	root.querySelectorAll<HTMLElement>("[data-widget-row]").forEach((row) => {
		row.addEventListener("click", () =>
			selectDesignerWidget(root, row.dataset.widgetId || ""),
		);
	});
}

export function hydrateDesignerDelete(root: HTMLElement) {
	const remove = root.querySelector<HTMLButtonElement>(
		"[data-selection-delete]",
	);
	if (!remove) return;
	remove.addEventListener("click", async () => {
		if (!remove.dataset.deleteUrl || !root.dataset.selectedWidgetId) return;
		const id = root.dataset.selectedWidgetId;
		const response = await fetch(remove.dataset.deleteUrl, {
			method: "DELETE",
		});
		remove.dataset.saveState = response.ok ? "saved" : "error";
		setDesignerStatus(
			root,
			response.ok ? t`Widget deleted` : t`Delete failed`,
			response.ok ? "saved" : "error",
		);
		if (!response.ok) return;
		root.querySelector(`.designerWidget[data-widget-id="${id}"]`)?.remove();
		root.querySelector(`[data-widget-row][data-widget-id="${id}"]`)?.remove();
		const panel = root.querySelector<HTMLElement>("[data-selection-panel]");
		const empty = root.querySelector<HTMLElement>("[data-selection-empty]");
		if (panel) panel.hidden = true;
		if (empty) empty.hidden = false;
		setDesignerSelectionSummary(root, t`No selection`);
		showWidgetConfigPanel(root, "");
		syncDesignerWidgetCount(root);
		delete root.dataset.selectedWidgetId;
	});
}

export function hydrateDesignerPaletteSearch(root: HTMLElement) {
	const input = root.querySelector<HTMLInputElement>("[data-palette-search]");
	if (!input) return;
	input.addEventListener("input", () => {
		const query = input.value.trim().toLowerCase();
		root.querySelectorAll<HTMLElement>(".paletteItem").forEach((item) => {
			item.hidden = !item.textContent?.toLowerCase().includes(query);
		});
	});
}
