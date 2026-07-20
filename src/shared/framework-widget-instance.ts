import type { CustomWidget } from "../db/repositories/custom-widget.repository";
import type { WidgetTemplate } from "../db/repositories/widget-template.repository";
import { customWidgetIdFromConfig } from "./widget-config";

export const CUSTOM_WIDGET_FRAMEWORK_NAME = "custom-js";

export type FrameworkWidgetInstance =
	| {
			kind: "predefined";
			frameworkName: string;
			label: string;
			category: string;
	  }
	| {
			kind: "custom-js";
			frameworkName: typeof CUSTOM_WIDGET_FRAMEWORK_NAME;
			label: string;
			category: string;
			customWidgetId: number;
			customWidget?: CustomWidget;
	  };

export function frameworkWidgetInstance({
	config,
	template,
	customWidgets = [],
}: {
	config: string | Record<string, unknown>;
	template?: WidgetTemplate;
	customWidgets?: CustomWidget[];
}): FrameworkWidgetInstance {
	const customWidgetId =
		typeof config === "string"
			? customWidgetIdFromConfig(config)
			: Number(config.customWidgetId);
	const customWidget =
		customWidgetId && Number.isFinite(customWidgetId)
			? customWidgets.find((widget) => widget.id === customWidgetId)
			: undefined;

	if (customWidgetId && customWidgetId > 0) {
		return {
			kind: "custom-js",
			frameworkName: CUSTOM_WIDGET_FRAMEWORK_NAME,
			label: customWidget?.name || `Custom widget ${customWidgetId}`,
			category: "Custom",
			customWidgetId,
			customWidget,
		};
	}

	return {
		kind: "predefined",
		frameworkName: template?.name || "text",
		label: template?.label || template?.name || "Widget",
		category: template?.category || "Widget",
	};
}
