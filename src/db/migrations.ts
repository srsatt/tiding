import type { Database } from "bun:sqlite";
import * as fs from "node:fs";
import * as nodePath from "node:path";

export interface AdditiveMigration {
	name: string;
	statements: string[];
}

export interface MigrationResult {
	backupPath: string;
	applied: string[];
}

function timestampForPath(date: Date) {
	const pad = (value: number) => String(value).padStart(2, "0");
	return [
		date.getFullYear(),
		pad(date.getMonth() + 1),
		pad(date.getDate()),
		"-",
		pad(date.getHours()),
		pad(date.getMinutes()),
		pad(date.getSeconds()),
	].join("");
}

function assertFileBackedDatabase(dbPath: string) {
	if (dbPath === ":memory:") {
		throw new Error(
			"Cannot create a migration backup for an in-memory database",
		);
	}
	if (!fs.existsSync(dbPath)) {
		throw new Error(`Cannot migrate missing database: ${dbPath}`);
	}
}

function assertAdditiveStatement(statement: string) {
	const normalized = statement.trim().replace(/\s+/g, " ");
	const allowed =
		/^ALTER TABLE ["'\w]+ ADD COLUMN /i.test(normalized) ||
		/^CREATE (UNIQUE )?INDEX IF NOT EXISTS /i.test(normalized) ||
		/^CREATE TABLE IF NOT EXISTS /i.test(normalized);
	if (!allowed) {
		throw new Error(`Refusing non-additive migration statement: ${statement}`);
	}
}

export function createTimestampedBackup(
	dbPath: string,
	now = new Date(),
): string {
	assertFileBackedDatabase(dbPath);
	const backupDir = nodePath.join(nodePath.dirname(dbPath), "backups");
	fs.mkdirSync(backupDir, { recursive: true });
	const backupPath = nodePath.join(
		backupDir,
		`${timestampForPath(now)}-${nodePath.basename(dbPath)}`,
	);
	fs.copyFileSync(dbPath, backupPath, fs.constants.COPYFILE_EXCL);
	return backupPath;
}

export function runAdditiveMigrations(
	db: Database,
	dbPath: string,
	migrations: AdditiveMigration[],
	options: { now?: Date } = {},
): MigrationResult {
	const statements = migrations.flatMap((migration) => migration.statements);
	for (const statement of statements) assertAdditiveStatement(statement);

	const backupPath = createTimestampedBackup(dbPath, options.now);
	db.transaction(() => {
		for (const statement of statements) db.query(statement).run();
	})();

	return {
		backupPath,
		applied: migrations.map((migration) => migration.name),
	};
}
