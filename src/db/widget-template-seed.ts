import { FRAMEWORK_WIDGET_DEFINITIONS } from "../rendering/composer/framework-widgets";

export interface WidgetTemplateSeed {
	name: string;
	label: string;
	description: string;
	category: string;
	defaultConfig: string;
	min_width: number;
	min_height: number;
}

export const FRAMEWORK_WIDGET_TEMPLATE_SEEDS: WidgetTemplateSeed[] =
	FRAMEWORK_WIDGET_DEFINITIONS.map((definition) => ({
		name: definition.name,
		label: definition.label,
		description: definition.description,
		category: definition.category,
		defaultConfig: JSON.stringify(definition.defaultConfig),
		min_width: definition.minWidth,
		min_height: definition.minHeight,
	}));
