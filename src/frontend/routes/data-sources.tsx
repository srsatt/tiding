import { t } from "ttag";
import type { DatabaseService } from "../../db";
import {
	DataSourceEditorPanel,
	DataSourcesOverview,
	NewDataSourcePanel,
} from "../features/data-sources/data-source-pages";
import { Page } from "../ui";

export async function renderDataSourcesPage(db: DatabaseService) {
	const [sources, usageCounts] = await Promise.all([
		db.dataSources.findAll(),
		db.dataSources.usageCounts(),
	]);
	return Page({
		title: t`Data Sources`,
		children: (
			<DataSourcesOverview sources={sources} usageCounts={usageCounts} />
		),
	});
}

export function renderNewDataSourcePage() {
	return Page({
		title: t`New Data Source`,
		children: <NewDataSourcePanel />,
	});
}

export async function renderDataSourceEditorPage(
	db: DatabaseService,
	id: number,
) {
	const source = await db.dataSources.findById(id);
	if (!source) return null;
	return Page({
		title: t`Edit ${source.name}`,
		children: <DataSourceEditorPanel source={source} />,
	});
}
