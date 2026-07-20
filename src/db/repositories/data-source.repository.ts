import type { Database } from "bun:sqlite";

export interface DataSource {
	id: number;
	name: string;
	description?: string | null;
	type: string;
	url: string;
	method: string;
	headers?: string | null; // JSON
	body?: unknown;
	request_body?: unknown;
	payload?: unknown;
	context_schema?: string | null;
	refresh_interval: number;
	json_path?: string | null;
	is_active: boolean;
	last_fetched_at?: string | null;
	last_data?: unknown; // JSONB can return strings, numbers, booleans, objects, or null.
	last_error?: string | null;
	created_at: string;
	updated_at: string;
}

export class DataSourceRepository {
	constructor(private db: Database) {}

	private requestBodyValue(ds: Partial<DataSource>) {
		const body = ds.body ?? ds.request_body ?? ds.payload;
		if (body === undefined || body === null) return null;
		return typeof body === "string" ? body : JSON.stringify(body);
	}

	private columnNames() {
		return new Set(
			this.db
				.query("PRAGMA table_info(data_sources)")
				.all()
				.map((row) => (row as { name: string }).name),
		);
	}

	private requestBodyColumn() {
		const columns = this.columnNames();
		return ["body", "request_body", "payload"].find((column) =>
			columns.has(column),
		);
	}

	private hasColumn(name: string) {
		return this.columnNames().has(name);
	}

	async findAll(): Promise<DataSource[]> {
		return this.db.query("SELECT * FROM data_sources").all() as DataSource[];
	}

	async findById(id: number): Promise<DataSource | null> {
		const row = this.db
			.query("SELECT * FROM data_sources WHERE id = ?")
			.get(id);
		return row as DataSource | null;
	}

	async usageCounts(): Promise<Map<number, number>> {
		return new Map(
			this.db
				.query(`
					SELECT data_source_id, COUNT(*) AS count
					FROM custom_widgets
					GROUP BY data_source_id
				`)
				.all()
				.map((row) => {
					const typed = row as { data_source_id: number; count: number };
					return [typed.data_source_id, typed.count];
				}),
		);
	}

	async create(ds: Partial<DataSource>): Promise<number> {
		if (!ds.name || !ds.url) throw new Error("name and url are required");

		const bodyColumn = this.requestBodyColumn();
		const hasContextSchema = this.hasColumn("context_schema");
		if (bodyColumn) {
			const result = this.db
				.query(`
      INSERT INTO data_sources (name, description, type, url, method, headers, ${bodyColumn}, refresh_interval, json_path, is_active, updated_at${hasContextSchema ? ", context_schema" : ""}) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP${hasContextSchema ? ", ?" : ""})
			`)
				.run(
					ds.name,
					ds.description ?? null,
					ds.type || "http",
					ds.url,
					ds.method || "GET",
					ds.headers ?? null,
					this.requestBodyValue(ds),
					ds.refresh_interval || 300,
					ds.json_path ?? null,
					ds.is_active ?? true,
					...(hasContextSchema ? [ds.context_schema ?? null] : []),
				);
			return Number(result.lastInsertRowid);
		}

		const result = this.db
			.query(`
      INSERT INTO data_sources (name, description, type, url, method, headers, refresh_interval, json_path, is_active, updated_at${hasContextSchema ? ", context_schema" : ""}) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP${hasContextSchema ? ", ?" : ""})
			`)
			.run(
				ds.name,
				ds.description ?? null,
				ds.type || "http",
				ds.url,
				ds.method || "GET",
				ds.headers ?? null,
				ds.refresh_interval || 300,
				ds.json_path ?? null,
				ds.is_active ?? true,
				...(hasContextSchema ? [ds.context_schema ?? null] : []),
			);
		return Number(result.lastInsertRowid);
	}

	async update(id: number, ds: Partial<DataSource>): Promise<void> {
		const current = await this.findById(id);
		if (!current) throw new Error("Data source not found");

		const bodyColumn = this.requestBodyColumn();
		const hasContextSchema = this.hasColumn("context_schema");
		if (bodyColumn) {
			this.db
				.query(`
      UPDATE data_sources 
      SET name = ?, description = ?, type = ?, url = ?, method = ?, headers = ?, ${bodyColumn} = ?, refresh_interval = ?, json_path = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP${hasContextSchema ? ", context_schema = ?" : ""} 
      WHERE id = ?
    `)
				.run(
					ds.name ?? current.name,
					ds.description ?? current.description ?? null,
					ds.type ?? current.type,
					ds.url ?? current.url,
					ds.method ?? current.method,
					ds.headers ?? current.headers ?? null,
					this.requestBodyValue(ds) ??
						this.requestBodyValue(current as Partial<DataSource>),
					ds.refresh_interval ?? current.refresh_interval,
					ds.json_path ?? current.json_path ?? null,
					ds.is_active ?? current.is_active,
					...(hasContextSchema
						? [ds.context_schema ?? current.context_schema ?? null]
						: []),
					id,
				);
			return;
		}

		this.db
			.query(`
      UPDATE data_sources 
      SET name = ?, description = ?, type = ?, url = ?, method = ?, headers = ?, refresh_interval = ?, json_path = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP${hasContextSchema ? ", context_schema = ?" : ""} 
      WHERE id = ?
    `)
			.run(
				ds.name ?? current.name,
				ds.description ?? current.description ?? null,
				ds.type ?? current.type,
				ds.url ?? current.url,
				ds.method ?? current.method,
				ds.headers ?? current.headers ?? null,
				ds.refresh_interval ?? current.refresh_interval,
				ds.json_path ?? current.json_path ?? null,
				ds.is_active ?? current.is_active,
				...(hasContextSchema
					? [ds.context_schema ?? current.context_schema ?? null]
					: []),
				id,
			);
	}

	async updateCache(
		id: number,
		data: string | null,
		error: string | null,
	): Promise<void> {
		if (error) {
			this.db
				.query(`
        UPDATE data_sources 
        SET last_error = ?, last_fetched_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `)
				.run(error, id);
			return;
		}

		this.db
			.query(`
      UPDATE data_sources 
      SET last_data = ?, last_error = NULL, last_fetched_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
			.run(data, id);
	}

	async delete(id: number): Promise<void> {
		this.db.query("DELETE FROM data_sources WHERE id = ?").run(id);
	}
}
