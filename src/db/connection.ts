import { Database } from "bun:sqlite";
import {
	bootstrapObservedSchema,
	ensureDbParentDirectory,
	validateCompatibilitySchema,
} from "./schema";

export interface DbConnectionOptions {
	bootstrap?: boolean;
}

export class DbConnection {
	private db: Database;

	constructor(path: string, options: DbConnectionOptions = {}) {
		ensureDbParentDirectory(path);
		this.db = new Database(path);
		this.initialize(options);
	}

	private initialize(options: DbConnectionOptions) {
		this.db.query("PRAGMA busy_timeout = 5000").run();
		this.db.query("PRAGMA journal_mode = WAL").get();
		this.db.query("PRAGMA foreign_keys = ON").run();

		if (options.bootstrap) {
			bootstrapObservedSchema(this.db);
		}

		const validation = validateCompatibilitySchema(this.db);
		if (!validation.ok) {
			throw new Error(
				`Unsupported database schema: missing tables ${validation.missingTables.join(", ") || "none"}; missing columns ${JSON.stringify(validation.missingColumns)}`,
			);
		}
	}

	get connection() {
		return this.db;
	}

	close() {
		this.db.close();
	}
}

export const createDbConnection = (
	path: string,
	options: DbConnectionOptions = {},
) => new DbConnection(path, options);
