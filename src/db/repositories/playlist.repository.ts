import type { Database } from "bun:sqlite";

export interface Playlist {
	id: number;
	name: string;
	description?: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface PlaylistItem {
	id: number;
	playlist_id: number;
	screen_id?: number | null;
	screen_design_id?: number | null;
	kind: string;
	config?: string | null;
	order: number;
	duration: number;
	created_at: string;
	plugin_instance_id?: number | null;
}

export interface CurrentPlaylistScreen {
	item: PlaylistItem;
	screenDesignId: number;
	remainingSeconds: number;
}

export class PlaylistRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<Playlist[]> {
		return this.db
			.query("SELECT * FROM playlists ORDER BY id ASC")
			.all() as Playlist[];
	}

	async findById(id: number): Promise<Playlist | null> {
		const row = this.db.query("SELECT * FROM playlists WHERE id = ?").get(id);
		return row as Playlist | null;
	}

	async findItems(playlistId: number): Promise<PlaylistItem[]> {
		return this.db
			.query(
				'SELECT * FROM playlist_items WHERE playlist_id = ? ORDER BY "order" ASC, id ASC',
			)
			.all(playlistId) as PlaylistItem[];
	}

	async create(playlist: Partial<Playlist>): Promise<number> {
		if (!playlist.name) throw new Error("name is required");
		const result = this.db
			.query(`
				INSERT INTO playlists (name, description, is_active, updated_at)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
			`)
			.run(
				playlist.name,
				playlist.description ?? null,
				playlist.is_active ?? true,
			);
		return Number(result.lastInsertRowid);
	}

	async update(id: number, playlist: Partial<Playlist>): Promise<void> {
		const current = await this.findById(id);
		if (!current) throw new Error("Playlist not found");
		this.db
			.query(`
				UPDATE playlists
				SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`)
			.run(
				playlist.name ?? current.name,
				playlist.description ?? current.description ?? null,
				playlist.is_active ?? current.is_active,
				id,
			);
	}

	async delete(id: number): Promise<void> {
		this.db.query("DELETE FROM playlists WHERE id = ?").run(id);
	}

	async addItem(item: Partial<PlaylistItem>): Promise<number> {
		if (!item.playlist_id) throw new Error("playlist_id is required");
		if (!item.screen_design_id) throw new Error("screen_design_id is required");
		const result = this.db
			.query(`
				INSERT INTO playlist_items (playlist_id, screen_design_id, kind, "order", duration, config)
				VALUES (?, ?, ?, ?, ?, ?)
			`)
			.run(
				item.playlist_id,
				item.screen_design_id,
				item.kind || "screen",
				item.order ?? 0,
				item.duration ?? 60,
				item.config ?? null,
			);
		return Number(result.lastInsertRowid);
	}

	async deleteItem(id: number): Promise<void> {
		this.db.query("DELETE FROM playlist_items WHERE id = ?").run(id);
	}

	async updateItem(id: number, item: Partial<PlaylistItem>): Promise<void> {
		const current = this.db
			.query("SELECT * FROM playlist_items WHERE id = ?")
			.get(id) as PlaylistItem | null;
		if (!current) throw new Error("Playlist item not found");
		this.db
			.query(`
				UPDATE playlist_items
				SET screen_design_id = ?, kind = ?, "order" = ?, duration = ?, config = ?
				WHERE id = ?
			`)
			.run(
				item.screen_design_id ?? current.screen_design_id ?? null,
				item.kind ?? current.kind,
				item.order ?? current.order,
				item.duration ?? current.duration,
				item.config ?? current.config ?? null,
				id,
			);
	}

	async findCurrentScreenDesign(
		playlistId: number,
		nowMs = Date.now(),
	): Promise<CurrentPlaylistScreen | null> {
		const playlist = await this.findById(playlistId);
		if (!playlist?.is_active) return null;

		const items = (await this.findItems(playlistId)).filter(
			(item) =>
				item.kind === "screen" &&
				item.screen_design_id !== undefined &&
				item.screen_design_id !== null,
		);
		if (items.length === 0) return null;

		const durations = items.map((item) => Math.max(1, item.duration || 1));
		const totalDuration = durations.reduce(
			(sum, duration) => sum + duration,
			0,
		);
		const position = Math.floor(nowMs / 1000) % totalDuration;
		let elapsed = 0;

		for (let index = 0; index < items.length; index += 1) {
			const duration = durations[index];
			if (position < elapsed + duration) {
				return {
					item: items[index],
					screenDesignId: Number(items[index].screen_design_id),
					remainingSeconds: elapsed + duration - position,
				};
			}
			elapsed += duration;
		}

		const last = items.at(-1);
		if (!last) return null;
		return {
			item: last,
			screenDesignId: Number(last.screen_design_id),
			remainingSeconds: 1,
		};
	}
}
