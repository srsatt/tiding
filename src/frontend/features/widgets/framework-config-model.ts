import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import {
	FRAMEWORK_WIDGET_DEFINITIONS,
	type WidgetConfig,
} from "../../../rendering/composer/framework-widgets";

const definitionsByName = new Map(
	FRAMEWORK_WIDGET_DEFINITIONS.map((definition) => [
		definition.name,
		definition,
	]),
);

const technicalKeys = new Set(["customWidgetId"]);

export function frameworkDefinitionFor(template?: WidgetTemplate) {
	return template ? definitionsByName.get(template.name) : undefined;
}

export function frameworkFieldLabel(key: string) {
	return key
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (value) => value.toUpperCase());
}

export function frameworkInputType(value: unknown) {
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "checkbox";
	return "text";
}

export function frameworkConfigFields(
	template: WidgetTemplate | undefined,
	config: WidgetConfig,
	options: { skipTechnical?: boolean } = {},
) {
	const definition = frameworkDefinitionFor(template);
	if (!definition) return [];
	return Object.entries(definition.defaultConfig)
		.filter(([key]) => !(options.skipTechnical && technicalKeys.has(key)))
		.map(([key, fallback]) => {
			const value = config[key] ?? fallback;
			const type = frameworkInputType(fallback);
			return {
				key,
				label: frameworkFieldLabel(key),
				type,
				value,
				defaultValue: fallback,
			};
		});
}
