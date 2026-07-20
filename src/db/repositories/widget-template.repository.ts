import type { Database } from "bun:sqlite";

export interface WidgetTemplate {
	id: number;
	name: string;
	label: string;
	description?: string | null;
	category: string;
	defaultConfig: string; // JSON
	min_width: number;
	min_height: number;
	created_at: string;
}

export class WidgetTemplateRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<WidgetTemplate[]> {
		return this.db
			.query("SELECT * FROM widget_templates")
			.all() as WidgetTemplate[];
	}

	async findById(id: number): Promise<WidgetTemplate | null> {
		const row = this.db
			.query("SELECT * FROM widget_templates WHERE id = ?")
			.get(id);
		return row as WidgetTemplate | null;
	}
}
