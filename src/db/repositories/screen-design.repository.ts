import type { Database } from "bun:sqlite";

export interface ScreenDesign {
	id: number;
	name: string;
	description?: string | null;
	width: number;
	height: number;
	background: string;
	is_template: boolean;
	created_at: string;
	updated_at: string;
}

export class ScreenDesignRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<ScreenDesign[]> {
		return this.db
			.query(
				"SELECT id, name, description, width, height, background, is_template, created_at, updated_at FROM screen_designs",
			)
			.all() as ScreenDesign[];
	}

	async findById(id: number): Promise<ScreenDesign | null> {
		const row = this.db
			.query(
				"SELECT id, name, description, width, height, background, is_template, created_at, updated_at FROM screen_designs WHERE id = ?",
			)
			.get(id);
		return row as ScreenDesign | null;
	}

	async create(
		name: string,
		description?: string,
		options: { width?: number; height?: number; background?: string } = {},
	): Promise<number> {
		const result = this.db
			.query(
				"INSERT INTO screen_designs (name, description, width, height, background, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				name,
				description ?? null,
				options.width ?? 800,
				options.height ?? 480,
				options.background ?? "#FFFFFF",
			);
		return Number(result.lastInsertRowid);
	}

	async update(
		id: number,
		name?: string,
		description?: string,
		background?: string,
		width?: number,
		height?: number,
	): Promise<void> {
		// We fetch current values to avoid NULL constraints on non-provided fields if we use simple UPDATE
		const current = await this.findById(id);
		if (!current) throw new Error("Screen design not found");

		this.db
			.query(
				"UPDATE screen_designs SET name = ?, description = ?, width = ?, height = ?, background = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			)
			.run(
				name ?? current.name,
				description ?? current.description ?? null,
				width ?? current.width,
				height ?? current.height,
				background ?? current.background,
				id,
			);
	}

	async delete(id: number): Promise<void> {
		this.db.query("DELETE FROM screen_designs WHERE id = ?").run(id);
	}
}
