import type { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";

type DeviceBinding = string | number | boolean | null;

export interface Device {
	id: number;
	label: string;
	friendly_id?: string | null;
	mac_address: string;
	api_key: string;
	firmware_version?: string | null;
	model_id?: number | null;
	playlist_id?: number | null;
	is_active: boolean;
	wifi: number;
	battery: number;
	refresh_rate: number;
	image_timeout: number;
	proxy?: boolean;
	firmware_update: boolean;
	width: number;
	height: number;
	sleep_start_at?: string | null;
	sleep_stop_at?: string | null;
	last_seen_at?: string | null;
	refresh_pending: boolean;
	last_screen_id?: string | null;
	screen_started_at?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface DeviceScreenAssignment {
	id: number;
	device_id: number;
	screen_design_id: number;
	is_active: boolean;
	created_at: string;
}

export interface DeviceLog {
	id: number;
	device_id: number;
	level: string;
	message: string;
	metadata?: string | null;
	created_at: string;
}

export interface FirmwareArtifact {
	id: number;
	version: string;
	download_url: string;
	release_notes?: string | null;
	is_stable: boolean;
	created_at: string;
}

export class DeviceRepository {
	constructor(private db: Database) {}

	private selectColumns() {
		return "id, label, friendly_id, mac_address, api_key, firmware_version, model_id, playlist_id, is_active, wifi, battery, refresh_rate, image_timeout, proxy, firmware_update, width, height, sleep_start_at, sleep_stop_at, last_seen_at, refresh_pending, last_screen_id, screen_started_at, created_at, updated_at";
	}

	private tableExists(table: string) {
		return Boolean(
			this.db
				.query(
					"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
				)
				.get(table),
		);
	}

	private columnNames(table: string) {
		if (!this.tableExists(table)) return new Set<string>();
		return new Set(
			this.db
				.query(`PRAGMA table_info(${table})`)
				.all()
				.map((row) => (row as { name: string }).name),
		);
	}

	async findByHttpId(httpId: string): Promise<Device | null> {
		const row = this.db
			.query(
				`SELECT ${this.selectColumns()} FROM devices WHERE mac_address = ? OR friendly_id = ? OR api_key = ? LIMIT 1`,
			)
			.get(httpId, httpId, httpId);
		return row as Device | null;
	}

	async findAll(): Promise<Device[]> {
		return this.db
			.query(`SELECT ${this.selectColumns()} FROM devices ORDER BY id ASC`)
			.all() as Device[];
	}

	async findById(id: number): Promise<Device | null> {
		const row = this.db
			.query(`SELECT ${this.selectColumns()} FROM devices WHERE id = ?`)
			.get(id);
		return row as Device | null;
	}

	async findByPlaylistId(playlistId: number): Promise<Device[]> {
		return this.db
			.query(
				`SELECT ${this.selectColumns()} FROM devices WHERE playlist_id = ? ORDER BY id ASC`,
			)
			.all(playlistId) as Device[];
	}

	async updatePlaylist(
		deviceId: number,
		playlistId: number | null,
	): Promise<void> {
		this.db
			.query(
				"UPDATE devices SET playlist_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			)
			.run(playlistId, deviceId);
	}

	async updateLabel(deviceId: number, label: string): Promise<void> {
		this.db
			.query(
				"UPDATE devices SET label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			)
			.run(label, deviceId);
	}

	async delete(deviceId: number): Promise<void> {
		this.db.query("DELETE FROM devices WHERE id = ?").run(deviceId);
	}

	async createManualDevice(input: {
		label: string;
		macAddress: string;
		playlistId?: number | null;
		width?: number;
		height?: number;
	}): Promise<number> {
		const apiKey = randomBytes(32).toString("base64url");
		const friendlyId = input.label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 32);
		const result = this.db
			.query(
				"INSERT INTO devices (label, friendly_id, mac_address, api_key, playlist_id, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, ?, true, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
			)
			.run(
				input.label,
				friendlyId || null,
				input.macAddress,
				apiKey,
				input.playlistId ?? null,
				900,
				0,
				input.width ?? 800,
				input.height ?? 480,
			);
		return Number(result.lastInsertRowid);
	}

	async createSetupDevice(macAddress: string): Promise<Device> {
		const existing = await this.findByHttpId(macAddress);
		if (existing) return existing;

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const apiKey = randomBytes(32).toString("base64url");
			const friendlyId = `tiding-${randomBytes(3).toString("hex")}`;
			try {
				this.db
					.query(
						"INSERT INTO devices (label, friendly_id, mac_address, api_key, is_active, refresh_rate, image_timeout, firmware_update, width, height, updated_at) VALUES (?, ?, ?, ?, true, ?, ?, false, ?, ?, CURRENT_TIMESTAMP)",
					)
					.run(friendlyId, friendlyId, macAddress, apiKey, 900, 0, 800, 480);
				const created = await this.findByHttpId(macAddress);
				if (created) return created;
			} catch (error) {
				if (!/unique/i.test(error instanceof Error ? error.message : "")) {
					throw error;
				}
			}
		}

		throw new Error("Unable to create setup device");
	}

	async isBlocked(
		httpId: string,
		macAddress?: string | null,
	): Promise<boolean> {
		if (!this.tableExists("blocked_devices")) return false;
		const row = this.db
			.query(
				"SELECT id FROM blocked_devices WHERE mac_address = ? OR mac_address = ? LIMIT 1",
			)
			.get(httpId, macAddress ?? httpId);
		return Boolean(row);
	}

	async findActiveScreenAssignment(
		deviceId: number,
	): Promise<DeviceScreenAssignment | null> {
		const row = this.db
			.query(
				"SELECT id, device_id, screen_design_id, is_active, created_at FROM device_screen_assignments WHERE device_id = ? AND is_active = true ORDER BY id DESC LIMIT 1",
			)
			.get(deviceId);
		return row as DeviceScreenAssignment | null;
	}

	async findScreenAssignments(
		deviceId: number,
	): Promise<DeviceScreenAssignment[]> {
		return this.db
			.query(
				"SELECT id, device_id, screen_design_id, is_active, created_at FROM device_screen_assignments WHERE device_id = ? ORDER BY is_active DESC, id DESC",
			)
			.all(deviceId) as DeviceScreenAssignment[];
	}

	async findLogs(deviceId: number, limit = 50): Promise<DeviceLog[]> {
		if (!this.tableExists("device_logs")) return [];
		return this.db
			.query(
				"SELECT id, device_id, level, message, metadata, created_at FROM device_logs WHERE device_id = ? ORDER BY id DESC LIMIT ?",
			)
			.all(deviceId, Math.max(1, Math.min(200, limit))) as DeviceLog[];
	}

	async findLatestStableFirmware(): Promise<FirmwareArtifact | null> {
		if (!this.tableExists("firmware")) return null;
		const row = this.db
			.query(
				"SELECT id, version, download_url, release_notes, is_stable, created_at FROM firmware WHERE is_stable = true ORDER BY id DESC LIMIT 1",
			)
			.get();
		return row as FirmwareArtifact | null;
	}

	async markSeen(deviceId: number): Promise<void> {
		this.db
			.query("UPDATE devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
			.run(deviceId);
	}

	async updateTelemetry(
		deviceId: number,
		telemetry: {
			battery?: number;
			wifi?: number;
			firmwareVersion?: string;
		},
	): Promise<void> {
		const columns = this.columnNames("devices");
		const assignments: string[] = [];
		const values: DeviceBinding[] = [];

		if (telemetry.battery !== undefined && columns.has("battery")) {
			assignments.push("battery = ?");
			values.push(telemetry.battery);
		}
		if (telemetry.wifi !== undefined && columns.has("wifi")) {
			assignments.push("wifi = ?");
			values.push(telemetry.wifi);
		}
		if (
			telemetry.firmwareVersion !== undefined &&
			columns.has("firmware_version")
		) {
			assignments.push("firmware_version = ?");
			values.push(telemetry.firmwareVersion);
		}
		if (assignments.length === 0) return;

		values.push(deviceId);
		this.db
			.query(`UPDATE devices SET ${assignments.join(", ")} WHERE id = ?`)
			.run(...values);
	}

	async updateDisplayState(
		deviceId: number,
		state: {
			screenId: number;
			clearRefreshPending: boolean;
			updateScreenStartedAt: boolean;
		},
	): Promise<void> {
		const columns = this.columnNames("devices");
		const assignments: string[] = [];
		const values: DeviceBinding[] = [];

		if (columns.has("last_screen_id")) {
			assignments.push("last_screen_id = ?");
			values.push(String(state.screenId));
		}
		if (state.updateScreenStartedAt && columns.has("screen_started_at")) {
			assignments.push("screen_started_at = CURRENT_TIMESTAMP");
		}
		if (state.clearRefreshPending && columns.has("refresh_pending")) {
			assignments.push("refresh_pending = false");
		}
		if (assignments.length === 0) return;

		values.push(deviceId);
		this.db
			.query(`UPDATE devices SET ${assignments.join(", ")} WHERE id = ?`)
			.run(...values);
	}

	async log(
		deviceId: number,
		level: string,
		message: string,
		metadata: unknown = null,
	): Promise<void> {
		if (!this.tableExists("device_logs")) return;
		this.db
			.query(
				"INSERT INTO device_logs (device_id, level, message, metadata) VALUES (?, ?, ?, ?)",
			)
			.run(
				deviceId,
				level,
				message,
				metadata === null ? null : JSON.stringify(metadata),
			);
	}
}
