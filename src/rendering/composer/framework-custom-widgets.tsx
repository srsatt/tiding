import { CUSTOM_WIDGET_FRAMEWORK_NAME } from "../../shared/framework-widget-instance";
import type { FrameworkWidgetDefinition } from "./framework-widget-kit";
import { Panel } from "./framework-widget-kit";

export { CUSTOM_WIDGET_FRAMEWORK_NAME } from "../../shared/framework-widget-instance";

export const CUSTOM_WIDGETS: FrameworkWidgetDefinition[] = [
	{
		name: CUSTOM_WIDGET_FRAMEWORK_NAME,
		label: "Custom JS Widget",
		description: "User-authored widget rendered through the Framework shell",
		category: "Custom",
		defaultConfig: { customWidgetId: null },
		minWidth: 220,
		minHeight: 100,
		render: () => (
			<Panel>
				<strong>Custom JS Widget</strong>
				<span>Select a custom widget.</span>
			</Panel>
		),
	},
];
