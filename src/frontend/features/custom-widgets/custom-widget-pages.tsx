import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { ButtonLink, DeleteForm, EmptyRow } from "../../ui";
import { CustomWidgetForm } from "./custom-widget-form";
import { CustomWidgetWizard } from "./custom-widget-wizard";

export function CustomWidgetsOverview({
	sources,
	widgets,
}: {
	sources: DataSource[];
	widgets: CustomWidget[];
}) {
	const sourceNames = new Map(
		sources.map((source) => [source.id, source.name]),
	);
	const displayTypeLabel = (value: string) => {
		if (value === "script") return t`JavaScript`;
		if (value === "framework") return t`Framework`;
		if (value === "single") return t`Single value`;
		return value.charAt(0).toUpperCase() + value.slice(1);
	};
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Custom Widgets`}</h1>
					<p>{t`Template widgets backed by cached data sources.`}</p>
				</div>
				<ButtonLink href="/custom-widgets/new">{t`New Widget`}</ButtonLink>
			</header>
			<section className={"panel"}>
				<table>
					<thead>
						<tr>
							<th>{t`Name`}</th>
							<th>{t`Type`}</th>
							<th>{t`Minimum Size`}</th>
							<th>{t`Source`}</th>
							<th>{t`Actions`}</th>
						</tr>
					</thead>
					<tbody>
						{widgets.length === 0 ? (
							<EmptyRow colSpan={5}>{t`No custom widgets yet.`}</EmptyRow>
						) : (
							widgets.map((widget) => (
								<tr key={widget.id}>
									<td>
										<a href={`/custom-widgets/${widget.id}`}>{widget.name}</a>
									</td>
									<td>{displayTypeLabel(widget.displayType)}</td>
									<td>
										{widget.min_width} × {widget.min_height}
									</td>
									<td>
										{sourceNames.get(widget.data_source_id) ??
											t`Unknown source`}
									</td>
									<td className={"actions"}>
										<ButtonLink
											href={`/custom-widgets/${widget.id}`}
											variant="small"
										>
											{t`Edit`}
										</ButtonLink>
										<DeleteForm action={`/api/custom-widgets/${widget.id}`} />
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</section>
		</>
	);
}

export function NewCustomWidgetPanel({
	selectedSourceId,
	sources,
}: {
	selectedSourceId?: number;
	sources: DataSource[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{t`Create Custom Widget`}</h1>
			</header>
			<CustomWidgetWizard
				sources={sources}
				selectedSourceId={selectedSourceId}
			/>
		</>
	);
}

export function CustomWidgetEditorPanel({
	sources,
	widget,
}: {
	sources: DataSource[];
	widget: CustomWidget;
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{widget.name}</h1>
				<ButtonLink href="/custom-widgets" variant="secondary">
					{t`Back`}
				</ButtonLink>
			</header>
			<div className={"splitLayout"}>
				<section className={"panel"}>
					<CustomWidgetForm
						widget={widget}
						sources={sources}
						action={`/api/custom-widgets/${widget.id}`}
						submitLabel={t`Save`}
					/>
				</section>
				<section className={"panel"}>
					<h2>{t`Preview`}</h2>
					<div
						data-island="screen-preview"
						data-props={JSON.stringify({
							src: `/api/custom-widgets/${widget.id}/preview`,
						})}
					>
						<div className={"previewFrame"}>
							<img
								src={`/api/custom-widgets/${widget.id}/preview`}
								alt={t`Custom widget preview`}
							/>
						</div>
						<ButtonLink
							href={`/api/custom-widgets/${widget.id}/preview`}
							variant="secondary"
						>
							{t`Open BMP`}
						</ButtonLink>
					</div>
				</section>
			</div>
		</>
	);
}
