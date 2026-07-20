import { t } from "ttag";
import type { CustomWidget } from "../../db/repositories/custom-widget.repository";
import type { DataSource } from "../../db/repositories/data-source.repository";
import type { WidgetTemplate } from "../../db/repositories/widget-template.repository";
import { SelectControl } from "./native-controls";

export function TemplateSelect({
	id,
	templates,
	selected,
	disabled,
}: {
	id: string;
	templates: WidgetTemplate[];
	selected?: number;
	disabled?: boolean;
}) {
	return (
		<SelectControl id={id} name="template_id" required disabled={disabled}>
			{templates.map((template) => (
				<option
					key={template.id}
					value={template.id}
					data-template-name={template.name}
					selected={selected === template.id}
				>
					{template.label || template.name}
				</option>
			))}
		</SelectControl>
	);
}

export function CustomWidgetSelect({
	id,
	widgets,
	selected,
	customTemplateId,
}: {
	id: string;
	widgets: CustomWidget[];
	selected?: number;
	customTemplateId?: number;
}) {
	return (
		<SelectControl
			id={id}
			data-custom-widget-select
			data-custom-widget-template-id={customTemplateId}
		>
			<option value="">{t`None`}</option>
			{widgets.map((widget) => (
				<option
					key={widget.id}
					value={widget.id}
					selected={selected === widget.id}
				>
					{widget.name}
				</option>
			))}
		</SelectControl>
	);
}

export function DataSourceSelect({
	id,
	sources,
	selected,
}: {
	id: string;
	sources: DataSource[];
	selected?: number;
}) {
	return (
		<SelectControl id={id} name="data_source_id" required>
			{sources.map((source) => (
				<option
					key={source.id}
					value={source.id}
					selected={selected === source.id}
				>
					{source.name}
				</option>
			))}
		</SelectControl>
	);
}

export function MethodSelect({
	id,
	selected,
}: {
	id: string;
	selected?: string;
}) {
	return (
		<SelectControl id={id} name="method">
			<option value="GET" selected={(selected || "GET") === "GET"}>
				GET
			</option>
			<option value="POST" selected={selected === "POST"}>
				POST
			</option>
		</SelectControl>
	);
}

export function DisplayTypeSelect({
	id,
	selected,
}: {
	id: string;
	selected?: string;
}) {
	const value = selected || "text";
	return (
		<SelectControl id={id} name="displayType">
			<option value="value" selected={value === "value"}>
				{t`Single Value`}
			</option>
			<option value="list" selected={value === "list"}>
				{t`List`}
			</option>
			<option value="script" selected={value === "script"}>
				JavaScript
			</option>
			<option value="grid" selected={value === "grid"}>
				{t`Grid`}
			</option>
			<option value="framework" selected={value === "framework"}>
				Framework
			</option>
			<option value="text" selected={value === "text"}>
				{t`Text`}
			</option>
		</SelectControl>
	);
}
