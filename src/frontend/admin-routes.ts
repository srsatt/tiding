import { t } from "ttag";
import type { DatabaseService } from "../db";
import { defineRoute, matchRoute } from "./router";
import {
	renderCustomWidgetEditorPage,
	renderCustomWidgetsPage,
	renderNewCustomWidgetPage,
} from "./routes/custom-widgets";
import { renderDashboardPage } from "./routes/dashboard";
import {
	renderDataSourceEditorPage,
	renderDataSourcesPage,
	renderNewDataSourcePage,
} from "./routes/data-sources";
import { renderDeviceDetailPage } from "./routes/device-detail";
import { renderDevicesPage, renderNewDevicePage } from "./routes/devices";
import { renderExtensionsPage } from "./routes/extensions";
import { renderNewPlaylistPage } from "./routes/playlist-new";
import {
	renderPlaylistDetailPage,
	renderPlaylistsPage,
} from "./routes/playlists";
import { renderPluginsPage } from "./routes/plugins";
import { renderScreenDesignerPage } from "./routes/screen-designer";
import { renderScreenEditorPage } from "./routes/screen-editor";
import { renderNewScreenPage, renderScreensPage } from "./routes/screens";
import { renderSettingsPage } from "./routes/settings";
import {
	renderNewWidgetPage,
	renderWidgetEditorPage,
} from "./routes/widget-pages";
import type { AdminPageOptions } from "./types";

type RouteContext = {
	url: URL;
	db: DatabaseService;
	options: AdminPageOptions;
};

type RouteResult = Promise<string | Response | null> | string | Response | null;

function id(value: string) {
	return Number.parseInt(value, 10);
}

function route(
	pattern: string,
	render: Parameters<typeof defineRoute<RouteContext, RouteResult>>[1],
) {
	return defineRoute<RouteContext, RouteResult>(pattern, render);
}

const adminRoutes = [
	route("/dashboard", ({ db }) => renderDashboardPage(db)),
	route("/screens", ({ db, options }) =>
		renderScreensPage(db, options.cachePath),
	),
	route("/screens/new", () => renderNewScreenPage()),
	route("/screens/designer/:screenId", ({ db, match }) =>
		renderScreenDesignerPage(db, id(match.screenId)),
	),
	route("/screens/widgets/new", ({ db, url }) => {
		const screenId = Number.parseInt(
			url.searchParams.get("screenId") || "",
			10,
		);
		if (!Number.isInteger(screenId) || screenId <= 0) {
			return new Response(t`Missing screenId`, { status: 400 });
		}
		return renderNewWidgetPage(db, screenId);
	}),
	route("/screens/widgets/:widgetId", ({ db, match }) =>
		renderWidgetEditorPage(db, id(match.widgetId)),
	),
	route("/screens/:screenId", ({ db, match }) =>
		renderScreenEditorPage(db, id(match.screenId)),
	),
	route("/devices", ({ db, url }) => renderDevicesPage(db, url.searchParams)),
	route("/devices/new", ({ db, options }) => renderNewDevicePage(db, options)),
	route("/devices/:deviceId", ({ db, match }) =>
		renderDeviceDetailPage(db, id(match.deviceId)),
	),
	route("/playlists", ({ db }) => renderPlaylistsPage(db)),
	route("/playlists/new", () => renderNewPlaylistPage()),
	route("/playlists/:playlistId", ({ db, match, url }) =>
		renderPlaylistDetailPage(db, id(match.playlistId), url.searchParams),
	),
	route("/data-sources", ({ db }) => renderDataSourcesPage(db)),
	route("/data-sources/new", () => renderNewDataSourcePage()),
	route("/data-sources/:sourceId", ({ db, match }) =>
		renderDataSourceEditorPage(db, id(match.sourceId)),
	),
	route("/custom-widgets", ({ db }) => renderCustomWidgetsPage(db)),
	route("/custom-widgets/new", ({ db, url }) =>
		renderNewCustomWidgetPage(
			db,
			Number.parseInt(url.searchParams.get("data_source_id") || "", 10),
		),
	),
	route("/custom-widgets/:widgetId", ({ db, match }) =>
		renderCustomWidgetEditorPage(db, id(match.widgetId)),
	),
	route("/extensions", ({ db }) => renderExtensionsPage(db)),
	route("/plugins", () => renderPluginsPage()),
	route("/settings", async ({ db, options }) =>
		renderSettingsPage(options, await db.settings.findAll(), db.schemaReport()),
	),
];

export async function renderAdminRoute(
	url: URL,
	db: DatabaseService,
	options: AdminPageOptions,
) {
	return matchRoute(adminRoutes, url.pathname, { url, db, options });
}
