import { t } from "ttag";
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
} from "../widgets/framework-config-model";
import type { DesignerWidget } from "./screen-designer-model";

function inputValue(value: unknown) {
	return value === undefined || value === null ? "" : String(value);
}

function templateById(templates: WidgetTemplate[]) {
	return new Map(templates.map((template) => [template.id, template]));
}

export function ScreenDesignerConfigPanels({
	widgets,
	templates,
}: {
	widgets: DesignerWidget[];
	templates: WidgetTemplate[];
}) {
	const templatesById = templateById(templates);
	return (
		<section className={"designerConfigPanels"} data-widget-config-panels>
			<h3>{t`Widget Config`}</h3>
			<p className={"mutedText"}>
				{t`Edit common Framework fields without leaving the canvas.`}
			</p>
			{widgets.map((widget) => {
				const template = templatesById.get(widget.template_id);
				const definition = frameworkDefinitionFor(template);
				const fields = frameworkConfigFields(
					template,
					parseWidgetConfig(widget.config),
					{ skipTechnical: true },
				);
				return (
					<fieldset
						key={widget.id}
						className={"frameworkConfigGrid designerConfigPanel"}
						data-widget-config-panel
						data-widget-id={widget.id}
						hidden
					>
						<legend>
							{template?.label || definition?.label || t`Widget fields`}
						</legend>
						{fields.length === 0 ? (
							<p
								className={"mutedText"}
							>{t`No quick fields for this widget.`}</p>
						) : (
							fields.map((field) => {
								const props = {
									"data-widget-config-field": true,
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
							})
						)}
					</fieldset>
				);
			})}
		</section>
	);
}
