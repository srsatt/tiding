import type { DatabaseService } from "../../db";
import type {
	Playlist,
	PlaylistItem,
} from "../../db/repositories/playlist.repository";
import {
	handleError,
	jsonResponse,
	optionalInteger,
	optionalText,
	parseBody,
	redirectResponse,
	requireInteger,
	requireText,
	textResponse,
} from "../http";

function isActive(value: unknown) {
	return value === true || value === 1 || value === "1";
}

function booleanInput(value: unknown, fallback?: boolean) {
	if (value === undefined) return fallback;
	return value === true || value === 1 || value === "1" || value === "on";
}

function composerConfig(body: Record<string, unknown>) {
	const layout = optionalText(body.layout) || "1x1";
	const slot = optionalInteger(body.slot, "slot", { min: 0 }) ?? 0;
	const allowedLayouts = new Set(["1x1", "2x2", "2x1", "1x2"]);
	return JSON.stringify({
		layout: allowedLayouts.has(layout) ? layout : "1x1",
		slot,
	});
}

function playlistDto(playlist: Playlist) {
	return {
		id: playlist.id,
		name: playlist.name,
		description: playlist.description ?? null,
		isActive: isActive(playlist.is_active),
		createdAt: playlist.created_at,
		updatedAt: playlist.updated_at,
	};
}

function playlistItemDto(item: PlaylistItem) {
	return {
		id: item.id,
		playlistId: item.playlist_id,
		screenId: item.screen_id ?? null,
		screenDesignId: item.screen_design_id ?? null,
		kind: item.kind,
		config: item.config ?? null,
		order: item.order,
		duration: item.duration,
		createdAt: item.created_at,
		pluginInstanceId: item.plugin_instance_id ?? null,
	};
}

export async function handlePlaylists(req: Request, db: DatabaseService) {
	const path = new URL(req.url).pathname;
	const itemMatch = path.match(/^\/api\/playlists\/(\d+)\/items\/(\d+)$/);
	const idMatch = path.match(/^\/api\/playlists\/(\d+)(?:\/items)?$/);
	const playlistId = idMatch ? Number.parseInt(idMatch[1], 10) : null;

	try {
		if (path === "/api/playlists" && req.method === "GET") {
			const items = (await db.playlists.findAll()).map(playlistDto);
			return jsonResponse({ data: { items, total: items.length } });
		}

		if (path === "/api/playlists" && req.method === "POST") {
			const body = await parseBody(req);
			const id = await db.playlists.create({
				name: requireText(body.name, "name"),
				description: optionalText(body.description),
				is_active: booleanInput(body.is_active, true),
			});
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse(`/playlists/${id}`);
			return jsonResponse({ id }, { status: 201 });
		}

		if (itemMatch && req.method === "POST") {
			const [, playlistText, itemText] = itemMatch;
			const playlist = await db.playlists.findById(Number(playlistText));
			if (!playlist) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			if (body._method === "PATCH") {
				await db.playlists.updateItem(Number(itemText), {
					screen_design_id: optionalInteger(
						body.screen_design_id,
						"screen_design_id",
					),
					order: optionalInteger(body.order, "order", { min: 0 }),
					duration: optionalInteger(body.duration, "duration"),
					kind: "screen",
					config: composerConfig(body),
				});
				return redirectResponse(`/playlists/${playlist.id}`);
			}
			if (body._method === "DELETE") {
				await db.playlists.deleteItem(Number(itemText));
				return redirectResponse(`/playlists/${playlist.id}`);
			}
		}

		if (playlistId && path.endsWith("/items") && req.method === "GET") {
			const playlist = await db.playlists.findById(playlistId);
			if (!playlist) return textResponse("Not Found", 404);
			const items = (await db.playlists.findItems(playlistId)).map(
				playlistItemDto,
			);
			return jsonResponse({ data: { items, total: items.length } });
		}

		if (playlistId && path.endsWith("/items") && req.method === "POST") {
			const playlist = await db.playlists.findById(playlistId);
			if (!playlist) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			const id = await db.playlists.addItem({
				playlist_id: playlistId,
				screen_design_id: requireInteger(
					body.screen_design_id,
					"screen_design_id",
				),
				order: optionalInteger(body.order, "order", { min: 0 }) ?? 0,
				duration: optionalInteger(body.duration, "duration") ?? 60,
				kind: "screen",
				config: composerConfig(body),
			});
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse(`/playlists/${playlistId}`);
			return jsonResponse({ id }, { status: 201 });
		}

		if (playlistId && req.method === "GET") {
			const playlist = await db.playlists.findById(playlistId);
			if (!playlist) return textResponse("Not Found", 404);
			return jsonResponse({
				data: {
					...playlistDto(playlist),
					itemsUrl: `/api/playlists/${playlist.id}/items`,
				},
			});
		}

		if (playlistId && req.method === "POST") {
			const playlist = await db.playlists.findById(playlistId);
			if (!playlist) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			if (body._method === "PATCH") {
				await db.playlists.update(playlistId, {
					name: optionalText(body.name),
					description: optionalText(body.description),
					is_active: booleanInput(body.is_active, false),
				});
				return redirectResponse(`/playlists/${playlistId}`);
			}
			if (body._method === "DELETE") {
				await db.playlists.delete(playlistId);
				return redirectResponse("/playlists");
			}
		}
	} catch (error) {
		return handleError(error);
	}

	return textResponse("Not Found", 404);
}
