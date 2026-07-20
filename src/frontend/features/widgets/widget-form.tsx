import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { Widget } from "../../../db/repositories/widget.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { CUSTOM_WIDGET_FRAMEWORK_NAME } from "../../../shared/framework-widget-instance";
import {
	CustomWidgetSelect,
	TemplateSelect,
} from "../../design-system/form-controls";
import {
	NumberField,
	TextareaField,
} from "../../design-system/native-controls";
import { customWidgetIdFromConfig } from "../../format";
import { Button, ButtonLink, DeleteButton, FormActions } from "../../ui";
import { WidgetContextFields } from "./widget-context-fields";
import { WidgetFrameworkFields } from "./widget-framework-fields";

export function WidgetForm({
	screenId,
	widget,
	templates,
	customWidgets,
	cancelHref,
}: {
	screenId: number;
	widget?: Widget;
	templates: WidgetTemplate[];
	customWidgets: CustomWidget[];
	cancelHref?: string;
}) {
	const action = widget ? `/api/widgets/${widget.id}` : "/api/widgets";
	const templateId = widget
		? `edit-widget-template-${widget.id}`
		: `widget-template-${screenId}`;
	const customId = widget
		? `edit-widget-custom-${widget.id}`
		: `widget-custom-${screenId}`;
	const customTemplate = templates.find(
		(template) => template.name === CUSTOM_WIDGET_FRAMEWORK_NAME,
	);
	return (
		<form action={action} method="POST" className={"formGrid"}>
			{widget ? <input type="hidden" name="_method" value="PATCH" /> : null}
			<input type="hidden" name="screen_design_id" value={screenId} />
			<label htmlFor={templateId}>
				{t`Framework widget`}
				<TemplateSelect
					id={templateId}
					templates={templates}
					selected={widget?.template_id}
					disabled={Boolean(widget)}
				/>
			</label>
			<label htmlFor={customId}>
				{t`Custom widget`}
				<CustomWidgetSelect
					id={customId}
					widgets={customWidgets}
					selected={
						widget ? customWidgetIdFromConfig(widget.config) : undefined
					}
					customTemplateId={customTemplate?.id}
				/>
			</label>
			<NumberField label="X" name="x" value={widget?.x ?? 0} />
			<NumberField label="Y" name="y" value={widget?.y ?? 0} />
			<NumberField
				label={t`Width`}
				name="width"
				value={widget?.width ?? 200}
				min="1"
			/>
			<NumberField
				label={t`Height`}
				name="height"
				value={widget?.height ?? 100}
				min="1"
			/>
			<NumberField
				label={t`Z index`}
				name="z_index"
				value={widget?.z_index ?? 0}
			/>
			<WidgetFrameworkFields templates={templates} widget={widget} />
			<WidgetContextFields customWidgets={customWidgets} widget={widget} />
			<TextareaField
				label={t`Config JSON`}
				name="config"
				data-json-editor
				className="wide"
			>
				{widget?.config ?? `{"text":"Hello"}`}
			</TextareaField>
			<FormActions>
				<Button type="submit">{widget ? t`Save` : t`Add Widget`}</Button>
				{cancelHref ? (
					<ButtonLink href={cancelHref} variant="secondary">
						{t`Cancel`}
					</ButtonLink>
				) : null}
				{widget ? <DeleteButton action={`/api/widgets/${widget.id}`} /> : null}
			</FormActions>
		</form>
	);
}
