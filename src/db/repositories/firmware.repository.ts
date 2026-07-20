import type { Database } from "bun:sqlite";

export interface Firmware {
	id: number;
	version: string;
	download_url: string;
	release_notes?: string | null;
	is_stable: boolean | number;
	created_at: string | number;
}

export class FirmwareRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<Firmware[]> {
		return this.db
			.query(
				"SELECT id, version, download_url, release_notes, is_stable, created_at FROM firmware ORDER BY id ASC",
			)
			.all() as Firmware[];
	}

	async findById(id: number): Promise<Firmware | null> {
		const row = this.db
			.query(
				"SELECT id, version, download_url, release_notes, is_stable, created_at FROM firmware WHERE id = ?",
			)
			.get(id);
		return row as Firmware | null;
	}
}
