import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { CUSTOM_WIDGET_FRAMEWORK_NAME } from "../../../shared/framework-widget-instance";
import type { DesignerWidgetPayload } from "./screen-designer-payload";

export type DesignerPaletteItem = {
	key: string;
	label: string;
	category: string;
	kind: "predefined-framework" | "custom-js-framework";
	frameworkName: string;
	templateId?: number;
	config: string;
	width: number;
	height: number;
};

export type DesignerPaletteGroup = {
	category: string;
	items: DesignerPaletteItem[];
};

function customTemplate(templates: WidgetTemplate[]) {
	return templates.find(
		(template) =>
			template.name === CUSTOM_WIDGET_FRAMEWORK_NAME ||
			template.category.toLowerCase() === "custom",
	);
}

export function frameworkPaletteItems(
	templates: WidgetTemplate[],
	customWidgets: CustomWidget[],
): DesignerPaletteItem[] {
	const custom = customTemplate(templates);
	const templateItems = templates
		.filter((template) => template.id !== custom?.id)
		.map((template) => ({
			key: `template-${template.id}`,
			label: template.label || template.name,
			category: template.category || "Widgets",
			kind: "predefined-framework" as const,
			frameworkName: template.name,
			templateId: template.id,
			config: template.defaultConfig || "{}",
			width: template.min_width,
			height: template.min_height,
		}));

	const customItems = customWidgets.map((widget) => ({
		key: `custom-${widget.id}`,
		label: widget.name,
		category: custom?.category || "Custom",
		kind: "custom-js-framework" as const,
		frameworkName: CUSTOM_WIDGET_FRAMEWORK_NAME,
		templateId: custom?.id,
		config: JSON.stringify({ customWidgetId: widget.id }),
		width: widget.min_width,
		height: widget.min_height,
	}));

	return [...templateItems, ...customItems];
}

export function paletteCategories(items: DesignerPaletteItem[]) {
	return Array.from(new Set(items.map((item) => item.category)));
}

export function frameworkPaletteGroups(
	templates: WidgetTemplate[],
	customWidgets: CustomWidget[],
): DesignerPaletteGroup[] {
	const items = frameworkPaletteItems(templates, customWidgets);
	return paletteCategories(items).map((category) => ({
		category,
		items: items.filter((item) => item.category === category),
	}));
}

export function palettePayload(
	item: DesignerPaletteItem,
): DesignerWidgetPayload | null {
	if (!item.templateId) return null;
	return {
		template_id: item.templateId,
		config: item.config,
		width: item.width,
		height: item.height,
	};
}
