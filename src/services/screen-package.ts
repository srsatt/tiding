import type { DatabaseService } from "../db";
import type { CustomWidget } from "../db/repositories/custom-widget.repository";
import type { DataSource } from "../db/repositories/data-source.repository";
import type { ScreenDesign } from "../db/repositories/screen-design.repository";
import type { Widget } from "../db/repositories/widget.repository";
import {
	customWidgetIdFromConfig,
	parseWidgetConfig,
} from "../shared/widget-config";

interface PackedDataSource
	extends Pick<
		DataSource,
		| "id"
		| "name"
		| "description"
		| "type"
		| "url"
		| "method"
		| "refresh_interval"
		| "json_path"
		| "is_active"
	> {}

interface PackedCustomWidget
	extends Pick<
		CustomWidget,
		| "id"
		| "name"
		| "description"
		| "data_source_id"
		| "displayType"
		| "template"
		| "config"
		| "min_width"
		| "min_height"
		| "context_schema"
	> {}

interface PackedWidget
	extends Pick<Widget, "x" | "y" | "width" | "height" | "config" | "z_index"> {
	template: string;
}

export interface ScreenPackage {
	version: 1;
	screen: Pick<
		ScreenDesign,
		"name" | "description" | "width" | "height" | "background"
	>;
	widgets: PackedWidget[];
	customWidgets: PackedCustomWidget[];
	dataSources: PackedDataSource[];
}

function sanitizeDataSource(source: DataSource): PackedDataSource {
	return {
		id: source.id,
		name: source.name,
		description: source.description,
		type: source.type,
		url: source.url,
		method: source.method,
		refresh_interval: source.refresh_interval,
		json_path: source.json_path,
		is_active: source.is_active,
	};
}

export async function exportScreenPackage(
	db: DatabaseService,
	screenId: number,
): Promise<ScreenPackage | null> {
	const screen = await db.screens.findById(screenId);
	if (!screen) return null;
	const [widgets, templates, customWidgets, dataSources] = await Promise.all([
		db.widgets.findByScreenDesign(screenId),
		db.templates.findAll(),
		db.customWidgets.findAll(),
		db.dataSources.findAll(),
	]);
	const templateById = new Map(
		templates.map((template) => [template.id, template]),
	);
	const customIds = new Set(
		widgets
			.map((widget) => customWidgetIdFromConfig(widget.config))
			.filter((id): id is number => id !== undefined),
	);
	const packedCustomWidgets = customWidgets.filter((widget) =>
		customIds.has(widget.id),
	);
	const dataSourceIds = new Set(
		packedCustomWidgets.map((widget) => widget.data_source_id),
	);
	return {
		version: 1,
		screen: {
			name: screen.name,
			description: screen.description,
			width: screen.width,
			height: screen.height,
			background: screen.background,
		},
		widgets: widgets.map((widget) => ({
			template: templateById.get(widget.template_id)?.name ?? "text",
			x: widget.x,
			y: widget.y,
			width: widget.width,
			height: widget.height,
			config: widget.config,
			z_index: widget.z_index,
		})),
		customWidgets: packedCustomWidgets,
		dataSources: dataSources
			.filter((source) => dataSourceIds.has(source.id))
			.map(sanitizeDataSource),
	};
}

export async function importScreenPackage(
	db: DatabaseService,
	pkg: ScreenPackage,
): Promise<number> {
	if (pkg.version !== 1) throw new Error("Unsupported screen package version");
	const screenId = await db.screens.create(
		`${pkg.screen.name} Copy`,
		pkg.screen.description ?? undefined,
		pkg.screen,
	);
	const sourceIds = new Map<number, number>();
	for (const source of pkg.dataSources ?? []) {
		const id = await db.dataSources.create(source);
		sourceIds.set(source.id, id);
	}
	const customWidgetIds = new Map<number, number>();
	for (const widget of pkg.customWidgets ?? []) {
		const dataSourceId = sourceIds.get(widget.data_source_id);
		if (!dataSourceId) continue;
		const id = await db.customWidgets.create({
			...widget,
			name: `${widget.name} Copy`,
			data_source_id: dataSourceId,
		});
		customWidgetIds.set(widget.id, id);
	}
	const templates = await db.templates.findAll();
	const templateByName = new Map(
		templates.map((template) => [template.name, template]),
	);
	for (const widget of pkg.widgets ?? []) {
		const template = templateByName.get(widget.template) ?? templates[0];
		const config = parseWidgetConfig(widget.config);
		const oldCustomId = Number(config.customWidgetId);
		if (customWidgetIds.has(oldCustomId)) {
			config.customWidgetId = customWidgetIds.get(oldCustomId);
		}
		await db.widgets.create({
			...widget,
			screen_design_id: screenId,
			template_id: template.id,
			config: JSON.stringify(config),
		});
	}
	return screenId;
}
