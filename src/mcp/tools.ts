import {
	optionalInteger,
	optionalText,
	requireInteger,
	requireJsonString,
	requireText,
} from "../api/http";
import type { DatabaseService } from "../db";
import { fetchAndCacheDataSource } from "../services/data-source-fetch";
import type { RenderPreviewResult } from "../services/render-preview";
import { applyWelcomePlaylistToDevice } from "../services/welcome-screen";

export interface McpToolContext {
	db: DatabaseService;
	invalidateRender?: (screenId: number) => void;
	renderPreview?: (screenId: number) => Promise<RenderPreviewResult>;
	renderCustomWidgetPreview?: (customWidgetId: number) => Promise<Buffer>;
}

export const mcpToolDefinitions = [
	{
		name: "screen_designs.list",
		description: "List screen designs.",
		storyIds: ["ST-02", "ST-18", "ST-19"],
		inputSchema: { type: "object", additionalProperties: false },
	},
	{
		name: "screen_designs.get",
		description: "Get one screen design.",
		storyIds: ["ST-02", "ST-18", "ST-19"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "screen_designs.create",
		description: "Create a screen design.",
		storyIds: ["ST-02", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["name"],
			properties: {
				name: { type: "string", minLength: 1 },
				description: { type: "string" },
				width: { type: "integer", minimum: 1 },
				height: { type: "integer", minimum: 1 },
				background: { type: "string" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "screen_designs.update",
		description: "Update a screen design.",
		storyIds: ["ST-02", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				name: { type: "string" },
				description: { type: "string" },
				width: { type: "integer", minimum: 1 },
				height: { type: "integer", minimum: 1 },
				background: { type: "string" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "widgets.list",
		description: "List widgets for a screen design.",
		storyIds: ["ST-03", "ST-04", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["screen_design_id"],
			properties: { screen_design_id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "widgets.create",
		description: "Create a screen widget.",
		storyIds: ["ST-03", "ST-04", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["screen_design_id", "template_id"],
			properties: {
				screen_design_id: { type: "integer", minimum: 1 },
				template_id: { type: "integer", minimum: 1 },
				x: { type: "integer" },
				y: { type: "integer" },
				width: { type: "integer", minimum: 1 },
				height: { type: "integer", minimum: 1 },
				z_index: { type: "integer" },
				config: {},
			},
			additionalProperties: false,
		},
	},
	{
		name: "widgets.update",
		description: "Update a screen widget.",
		storyIds: ["ST-03", "ST-04", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				x: { type: "integer" },
				y: { type: "integer" },
				width: { type: "integer", minimum: 1 },
				height: { type: "integer", minimum: 1 },
				z_index: { type: "integer" },
				config: {},
			},
			additionalProperties: false,
		},
	},
	{
		name: "widgets.delete",
		description: "Delete a screen widget.",
		storyIds: ["ST-03", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "data_sources.list",
		description: "List data sources.",
		storyIds: ["ST-05", "ST-08", "ST-18", "ST-19"],
		inputSchema: { type: "object", additionalProperties: false },
	},
	{
		name: "data_sources.create",
		description: "Create a data source.",
		storyIds: ["ST-05", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["name", "url"],
			properties: {
				name: { type: "string", minLength: 1 },
				description: { type: "string" },
				type: { type: "string" },
				url: { type: "string", minLength: 1 },
				method: { type: "string" },
				headers: {},
				body: {},
				refresh_interval: { type: "integer", minimum: 1 },
				json_path: { type: "string" },
				context_schema: {},
				is_active: { type: "boolean" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "data_sources.update",
		description: "Update a data source.",
		storyIds: ["ST-05", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				name: { type: "string" },
				description: { type: "string" },
				type: { type: "string" },
				url: { type: "string" },
				method: { type: "string" },
				headers: {},
				body: {},
				refresh_interval: { type: "integer", minimum: 1 },
				json_path: { type: "string" },
				context_schema: {},
				is_active: { type: "boolean" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "data_sources.fetch",
		description: "Fetch and cache a data source.",
		storyIds: ["ST-05", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "custom_widgets.list",
		description: "List custom widgets.",
		storyIds: ["ST-06", "ST-07", "ST-08", "ST-18", "ST-19"],
		inputSchema: { type: "object", additionalProperties: false },
	},
	{
		name: "custom_widgets.get",
		description: "Get one custom widget.",
		storyIds: ["ST-06", "ST-07", "ST-08", "ST-18", "ST-19"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "custom_widgets.create",
		description: "Create a custom widget backed by a data source.",
		storyIds: ["ST-06", "ST-07", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["name", "data_source_id", "config"],
			properties: {
				name: { type: "string", minLength: 1 },
				description: { type: "string" },
				data_source_id: { type: "integer", minimum: 1 },
				displayType: { type: "string" },
				template: { type: "string" },
				config: {},
				context_schema: {},
				min_width: { type: "integer", minimum: 1 },
				min_height: { type: "integer", minimum: 1 },
			},
			additionalProperties: false,
		},
	},
	{
		name: "custom_widgets.update",
		description: "Update a custom widget and invalidate dependent screens.",
		storyIds: ["ST-06", "ST-07", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				name: { type: "string" },
				description: { type: "string" },
				data_source_id: { type: "integer", minimum: 1 },
				displayType: { type: "string" },
				template: { type: "string" },
				config: {},
				context_schema: {},
				min_width: { type: "integer", minimum: 1 },
				min_height: { type: "integer", minimum: 1 },
			},
			additionalProperties: false,
		},
	},
	{
		name: "custom_widgets.delete",
		description: "Delete a custom widget and invalidate dependent screens.",
		storyIds: ["ST-06", "ST-08", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "custom_widgets.render_preview",
		description: "Render a custom widget preview as a 1-bit BMP.",
		storyIds: ["ST-06", "ST-07", "ST-12", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "playlists.list",
		description: "List playlists.",
		storyIds: ["ST-09", "ST-18", "ST-19"],
		inputSchema: { type: "object", additionalProperties: false },
	},
	{
		name: "playlists.get",
		description: "Get one playlist with its ordered items.",
		storyIds: ["ST-09", "ST-18", "ST-19"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "playlists.create",
		description: "Create a playlist.",
		storyIds: ["ST-09", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["name"],
			properties: {
				name: { type: "string", minLength: 1 },
				description: { type: "string" },
				is_active: { type: "boolean" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "playlists.update",
		description: "Update a playlist.",
		storyIds: ["ST-09", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				name: { type: "string" },
				description: { type: "string" },
				is_active: { type: "boolean" },
			},
			additionalProperties: false,
		},
	},
	{
		name: "playlists.add_item",
		description: "Add a screen item to a playlist.",
		storyIds: ["ST-09", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["playlist_id", "screen_design_id"],
			properties: {
				playlist_id: { type: "integer", minimum: 1 },
				screen_design_id: { type: "integer", minimum: 1 },
				order: { type: "integer", minimum: 0 },
				duration: { type: "integer", minimum: 1 },
				config: {},
			},
			additionalProperties: false,
		},
	},
	{
		name: "playlists.update_item",
		description: "Update an ordered playlist item.",
		storyIds: ["ST-09", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				screen_design_id: { type: "integer", minimum: 1 },
				order: { type: "integer", minimum: 0 },
				duration: { type: "integer", minimum: 1 },
				config: {},
			},
			additionalProperties: false,
		},
	},
	{
		name: "playlists.delete_item",
		description: "Delete a playlist item.",
		storyIds: ["ST-09", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "devices.list",
		description: "List registered devices.",
		storyIds: ["ST-10", "ST-11", "ST-16", "ST-18", "ST-19"],
		inputSchema: { type: "object", additionalProperties: false },
	},
	{
		name: "devices.get",
		description: "Get one registered device.",
		storyIds: ["ST-10", "ST-11", "ST-16", "ST-18", "ST-19"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "devices.create_manual",
		description: "Create a manually registered device.",
		storyIds: ["ST-10", "ST-11", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["label", "mac_address"],
			properties: {
				label: { type: "string", minLength: 1 },
				mac_address: { type: "string", minLength: 1 },
				playlist_id: { type: ["integer", "null"], minimum: 1 },
				width: { type: "integer", minimum: 1 },
				height: { type: "integer", minimum: 1 },
			},
			additionalProperties: false,
		},
	},
	{
		name: "devices.update_label",
		description: "Update a device display label.",
		storyIds: ["ST-11", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id", "label"],
			properties: {
				id: { type: "integer", minimum: 1 },
				label: { type: "string", minLength: 1 },
			},
			additionalProperties: false,
		},
	},
	{
		name: "devices.assign_playlist",
		description: "Assign or clear a device playlist.",
		storyIds: ["ST-09", "ST-11", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				playlist_id: { type: ["integer", "null"], minimum: 1 },
			},
			additionalProperties: false,
		},
	},
	{
		name: "devices.logs",
		description: "List recent logs for a device.",
		storyIds: ["ST-11", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", minimum: 1 },
				limit: { type: "integer", minimum: 1, maximum: 200 },
			},
			additionalProperties: false,
		},
	},
	{
		name: "devices.assignments",
		description: "List screen assignments for a device.",
		storyIds: ["ST-11", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "devices.delete",
		description: "Delete a registered device.",
		storyIds: ["ST-11", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "screen_designs.render_preview",
		description: "Render a screen preview as a 1-bit BMP artifact.",
		storyIds: ["ST-12", "ST-18"],
		inputSchema: {
			type: "object",
			required: ["id"],
			properties: { id: { type: "integer", minimum: 1 } },
			additionalProperties: false,
		},
	},
	{
		name: "health.status",
		description: "Inspect database, schema, and MCP tool health.",
		storyIds: ["ST-01", "ST-18", "ST-19"],
		inputSchema: { type: "object", additionalProperties: false },
	},
] as const;

export function isMcpAutoStartEnabled(env: Record<string, string | undefined>) {
	return env.TIDING_MCP === "1";
}

function argsRecord(args: unknown) {
	if (typeof args !== "object" || args === null || Array.isArray(args))
		return {};
	return args as Record<string, unknown>;
}

function integerArg(args: Record<string, unknown>, name: string) {
	const value = args[name];
	return requireInteger(
		typeof value === "number" || typeof value === "string" ? value : undefined,
		name,
	);
}

function optionalIntegerArg(args: Record<string, unknown>, name: string) {
	return optionalInteger(args[name], name);
}

function optionalNonNegativeIntegerArg(
	args: Record<string, unknown>,
	name: string,
) {
	return optionalInteger(args[name], name, { min: 0 });
}

function optionalNullableIntegerArg(
	args: Record<string, unknown>,
	name: string,
) {
	return args[name] === null ? null : optionalIntegerArg(args, name);
}

function booleanArg(value: unknown, fallback?: boolean) {
	if (value === undefined) return fallback;
	return value === true || value === 1 || value === "1" || value === "true";
}

function configArg(value: unknown) {
	if (typeof value === "object" && value !== null) return JSON.stringify(value);
	return requireJsonString(
		typeof value === "string" ? value : undefined,
		"config",
	);
}

function jsonArg(value: unknown, name: string) {
	if (value === undefined) return undefined;
	return requireJsonString(value, name);
}

function optionalJsonArg(value: unknown, name: string) {
	return value === undefined ? undefined : requireJsonString(value, name);
}

function requiredDataSourceId(
	args: Record<string, unknown>,
	context: McpToolContext,
) {
	const id = integerArg(args, "data_source_id");
	return context.db.dataSources.findById(id).then((source) => {
		if (!source) throw new Error("Data source not found");
		return id;
	});
}

async function invalidateCustomWidgetScreens(
	context: McpToolContext,
	customWidgetId: number,
) {
	const widgets = await context.db.widgets.findByCustomWidgetId(customWidgetId);
	for (const widget of widgets)
		context.invalidateRender?.(widget.screen_design_id);
}

async function requiredDeviceId(
	args: Record<string, unknown>,
	context: McpToolContext,
) {
	const id = integerArg(args, "id");
	if (!(await context.db.devices.findById(id))) {
		throw new Error("Device not found");
	}
	return id;
}

async function optionalExistingPlaylistId(
	args: Record<string, unknown>,
	context: McpToolContext,
) {
	const playlistId = optionalNullableIntegerArg(args, "playlist_id") ?? null;
	if (
		playlistId !== null &&
		!(await context.db.playlists.findById(playlistId))
	) {
		throw new Error("Playlist not found");
	}
	return playlistId;
}

export async function callMcpTool(
	context: McpToolContext,
	name: string,
	rawArgs: unknown = {},
) {
	const args = argsRecord(rawArgs);

	switch (name) {
		case "screen_designs.list":
			return await context.db.screens.findAll();

		case "screen_designs.get": {
			const id = integerArg(args, "id");
			const screen = await context.db.screens.findById(id);
			if (!screen) throw new Error("Screen not found");
			return screen;
		}

		case "screen_designs.create": {
			const id = await context.db.screens.create(
				requireText(args.name, "name"),
				optionalText(args.description),
				{
					width: optionalIntegerArg(args, "width"),
					height: optionalIntegerArg(args, "height"),
					background: optionalText(args.background),
				},
			);
			return await context.db.screens.findById(id);
		}

		case "screen_designs.update": {
			const id = integerArg(args, "id");
			await context.db.screens.update(
				id,
				optionalText(args.name),
				optionalText(args.description),
				optionalText(args.background),
				optionalIntegerArg(args, "width"),
				optionalIntegerArg(args, "height"),
			);
			context.invalidateRender?.(id);
			return await context.db.screens.findById(id);
		}

		case "widgets.list":
			return await context.db.widgets.findByScreenDesign(
				integerArg(args, "screen_design_id"),
			);

		case "widgets.create": {
			const screenDesignId = integerArg(args, "screen_design_id");
			const id = await context.db.widgets.create({
				screen_design_id: screenDesignId,
				template_id: integerArg(args, "template_id"),
				x: optionalNonNegativeIntegerArg(args, "x") ?? 0,
				y: optionalNonNegativeIntegerArg(args, "y") ?? 0,
				width: optionalIntegerArg(args, "width") ?? 200,
				height: optionalIntegerArg(args, "height") ?? 100,
				z_index: optionalNonNegativeIntegerArg(args, "z_index") ?? 0,
				config: configArg(args.config),
			});
			context.invalidateRender?.(screenDesignId);
			return { id };
		}

		case "widgets.update": {
			const id = integerArg(args, "id");
			const current = await context.db.widgets.findById(id);
			if (!current) throw new Error("Widget not found");
			await context.db.widgets.update(id, {
				x: optionalNonNegativeIntegerArg(args, "x"),
				y: optionalNonNegativeIntegerArg(args, "y"),
				width: optionalIntegerArg(args, "width"),
				height: optionalIntegerArg(args, "height"),
				z_index: optionalNonNegativeIntegerArg(args, "z_index"),
				config: args.config === undefined ? undefined : configArg(args.config),
			});
			context.invalidateRender?.(current.screen_design_id);
			return await context.db.widgets.findById(id);
		}

		case "widgets.delete": {
			const id = integerArg(args, "id");
			const current = await context.db.widgets.findById(id);
			if (!current) throw new Error("Widget not found");
			await context.db.widgets.delete(id);
			context.invalidateRender?.(current.screen_design_id);
			return { deleted: true };
		}

		case "data_sources.list":
			return await context.db.dataSources.findAll();

		case "data_sources.create": {
			const id = await context.db.dataSources.create({
				name: requireText(args.name, "name"),
				url: requireText(args.url, "url"),
				description: optionalText(args.description),
				type: optionalText(args.type),
				method: optionalText(args.method),
				headers: jsonArg(args.headers, "headers"),
				body: args.body,
				refresh_interval: optionalIntegerArg(args, "refresh_interval"),
				json_path: optionalText(args.json_path),
				context_schema: jsonArg(args.context_schema, "context_schema"),
				is_active: booleanArg(args.is_active, true),
			});
			return await context.db.dataSources.findById(id);
		}

		case "data_sources.update": {
			const id = integerArg(args, "id");
			const current = await context.db.dataSources.findById(id);
			if (!current) throw new Error("Data source not found");
			await context.db.dataSources.update(id, {
				name: optionalText(args.name),
				url: optionalText(args.url),
				description: optionalText(args.description),
				type: optionalText(args.type),
				method: optionalText(args.method),
				headers: jsonArg(args.headers, "headers"),
				body: args.body,
				refresh_interval: optionalIntegerArg(args, "refresh_interval"),
				json_path: optionalText(args.json_path),
				context_schema: jsonArg(args.context_schema, "context_schema"),
				is_active: booleanArg(args.is_active),
			});
			return await context.db.dataSources.findById(id);
		}

		case "data_sources.fetch":
			return await fetchAndCacheDataSource(
				context.db,
				integerArg(args, "id"),
				context.invalidateRender,
			);

		case "custom_widgets.list":
			return await context.db.customWidgets.findAll();

		case "custom_widgets.get": {
			const id = integerArg(args, "id");
			const widget = await context.db.customWidgets.findById(id);
			if (!widget) throw new Error("Custom widget not found");
			return widget;
		}

		case "custom_widgets.create": {
			const id = await context.db.customWidgets.create({
				name: requireText(args.name, "name"),
				description: optionalText(args.description),
				data_source_id: await requiredDataSourceId(args, context),
				displayType: optionalText(args.displayType),
				template: optionalText(args.template),
				config: configArg(args.config),
				context_schema: optionalJsonArg(args.context_schema, "context_schema"),
				min_width: optionalIntegerArg(args, "min_width"),
				min_height: optionalIntegerArg(args, "min_height"),
			});
			return await context.db.customWidgets.findById(id);
		}

		case "custom_widgets.update": {
			const id = integerArg(args, "id");
			const current = await context.db.customWidgets.findById(id);
			if (!current) throw new Error("Custom widget not found");
			await context.db.customWidgets.update(id, {
				name: optionalText(args.name),
				description: optionalText(args.description),
				data_source_id:
					args.data_source_id === undefined
						? undefined
						: await requiredDataSourceId(args, context),
				displayType: optionalText(args.displayType),
				template: optionalText(args.template),
				config: args.config === undefined ? undefined : configArg(args.config),
				context_schema: optionalJsonArg(args.context_schema, "context_schema"),
				min_width: optionalIntegerArg(args, "min_width"),
				min_height: optionalIntegerArg(args, "min_height"),
			});
			await invalidateCustomWidgetScreens(context, id);
			return await context.db.customWidgets.findById(id);
		}

		case "custom_widgets.delete": {
			const id = integerArg(args, "id");
			const current = await context.db.customWidgets.findById(id);
			if (!current) throw new Error("Custom widget not found");
			await invalidateCustomWidgetScreens(context, id);
			await context.db.customWidgets.delete(id);
			return { deleted: true };
		}

		case "custom_widgets.render_preview": {
			if (!context.renderCustomWidgetPreview) {
				throw new Error("Custom widget preview unavailable");
			}
			const id = integerArg(args, "id");
			if (!(await context.db.customWidgets.findById(id))) {
				throw new Error("Custom widget not found");
			}
			const image = await context.renderCustomWidgetPreview(id);
			return {
				contentType: "image/bmp",
				bytes: image.length,
				magic: image.subarray(0, 2).toString("ascii"),
			};
		}

		case "playlists.list":
			return await context.db.playlists.findAll();

		case "playlists.get": {
			const id = integerArg(args, "id");
			const playlist = await context.db.playlists.findById(id);
			if (!playlist) throw new Error("Playlist not found");
			return {
				...playlist,
				items: await context.db.playlists.findItems(id),
			};
		}

		case "playlists.create": {
			const id = await context.db.playlists.create({
				name: requireText(args.name, "name"),
				description: optionalText(args.description),
				is_active: booleanArg(args.is_active, true),
			});
			return await context.db.playlists.findById(id);
		}

		case "playlists.update": {
			const id = integerArg(args, "id");
			await context.db.playlists.update(id, {
				name: optionalText(args.name),
				description: optionalText(args.description),
				is_active: booleanArg(args.is_active),
			});
			return await context.db.playlists.findById(id);
		}

		case "playlists.add_item": {
			const playlistId = integerArg(args, "playlist_id");
			if (!(await context.db.playlists.findById(playlistId))) {
				throw new Error("Playlist not found");
			}
			const screenDesignId = integerArg(args, "screen_design_id");
			if (!(await context.db.screens.findById(screenDesignId))) {
				throw new Error("Screen not found");
			}
			const id = await context.db.playlists.addItem({
				playlist_id: playlistId,
				screen_design_id: screenDesignId,
				order: optionalNonNegativeIntegerArg(args, "order") ?? 0,
				duration: optionalIntegerArg(args, "duration") ?? 60,
				kind: "screen",
				config: optionalJsonArg(args.config, "config"),
			});
			return { id };
		}

		case "playlists.update_item": {
			const screenDesignId = optionalIntegerArg(args, "screen_design_id");
			if (
				screenDesignId !== undefined &&
				!(await context.db.screens.findById(screenDesignId))
			) {
				throw new Error("Screen not found");
			}
			const id = integerArg(args, "id");
			await context.db.playlists.updateItem(id, {
				screen_design_id: screenDesignId,
				order: optionalNonNegativeIntegerArg(args, "order"),
				duration: optionalIntegerArg(args, "duration"),
				kind: "screen",
				config: optionalJsonArg(args.config, "config"),
			});
			return { id };
		}

		case "playlists.delete_item": {
			const id = integerArg(args, "id");
			await context.db.playlists.deleteItem(id);
			return { deleted: true };
		}

		case "devices.list":
			return await context.db.devices.findAll();

		case "devices.get": {
			const id = integerArg(args, "id");
			const device = await context.db.devices.findById(id);
			if (!device) throw new Error("Device not found");
			return device;
		}

		case "devices.create_manual": {
			const playlistId = await optionalExistingPlaylistId(args, context);
			const id = await context.db.devices.createManualDevice({
				label: requireText(args.label, "label"),
				macAddress: requireText(args.mac_address, "mac_address"),
				playlistId,
				width: optionalIntegerArg(args, "width"),
				height: optionalIntegerArg(args, "height"),
			});
			if (playlistId === null)
				await applyWelcomePlaylistToDevice(context.db, id);
			return await context.db.devices.findById(id);
		}

		case "devices.update_label": {
			const id = await requiredDeviceId(args, context);
			await context.db.devices.updateLabel(
				id,
				requireText(args.label, "label"),
			);
			return await context.db.devices.findById(id);
		}

		case "devices.assign_playlist": {
			const id = await requiredDeviceId(args, context);
			const playlistId = await optionalExistingPlaylistId(args, context);
			await context.db.devices.updatePlaylist(id, playlistId);
			return await context.db.devices.findById(id);
		}

		case "devices.logs": {
			const id = await requiredDeviceId(args, context);
			return await context.db.devices.findLogs(
				id,
				optionalIntegerArg(args, "limit") ?? 50,
			);
		}

		case "devices.assignments": {
			const id = await requiredDeviceId(args, context);
			return await context.db.devices.findScreenAssignments(id);
		}

		case "devices.delete": {
			const id = await requiredDeviceId(args, context);
			await context.db.devices.delete(id);
			return { deleted: true };
		}

		case "screen_designs.render_preview": {
			if (!context.renderPreview) throw new Error("Render preview unavailable");
			return await context.renderPreview(integerArg(args, "id"));
		}

		case "health.status": {
			const [screens, dataSources] = await Promise.all([
				context.db.screens.findAll(),
				context.db.dataSources.findAll(),
			]);
			return {
				ok: true,
				storyIds: ["ST-18"],
				schema: context.db.schemaReport().ok,
				counts: {
					screens: screens.length,
					dataSources: dataSources.length,
					tools: mcpToolDefinitions.length,
				},
			};
		}

		default:
			throw new Error(`Unknown MCP tool: ${name}`);
	}
}
