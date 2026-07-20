import { t } from "ttag";
import type { Widget } from "../../../db/repositories/widget.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { parseWidgetConfig } from "../../../shared/widget-config";
import {
	CheckboxField,
	NumberField,
	TextField,
} from "../../design-system/native-controls";
import {
	frameworkConfigFields,
	frameworkDefinitionFor,
} from "./framework-config-model";

function inputValue(value: unknown) {
	return value === undefined || value === null ? "" : String(value);
}

export function WidgetFrameworkFields({
	templates,
	widget,
}: {
	templates: WidgetTemplate[];
	widget?: Widget;
}) {
	const activeTemplateId = widget?.template_id ?? templates[0]?.id;
	const currentConfig = parseWidgetConfig(widget?.config ?? "{}");
	return (
		<section className={"wide frameworkSettings"} data-framework-config-root>
			<h2>{t`Framework Settings`}</h2>
			<p className={"mutedText"}>
				{t`Common fields update the widget JSON automatically.`}
			</p>
			{templates.map((template) => {
				const definition = frameworkDefinitionFor(template);
				if (!definition) return null;
				const fields = frameworkConfigFields(template, currentConfig);
				return (
					<fieldset
						key={template.id}
						className={"frameworkConfigGrid"}
						data-framework-config
						data-template-id={template.id}
						hidden={template.id !== activeTemplateId}
					>
						<legend>{template.label || definition.label}</legend>
						{fields.map((field) => {
							const props = {
								"data-framework-config-input": true,
								"data-config-key": field.key,
								"data-config-type": field.type,
								"data-default": inputValue(field.defaultValue),
							};
							if (field.type === "checkbox") {
								return (
									<CheckboxField
										key={field.key}
										label={field.label}
										{...props}
										value="true"
										checked={Boolean(field.value)}
									/>
								);
							}
							if (field.type === "number") {
								return (
									<NumberField
										key={field.key}
										label={field.label}
										{...props}
										value={inputValue(field.value)}
									/>
								);
							}
							return (
								<TextField
									key={field.key}
									label={field.label}
									{...props}
									value={inputValue(field.value)}
								/>
							);
						})}
					</fieldset>
				);
			})}
		</section>
	);
}
