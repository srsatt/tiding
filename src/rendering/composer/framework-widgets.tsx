import { CONTENT_WIDGETS, LAYOUT_WIDGETS } from "./framework-content-widgets";
import {
	CUSTOM_WIDGET_FRAMEWORK_NAME,
	CUSTOM_WIDGETS,
} from "./framework-custom-widgets";
import { SYSTEM_WIDGETS } from "./framework-system-widgets";
import { TIME_WIDGETS } from "./framework-time-widgets";
import type {
	FrameworkRenderContext,
	FrameworkWidgetDefinition,
	WidgetConfig,
} from "./framework-widget-kit";

export type {
	FrameworkDeviceContext,
	FrameworkRenderContext,
	FrameworkWidgetDefinition,
	WidgetConfig,
} from "./framework-widget-kit";
export { CUSTOM_WIDGET_FRAMEWORK_NAME };

export const FRAMEWORK_WIDGET_DEFINITIONS: FrameworkWidgetDefinition[] = [
	...CONTENT_WIDGETS,
	...CUSTOM_WIDGETS,
	...LAYOUT_WIDGETS,
	...SYSTEM_WIDGETS,
	...TIME_WIDGETS,
];

const frameworkWidgets = new Map(
	FRAMEWORK_WIDGET_DEFINITIONS.map((definition) => [
		definition.name,
		definition,
	]),
);

export const FRAMEWORK_WIDGET_NAMES = FRAMEWORK_WIDGET_DEFINITIONS.map(
	(definition) => definition.name,
);

export function renderFrameworkWidget(
	name: string,
	config: WidgetConfig,
	widgetId: number,
	context: FrameworkRenderContext = { now: new Date() },
) {
	const definition = frameworkWidgets.get(name) ?? frameworkWidgets.get("text");
	return (
		definition?.render({ text: `Widget ${widgetId}`, ...config }, context) ??
		null
	);
}
