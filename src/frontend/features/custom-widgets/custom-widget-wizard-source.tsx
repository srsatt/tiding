import { t } from "ttag";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { jsonPreview } from "../../format";

export function WizardSourceDetails({
	fields,
	source,
}: {
	fields: Array<{ path: string; type: string }>;
	source?: DataSource;
}) {
	return (
		<details className={"wizardSourceDetails"}>
			<summary>{t`Inspect cached data and available fields`}</summary>
			<div className={"dataPreview"}>{jsonPreview(source?.last_data)}</div>
			<h3>{t`Available Fields`}</h3>
			{fields.length === 0 ? (
				<p>{t`No fields discovered yet.`}</p>
			) : (
				<table>
					<tbody>
						{fields.map((field) => (
							<tr key={field.path}>
								<td>
									<code>{field.path}</code>
								</td>
								<td>{field.type}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</details>
	);
}
