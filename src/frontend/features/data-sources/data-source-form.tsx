import { t } from "ttag";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { MethodSelect } from "../../design-system/form-controls";
import {
	CheckboxField,
	NumberField,
	SelectControl,
	TextareaField,
	TextField,
} from "../../design-system/native-controls";
import { requestBodyValue } from "../../format";
import { Button, ButtonLink, DeleteButton, FormActions } from "../../ui";

export function DataSourceForm({
	source,
	action,
	submitLabel,
}: {
	source?: DataSource;
	action: string;
	submitLabel: string;
}) {
	const methodId = source ? `source-method-${source.id}` : "new-source-method";
	const typeId = source ? `source-type-${source.id}` : "new-source-type";
	const activeValue = source?.is_active as unknown;
	const active =
		activeValue === undefined ||
		activeValue === true ||
		activeValue === 1 ||
		activeValue === "1";
	return (
		<form action={action} method="POST" className={"formGrid"}>
			{source ? <input type="hidden" name="_method" value="PATCH" /> : null}
			<TextField
				label={t`Name`}
				name="name"
				value={source?.name ?? ""}
				required
			/>
			<TextareaField label={t`Description`} name="description">
				{source?.description || ""}
			</TextareaField>
			<TextField
				className={"wide"}
				label="URL"
				type="url"
				name="url"
				value={source?.url ?? ""}
				required
			/>
			<label htmlFor={methodId}>
				{t`Method`}
				<MethodSelect id={methodId} selected={source?.method} />
			</label>
			<label htmlFor={typeId}>
				{t`Type`}
				<SelectControl id={typeId} name="type">
					<option value="http" selected={(source?.type || "http") === "http"}>
						JSON API
					</option>
					<option value="rss" selected={source?.type === "rss"}>
						RSS/Atom
					</option>
				</SelectControl>
			</label>
			<NumberField
				label={t`Refresh interval`}
				name="refresh_interval"
				value={source?.refresh_interval ?? 300}
				min="1"
			/>
			<TextareaField
				className={"wide"}
				label={t`Headers JSON`}
				name="headers"
				data-json-editor
			>
				{source?.headers || "{}"}
			</TextareaField>
			<TextareaField
				className={"wide"}
				label={t`Request body`}
				name="body"
				rows={4}
			>
				{source ? requestBodyValue(source) : ""}
			</TextareaField>
			<TextField
				className={"wide"}
				label={t`JSON path`}
				name="json_path"
				value={source?.json_path || ""}
				placeholder={source ? undefined : "$.items[0].title"}
			/>
			<TextareaField
				className={"wide"}
				label={t`Context schema JSON`}
				name="context_schema"
				data-json-editor
			>
				{source?.context_schema || "{}"}
			</TextareaField>
			<CheckboxField name="is_active" checked={active} label={t`Active`} />
			<FormActions>
				<Button type="submit">{submitLabel}</Button>
				{source ? (
					<DeleteButton action={`/api/data-sources/${source.id}`} />
				) : (
					<ButtonLink href="/data-sources" variant="secondary">
						{t`Cancel`}
					</ButtonLink>
				)}
			</FormActions>
		</form>
	);
}
