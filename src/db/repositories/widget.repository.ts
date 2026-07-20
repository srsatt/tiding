import type { Database } from "bun:sqlite";

export interface Widget {
	id: number;
	screen_design_id: number;
	template_id: number;
	x: number;
	y: number;
	width: number;
	height: number;
	config: string; // JSON
	z_index: number;
	created_at: string;
	updated_at: string;
}

export class WidgetRepository {
	constructor(private db: Database) {}

	async findByScreenDesign(screenDesignId: number): Promise<Widget[]> {
		return this.db
			.query(
				"SELECT * FROM screen_widgets WHERE screen_design_id = ? ORDER BY z_index ASC",
			)
			.all(screenDesignId) as Widget[];
	}

	async findById(id: number): Promise<Widget | null> {
		const row = this.db
			.query("SELECT * FROM screen_widgets WHERE id = ?")
			.get(id);
		return row as Widget | null;
	}

	async findByCustomWidgetId(customWidgetId: number): Promise<Widget[]> {
		return (
			this.db.query("SELECT * FROM screen_widgets").all() as Widget[]
		).filter((widget) => {
			try {
				const config = JSON.parse(widget.config || "{}") as {
					customWidgetId?: number | string;
				};
				return Number(config.customWidgetId) === customWidgetId;
			} catch {
				return false;
			}
		});
	}

	async create(widget: Partial<Widget>): Promise<number> {
		if (
			widget.screen_design_id === undefined ||
			widget.template_id === undefined
		) {
			throw new Error("screen_design_id and template_id are required");
		}

		const result = this.db
			.query(`
      INSERT INTO screen_widgets (screen_design_id, template_id, x, y, width, height, config, z_index, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
			.run(
				widget.screen_design_id,
				widget.template_id,
				widget.x ?? 0,
				widget.y ?? 0,
				widget.width ?? 200,
				widget.height ?? 100,
				widget.config ?? "{}",
				widget.z_index ?? 0,
			);
		return Number(result.lastInsertRowid);
	}

	async update(id: number, widget: Partial<Widget>): Promise<void> {
		const current = await this.findById(id);
		if (!current) throw new Error("Widget not found");

		this.db
			.query(`
      UPDATE screen_widgets 
      SET x = ?, y = ?, width = ?, height = ?, config = ?, z_index = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
			.run(
				widget.x ?? current.x,
				widget.y ?? current.y,
				widget.width ?? current.width,
				widget.height ?? current.height,
				widget.config ?? current.config,
				widget.z_index ?? current.z_index,
				id,
			);
	}

	async delete(id: number): Promise<void> {
		this.db.query("DELETE FROM screen_widgets WHERE id = ?").run(id);
	}
}
