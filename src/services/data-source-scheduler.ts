import type { DatabaseService } from "../db";

type RefreshSource = (id: number) => Promise<unknown>;

function isActive(value: unknown) {
	return value === true || value === 1 || value === "1";
}

function fetchedAtMs(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string" || !value.trim()) return null;
	const trimmed = value.trim();
	if (/^\d+$/.test(trimmed)) {
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : null;
	}
	const sqliteUtc = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)
		? `${trimmed.replace(" ", "T")}Z`
		: trimmed;
	const parsed = Date.parse(sqliteUtc);
	return Number.isFinite(parsed) ? parsed : null;
}

export function isDataSourceDue(
	lastFetchedAt: unknown,
	refreshIntervalSeconds: number,
	now = Date.now(),
) {
	const fetchedAt = fetchedAtMs(lastFetchedAt);
	if (fetchedAt === null) return true;
	const intervalMs = Math.max(1, refreshIntervalSeconds || 300) * 1000;
	return now - fetchedAt >= intervalMs;
}

export async function refreshDueDataSources(
	db: Pick<DatabaseService, "dataSources">,
	refreshSource: RefreshSource,
	now = Date.now(),
) {
	const sources = await db.dataSources.findAll();
	for (const source of sources) {
		if (!isActive(source.is_active)) continue;
		if (
			!isDataSourceDue(source.last_fetched_at, source.refresh_interval, now)
		) {
			continue;
		}
		await refreshSource(source.id);
	}
}

export class DataSourceScheduler {
	private timer: ReturnType<typeof setInterval> | null = null;
	private running = false;

	constructor(
		private db: Pick<DatabaseService, "dataSources">,
		private refreshSource: RefreshSource,
		private pollIntervalMs = 10_000,
	) {}

	private async tick() {
		if (this.running) return;
		this.running = true;
		try {
			await refreshDueDataSources(this.db, this.refreshSource);
		} catch (error) {
			console.error("Data source scheduler failed", error);
		} finally {
			this.running = false;
		}
	}

	start() {
		if (this.timer) return;
		void this.tick();
		this.timer = setInterval(
			() => void this.tick(),
			Math.max(1_000, this.pollIntervalMs),
		);
	}

	stop() {
		if (!this.timer) return;
		clearInterval(this.timer);
		this.timer = null;
	}
}
