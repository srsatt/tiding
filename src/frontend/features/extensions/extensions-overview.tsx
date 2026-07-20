import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { ButtonLink } from "../../ui";

export function ExtensionsOverview({
	sources,
	widgets,
}: {
	sources: DataSource[];
	widgets: CustomWidget[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Extensions`}</h1>
					<p>{t`Manage data sources and custom widgets for dynamic content.`}</p>
				</div>
				<div className={"actions"}>
					<ButtonLink href="/data-sources/new">{t`New Data Source`}</ButtonLink>
					<ButtonLink href="/custom-widgets/new" variant="secondary">
						{t`New Custom Widget`}
					</ButtonLink>
				</div>
			</header>
			<section className={"statGrid"}>
				<a className={"statPanel"} href="/data-sources">
					<span>{t`Data Sources`}</span>
					<strong>{sources.length}</strong>
					<p>{t`Create, test, and edit external data.`}</p>
				</a>
				<a className={"statPanel"} href="/custom-widgets">
					<span>{t`Custom Widgets`}</span>
					<strong>{widgets.length}</strong>
					<p>{t`Build widgets from data sources.`}</p>
				</a>
			</section>
		</>
	);
}
