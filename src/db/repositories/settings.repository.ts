import type { Database } from "bun:sqlite";

export interface Setting {
	id: number;
	key: string;
	value: string;
	created_at: string;
	updated_at: string;
}

export class SettingsRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<Setting[]> {
		return this.db
			.query("SELECT * FROM settings ORDER BY key ASC")
			.all() as Setting[];
	}

	async get(key: string): Promise<string | null> {
		const row = this.db
			.query("SELECT value FROM settings WHERE key = ?")
			.get(key) as {
			value: string;
		} | null;
		return row?.value ?? null;
	}

	async set(key: string, value: string): Promise<void> {
		this.db
			.query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `)
			.run(key, value);
	}

	async getInteger(key: string, fallback: number): Promise<number> {
		const value = await this.get(key);
		if (value === null) return fallback;
		const parsed = Number.parseInt(value, 10);
		return Number.isInteger(parsed) ? parsed : fallback;
	}
}
