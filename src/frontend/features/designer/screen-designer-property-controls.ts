import { t } from "ttag";
import {
	configWithStyle,
	parseWidgetConfig,
	rotationFromConfig,
} from "../../../shared/widget-config";
import { applyWidgetStyle } from "./screen-designer-geometry";
import { refreshWidgetPreview } from "./screen-designer-preview";
import { syncDesignerRow } from "./screen-designer-state";
import { setDesignerStatus } from "./screen-designer-status";

function selectedWidget(root: HTMLElement) {
	if (!root.dataset.selectedWidgetId) return null;
	return root.querySelector<HTMLElement>(
		`.designerWidget[data-widget-id="${root.dataset.selectedWidgetId}"]`,
	);
}

function canvasFor(root: HTMLElement) {
	const canvas = root.querySelector<HTMLElement>(".designerCanvas");
	if (!canvas) throw new Error("Designer canvas missing");
	return canvas;
}

function applyFrameworkFields(
	root: HTMLElement,
	config: Record<string, unknown>,
) {
	const panel = root.querySelector<HTMLElement>(
		`[data-widget-config-panel][data-widget-id="${root.dataset.selectedWidgetId}"]`,
	);
	panel
		?.querySelectorAll<HTMLInputElement>("[data-widget-config-field]")
		.forEach((input) => {
			const key = input.dataset.configKey;
			if (!key) return;
			if (input.dataset.configType === "checkbox") {
				config[key] = input.checked;
				return;
			}
			if (input.dataset.configType === "number") {
				config[key] = Number(input.value);
				return;
			}
			config[key] = input.value;
		});
	return config;
}

function syncDisplayLabel(
	root: HTMLElement,
	widget: HTMLElement,
	config: Record<string, unknown>,
) {
	const label = String(
		config.label || config.text || widget.dataset.label || "",
	);
	if (!label) return;
	widget.dataset.label = label;
	const canvasLabel = widget.querySelector<HTMLElement>(
		"[data-canvas-widget-label]",
	);
	if (canvasLabel) canvasLabel.textContent = label;
	const row = root.querySelector<HTMLElement>(
		`[data-widget-row][data-widget-id="${widget.dataset.widgetId}"]`,
	);
	if (!row) return;
	row.dataset.label = label;
	const cardTitle = row.querySelector<HTMLElement>("[data-widget-card-title]");
	if (cardTitle) cardTitle.textContent = label;
	const selectedTitle = root.querySelector<HTMLElement>(
		"[data-selection-label]",
	);
	if (selectedTitle) selectedTitle.textContent = label;
}

export function hydrateDesignerProperties(root: HTMLElement) {
	const save = root.querySelector<HTMLButtonElement>("[data-selection-save]");
	if (!save) return;
	save.addEventListener("click", async () => {
		const widget = selectedWidget(root);
		const panel = root.querySelector<HTMLElement>("[data-selection-panel]");
		if (!widget?.dataset.updateUrl || !panel) return;
		const value = (field: string) =>
			panel.querySelector<HTMLInputElement>(`[data-property-field="${field}"]`)
				?.value || "0";
		const select = panel.querySelector<HTMLSelectElement>(
			'[data-property-field="textAlign"]',
		);
		const config = parseWidgetConfig(
			configWithStyle(widget.dataset.config || "{}", {
				fontSize: Number(value("fontSize")),
				opacity: Number(value("opacity")),
				textAlign: select?.value || "center",
			}),
		);
		applyFrameworkFields(root, config);
		const patch = {
			x: value("x"),
			y: value("y"),
			width: value("width"),
			height: value("height"),
			z_index: value("zIndex"),
			config: JSON.stringify({
				...config,
				rotation: Number(value("rotation")),
			}),
		};
		const response = await fetch(widget.dataset.updateUrl, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		});
		save.dataset.saveState = response.ok ? "saved" : "error";
		setDesignerStatus(
			root,
			response.ok ? t`Properties saved` : t`Property save failed`,
			response.ok ? "saved" : "error",
		);
		if (!response.ok) return;
		Object.assign(widget.dataset, patch, {
			fontSize: value("fontSize"),
			opacity: value("opacity"),
			rotation: String(rotationFromConfig(patch.config)),
			textAlign: select?.value || "center",
			zIndex: value("zIndex"),
		});
		widget.style.zIndex = value("zIndex");
		applyWidgetStyle(canvasFor(root), widget);
		refreshWidgetPreview(widget);
		syncDisplayLabel(root, widget, config);
		syncDesignerRow(root, widget);
	});
}
