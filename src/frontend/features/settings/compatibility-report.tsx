import { t } from "ttag";
import type { CompatibilitySchemaReport } from "../../../db/schema";
import { enabledLabel } from "../../format";

export function CompatibilityReportPanel({
	report,
}: {
	report: CompatibilitySchemaReport;
}) {
	return (
		<section className={"panel"}>
			<h2>{t`Compatibility Schema`}</h2>
			<dl className={"facts"}>
				<dt>{t`Compatible`}</dt>
				<dd>{enabledLabel(report.ok)}</dd>
				<dt>{t`Missing tables`}</dt>
				<dd>
					{report.missingTables.length
						? report.missingTables.join(", ")
						: t`none`}
				</dd>
				<dt>{t`Missing columns`}</dt>
				<dd>
					{Object.keys(report.missingColumns).length
						? JSON.stringify(report.missingColumns)
						: t`none`}
				</dd>
			</dl>
			<table>
				<thead>
					<tr>
						<th>{t`Table`}</th>
						<th>{t`Present`}</th>
						<th>{t`Missing columns`}</th>
					</tr>
				</thead>
				<tbody>
					{report.tables.map((table) => (
						<tr key={table.table}>
							<td>
								<code>{table.table}</code>
							</td>
							<td>{enabledLabel(table.present)}</td>
							<td>
								{table.missingColumns.length
									? table.missingColumns.join(", ")
									: t`none`}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
}
