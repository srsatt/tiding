import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import {
	DataSourceSelect,
	DisplayTypeSelect,
} from "../../design-system/form-controls";
import {
	NumberField,
	TextareaField,
	TextField,
} from "../../design-system/native-controls";
import { Button, ButtonLink, DeleteButton, FormActions } from "../../ui";

export function CustomWidgetForm({
	widget,
	sources,
	action,
	submitLabel,
}: {
	widget?: CustomWidget;
	sources: DataSource[];
	action: string;
	submitLabel: string;
}) {
	const prefix = widget ? `custom-widget-${widget.id}` : "new-custom-widget";
	return (
		<form action={action} method="POST" className={"formGrid"}>
			{widget ? <input type="hidden" name="_method" value="PATCH" /> : null}
			<TextField
				label={t`Name`}
				name="name"
				value={widget?.name ?? ""}
				required
			/>
			<label htmlFor={`${prefix}-source`}>
				{t`Data source`}
				<DataSourceSelect
					id={`${prefix}-source`}
					sources={sources}
					selected={widget?.data_source_id}
				/>
			</label>
			<label htmlFor={`${prefix}-display-type`}>
				{t`Display type`}
				<DisplayTypeSelect
					id={`${prefix}-display-type`}
					selected={widget?.displayType}
				/>
			</label>
			<NumberField
				label={t`Minimum width`}
				name="min_width"
				value={widget?.min_width ?? 100}
				min="1"
			/>
			<NumberField
				label={t`Minimum height`}
				name="min_height"
				value={widget?.min_height ?? 50}
				min="1"
			/>
			<TextareaField
				label={t`Template`}
				name="template"
				rows={8}
				className="wide"
			>
				{widget?.template || "{{data}}"}
			</TextareaField>
			<p className="mutedText wide">
				{t`Framework JSX includes a render-safe Lucide helper:`}{" "}
				<code>{'<Icon name="check" size={24} label="Ready" />'}</code>
				{" · "}
				{t`Available icons: battery, calendar, check, clock, cloud-sun, gauge, image, qr-code, timer, wifi.`}
			</p>
			<TextareaField
				label={t`Widget context JSON Schema`}
				name="context_schema"
				data-json-editor
				className="wide"
			>
				{widget?.context_schema || "{}"}
			</TextareaField>
			<TextareaField
				label={t`Config JSON`}
				name="config"
				data-json-editor
				className="wide"
			>
				{widget?.config || "{}"}
			</TextareaField>
			<FormActions>
				<Button type="submit">{submitLabel}</Button>
				{widget ? (
					<DeleteButton action={`/api/custom-widgets/${widget.id}`} />
				) : (
					<ButtonLink href="/custom-widgets" variant="secondary">
						{t`Cancel`}
					</ButtonLink>
				)}
			</FormActions>
		</form>
	);
}
