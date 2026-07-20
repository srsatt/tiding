import { t } from "ttag";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { Button, ButtonLink, EmptyRow } from "../../ui";
import { DataSourceFetchState } from "./data-source-fetch-state";
import { DataSourceForm } from "./data-source-form";
import { DataSourceRow } from "./data-source-row";

export function DataSourcesOverview({
	sources,
	usageCounts,
}: {
	sources: DataSource[];
	usageCounts: Map<number, number>;
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Data Sources`}</h1>
					<p>{t`Create HTTP sources, test fetches, and inspect cached data state.`}</p>
				</div>
				<div className={"actions"}>
					<form
						action="/api/data-sources/test-all"
						method="POST"
						className={"inlineForm"}
					>
						<Button type="submit">{t`Test All`}</Button>
					</form>
					<ButtonLink href="/data-sources/new">{t`New Source`}</ButtonLink>
				</div>
			</header>
			<section className={"panel"}>
				<table>
					<thead>
						<tr>
							<th>{t`Name`}</th>
							<th>{t`Type`}</th>
							<th>URL</th>
							<th>{t`Widgets`}</th>
							<th>{t`Active`}</th>
							<th>{t`Status`}</th>
							<th>{t`Last Fetch`}</th>
							<th>{t`Actions`}</th>
						</tr>
					</thead>
					<tbody>
						{sources.length === 0 ? (
							<EmptyRow colSpan={8}>{t`No data sources yet.`}</EmptyRow>
						) : (
							sources.map((source) => (
								<DataSourceRow
									key={source.id}
									source={source}
									usageCount={usageCounts.get(source.id) ?? 0}
								/>
							))
						)}
					</tbody>
				</table>
			</section>
		</>
	);
}

export function NewDataSourcePanel() {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{t`Create Data Source`}</h1>
			</header>
			<section className={"panel"}>
				<DataSourceForm action="/api/data-sources" submitLabel={t`Create`} />
			</section>
		</>
	);
}

export function DataSourceEditorPanel({ source }: { source: DataSource }) {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{source.name}</h1>
				<ButtonLink href="/data-sources" variant="secondary">
					{t`Back`}
				</ButtonLink>
			</header>
			<section className={"panel"}>
				<DataSourceForm
					source={source}
					action={`/api/data-sources/${source.id}`}
					submitLabel={t`Save`}
				/>
			</section>
			<DataSourceFetchState source={source} />
		</>
	);
}
