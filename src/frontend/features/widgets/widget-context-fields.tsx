import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { Widget } from "../../../db/repositories/widget.repository";
import { parseWidgetConfig } from "../../../shared/widget-config";
import {
	CheckboxField,
	NumberField,
	TextField,
} from "../../design-system/native-controls";

type SchemaField = { key: string; type: string; label: string };

function parseSchema(schema: string | null | undefined): SchemaField[] {
	try {
		const parsed = JSON.parse(schema || "{}") as Record<string, unknown>;
		const properties =
			typeof parsed.properties === "object" && parsed.properties
				? (parsed.properties as Record<string, unknown>)
				: parsed;
		return Object.entries(properties).map(([key, value]) => {
			const field = typeof value === "object" && value ? value : {};
			const type = String((field as { type?: unknown }).type || "string");
			const title = String((field as { title?: unknown }).title || key);
			return { key, type, label: title };
		});
	} catch {
		return [];
	}
}

function inputType(type: string) {
	if (type === "number" || type === "integer") return "number";
	if (type === "boolean") return "checkbox";
	return "text";
}

function inputValue(value: unknown) {
	return value === undefined || value === null ? "" : String(value);
}

export function WidgetContextFields({
	customWidgets,
	widget,
}: {
	customWidgets: CustomWidget[];
	widget?: Widget;
}) {
	const config = parseWidgetConfig(widget?.config ?? "{}");
	const selectedCustomId = Number(config.customWidgetId);
	const ctx =
		typeof config.ctx === "object" && config.ctx
			? (config.ctx as Record<string, unknown>)
			: {};
	const contextWidgets = customWidgets
		.map((customWidget) => ({
			customWidget,
			fields: parseSchema(customWidget.context_schema),
		}))
		.filter(({ fields }) => fields.length > 0);
	if (contextWidgets.length === 0) return null;
	return (
		<section className={"wide contextSettings"} data-widget-context-root>
			<h2>{t`Placement Context`}</h2>
			<p className={"mutedText"}>
				{t`Context values are passed to the custom widget as ctx.`}
			</p>
			{contextWidgets.map(({ customWidget, fields }) => (
				<fieldset
					key={customWidget.id}
					className={"contextConfigGrid"}
					data-widget-context
					data-custom-widget-id={customWidget.id}
					hidden={customWidget.id !== selectedCustomId}
				>
					<legend>{customWidget.name}</legend>
					{fields.map((field) => {
						const type = inputType(field.type);
						const value = ctx[field.key] ?? "";
						const props = {
							"data-widget-context-input": true,
							"data-context-key": field.key,
							"data-context-type": type,
						};
						if (type === "checkbox") {
							return (
								<CheckboxField
									key={field.key}
									label={field.label}
									{...props}
									value="true"
									checked={Boolean(value)}
								/>
							);
						}
						if (type === "number") {
							return (
								<NumberField
									key={field.key}
									label={field.label}
									{...props}
									value={inputValue(value)}
								/>
							);
						}
						return (
							<TextField
								key={field.key}
								label={field.label}
								{...props}
								value={inputValue(value)}
							/>
						);
					})}
				</fieldset>
			))}
		</section>
	);
}
