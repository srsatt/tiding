import type { Database } from "bun:sqlite";
import * as fs from "node:fs";
import * as nodePath from "node:path";
import { FRAMEWORK_WIDGET_TEMPLATE_SEEDS } from "./widget-template-seed";

const OBSERVED_SCHEMA_PATH =
	"docs/compat/schema-observations/full_observed_schema.sql";

export const REQUIRED_COLUMNS: Record<string, string[]> = {
	devices: [
		"id",
		"mac_address",
		"api_key",
		"playlist_id",
		"is_active",
		"refresh_rate",
	],
	device_screen_assignments: [
		"id",
		"device_id",
		"screen_design_id",
		"is_active",
	],
	screen_designs: ["id", "name", "width", "height", "background", "updated_at"],
	screen_widgets: [
		"id",
		"screen_design_id",
		"template_id",
		"x",
		"y",
		"width",
		"height",
		"config",
		"z_index",
		"updated_at",
	],
	widget_templates: ["id", "name", "label", "defaultConfig"],
	custom_widgets: [
		"id",
		"name",
		"data_source_id",
		"displayType",
		"config",
		"updated_at",
	],
	data_sources: [
		"id",
		"name",
		"url",
		"method",
		"refresh_interval",
		"last_data",
		"last_error",
		"updated_at",
	],
	settings: ["id", "key", "value", "updated_at"],
	playlists: ["id", "name", "is_active", "updated_at"],
	playlist_items: [
		"id",
		"playlist_id",
		"screen_design_id",
		"kind",
		"order",
		"duration",
	],
};

export interface SchemaValidationResult {
	ok: boolean;
	missingTables: string[];
	missingColumns: Record<string, string[]>;
}

export interface SchemaTableReport {
	table: string;
	present: boolean;
	requiredColumns: string[];
	presentColumns: string[];
	missingColumns: string[];
}

export interface CompatibilitySchemaReport extends SchemaValidationResult {
	requiredTables: string[];
	observedTables: string[];
	tables: SchemaTableReport[];
}

function quoteIdentifier(identifier: string) {
	return `"${identifier.replaceAll('"', '""')}"`;
}

function listTables(db: Database) {
	return (
		db
			.query(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
			)
			.all() as { name: string }[]
	).map((row) => row.name);
}

function listColumns(db: Database, table: string) {
	return (
		db.query(`PRAGMA table_info(${quoteIdentifier(table)})`).all() as {
			name: string;
		}[]
	).map((row) => row.name);
}

export function validateCompatibilitySchema(
	db: Database,
): SchemaValidationResult {
	const missingTables: string[] = [];
	const missingColumns: Record<string, string[]> = {};

	for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
		const tableRow = db
			.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get(table);

		if (!tableRow) {
			missingTables.push(table);
			continue;
		}

		const observedColumns = new Set(listColumns(db, table));
		const missing = columns.filter((column) => !observedColumns.has(column));
		if (missing.length > 0) missingColumns[table] = missing;
	}

	return {
		ok: missingTables.length === 0 && Object.keys(missingColumns).length === 0,
		missingTables,
		missingColumns,
	};
}

export function compatibilitySchemaReport(
	db: Database,
): CompatibilitySchemaReport {
	const observedTables = listTables(db);
	const observedTableSet = new Set(observedTables);
	const tables = Object.entries(REQUIRED_COLUMNS).map(
		([table, requiredColumns]) => {
			const present = observedTableSet.has(table);
			const presentColumns = present ? listColumns(db, table) : [];
			const presentColumnSet = new Set(presentColumns);
			const missingColumns = requiredColumns.filter(
				(column) => !presentColumnSet.has(column),
			);
			return {
				table,
				present,
				requiredColumns,
				presentColumns,
				missingColumns,
			};
		},
	);
	const missingTables = tables
		.filter((table) => !table.present)
		.map((table) => table.table);
	const missingColumns = Object.fromEntries(
		tables
			.filter((table) => table.present && table.missingColumns.length > 0)
			.map((table) => [table.table, table.missingColumns]),
	);

	return {
		ok: missingTables.length === 0 && Object.keys(missingColumns).length === 0,
		missingTables,
		missingColumns,
		requiredTables: Object.keys(REQUIRED_COLUMNS),
		observedTables,
		tables,
	};
}

export function bootstrapObservedSchema(db: Database) {
	const tables = db
		.query(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
		)
		.all();
	if (tables.length > 0) {
		throw new Error("Refusing to bootstrap a non-empty database");
	}

	if (!fs.existsSync(OBSERVED_SCHEMA_PATH)) {
		throw new Error(`Observed schema file is missing: ${OBSERVED_SCHEMA_PATH}`);
	}

	const schema = fs.readFileSync(OBSERVED_SCHEMA_PATH, "utf8");
	const statements = schema
		.split(";")
		.map((statement) => statement.trim())
		.filter(
			(statement) =>
				statement && !statement.startsWith("CREATE TABLE sqlite_sequence"),
		);

	db.transaction(() => {
		for (const statement of statements) db.query(statement).run();
		for (const template of FRAMEWORK_WIDGET_TEMPLATE_SEEDS) {
			db.query(
				"INSERT OR IGNORE INTO widget_templates (name, label, description, category, defaultConfig, min_width, min_height) VALUES (?, ?, ?, ?, ?, ?, ?)",
			).run(
				template.name,
				template.label,
				template.description,
				template.category,
				template.defaultConfig,
				template.min_width,
				template.min_height,
			);
		}
		db.query(
			"INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
		).run("data_source_timeout_ms", "2000");
	})();
}

export function ensureDbParentDirectory(dbPath: string) {
	if (dbPath === ":memory:") return;
	const parent = nodePath.dirname(dbPath);
	if (parent && parent !== ".") fs.mkdirSync(parent, { recursive: true });
}
