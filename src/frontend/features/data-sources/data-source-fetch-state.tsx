import { t } from "ttag";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { TextareaField } from "../../design-system/native-controls";
import { formatTimestamp, jsonPreview } from "../../format";
import { Button } from "../../ui";

export function DataSourceFetchState({ source }: { source: DataSource }) {
	return (
		<section
			className={"panel"}
			data-island="data-source-tester"
			data-props={JSON.stringify({ id: source.id })}
		>
			<div className={"sectionHeader"}>
				<h2>{t`Fetch State`}</h2>
			</div>
			<form
				action={`/api/data-sources/${source.id}/fetch`}
				method="POST"
				className={"formGrid"}
			>
				<TextareaField
					className={"wide"}
					label={t`Test context`}
					name="test_context"
					rows={3}
					data-json-editor
					placeholder={t`{"city":"Berlin"}`}
				/>
				<Button type="submit">{t`Test URL`}</Button>
			</form>
			<dl className={"facts"}>
				<dt>{t`Last fetched`}</dt>
				<dd>{formatTimestamp(source.last_fetched_at)}</dd>
				<dt>{t`Last error`}</dt>
				<dd>
					{source.last_error ? (
						<span className={"errorText"}>{source.last_error}</span>
					) : (
						t`None`
					)}
				</dd>
			</dl>
			<pre className={"dataPreview"}>{jsonPreview(source.last_data)}</pre>
		</section>
	);
}
