import {
	createDbConnection,
	type DbConnection,
	type DbConnectionOptions,
} from "./connection";
import { CustomWidgetRepository } from "./repositories/custom-widget.repository";
import { DataSourceRepository } from "./repositories/data-source.repository";
import { DeviceRepository } from "./repositories/device.repository";
import { FirmwareRepository } from "./repositories/firmware.repository";
import { PlaylistRepository } from "./repositories/playlist.repository";
import { ScreenDesignRepository } from "./repositories/screen-design.repository";
import { SettingsRepository } from "./repositories/settings.repository";
import { WidgetRepository } from "./repositories/widget.repository";
import { WidgetTemplateRepository } from "./repositories/widget-template.repository";
import { compatibilitySchemaReport } from "./schema";

export class DatabaseService {
	private connection: DbConnection;
	public screens: ScreenDesignRepository;
	public widgets: WidgetRepository;
	public dataSources: DataSourceRepository;
	public customWidgets: CustomWidgetRepository;
	public templates: WidgetTemplateRepository;
	public devices: DeviceRepository;
	public firmware: FirmwareRepository;
	public settings: SettingsRepository;
	public playlists: PlaylistRepository;

	constructor(dbPath: string, options: DbConnectionOptions = {}) {
		this.connection = createDbConnection(dbPath, options);
		const db = this.connection.connection;
		this.screens = new ScreenDesignRepository(db);
		this.widgets = new WidgetRepository(db);
		this.dataSources = new DataSourceRepository(db);
		this.customWidgets = new CustomWidgetRepository(db);
		this.templates = new WidgetTemplateRepository(db);
		this.devices = new DeviceRepository(db);
		this.firmware = new FirmwareRepository(db);
		this.settings = new SettingsRepository(db);
		this.playlists = new PlaylistRepository(db);
	}

	close() {
		this.connection.close();
	}

	schemaReport() {
		return compatibilitySchemaReport(this.connection.connection);
	}
}
