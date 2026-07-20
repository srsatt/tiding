import type { Database } from "bun:sqlite";

export interface CustomWidget {
	id: number;
	name: string;
	description?: string | null;
	data_source_id: number;
	displayType: string;
	template?: string | null;
	config: string; // JSON
	context_schema?: string | null;
	min_width: number;
	min_height: number;
	created_at: string;
	updated_at: string;
}

export class CustomWidgetRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<CustomWidget[]> {
		return this.db
			.query("SELECT * FROM custom_widgets")
			.all() as CustomWidget[];
	}

	async findById(id: number): Promise<CustomWidget | null> {
		const row = this.db
			.query("SELECT * FROM custom_widgets WHERE id = ?")
			.get(id);
		return row as CustomWidget | null;
	}

	async findByDataSourceId(dataSourceId: number): Promise<CustomWidget[]> {
		return this.db
			.query("SELECT * FROM custom_widgets WHERE data_source_id = ?")
			.all(dataSourceId) as CustomWidget[];
	}

	private hasColumn(name: string) {
		return this.db
			.query("PRAGMA table_info(custom_widgets)")
			.all()
			.some((row) => (row as { name: string }).name === name);
	}

	async create(cw: Partial<CustomWidget>): Promise<number> {
		if (!cw.name || cw.data_source_id === undefined) {
			throw new Error("name and data_source_id are required");
		}

		const hasContextSchema = this.hasColumn("context_schema");
		const result = this.db
			.query(`
      INSERT INTO custom_widgets (name, description, data_source_id, displayType, template, config, min_width, min_height, updated_at${hasContextSchema ? ", context_schema" : ""}) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP${hasContextSchema ? ", ?" : ""})
			`)
			.run(
				cw.name,
				cw.description ?? null,
				cw.data_source_id,
				cw.displayType || "text",
				cw.template ?? null,
				cw.config || "{}",
				cw.min_width || 100,
				cw.min_height || 50,
				...(hasContextSchema ? [cw.context_schema ?? null] : []),
			);
		return Number(result.lastInsertRowid);
	}

	async update(id: number, cw: Partial<CustomWidget>): Promise<void> {
		const current = await this.findById(id);
		if (!current) throw new Error("Custom widget not found");

		const hasContextSchema = this.hasColumn("context_schema");
		this.db
			.query(`
      UPDATE custom_widgets 
      SET name = ?, description = ?, data_source_id = ?, displayType = ?, template = ?, config = ?, min_width = ?, min_height = ?, updated_at = CURRENT_TIMESTAMP${hasContextSchema ? ", context_schema = ?" : ""} 
      WHERE id = ?
    `)
			.run(
				cw.name ?? current.name,
				cw.description ?? current.description ?? null,
				cw.data_source_id ?? current.data_source_id,
				cw.displayType ?? current.displayType,
				cw.template ?? current.template ?? null,
				cw.config ?? current.config,
				cw.min_width ?? current.min_width,
				cw.min_height ?? current.min_height,
				...(hasContextSchema
					? [cw.context_schema ?? current.context_schema ?? null]
					: []),
				id,
			);
	}

	async delete(id: number): Promise<void> {
		this.db.query("DELETE FROM custom_widgets WHERE id = ?").run(id);
	}
}
