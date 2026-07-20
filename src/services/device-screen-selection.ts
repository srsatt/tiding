import type { DatabaseService } from "../db";
import type { Device } from "../db/repositories/device.repository";
import type { CurrentPlaylistScreen } from "../db/repositories/playlist.repository";
import type { ScreenDesign } from "../db/repositories/screen-design.repository";

export interface DeviceScreenSelection {
	screen: ScreenDesign | null;
	source: "assignment" | "playlist" | "none";
	playlistName: string | null;
	playlist: CurrentPlaylistScreen | null;
}

export async function selectedScreenForDevice(
	db: DatabaseService,
	device: Device,
	nowMs = Date.now(),
): Promise<DeviceScreenSelection> {
	const assignment = await db.devices.findActiveScreenAssignment(device.id);
	if (assignment) {
		return {
			screen: await db.screens.findById(assignment.screen_design_id),
			source: "assignment",
			playlistName: null,
			playlist: null,
		};
	}

	const playlistId = device.playlist_id;
	if (playlistId === undefined || playlistId === null) {
		return { screen: null, source: "none", playlistName: null, playlist: null };
	}

	const [playlist, current] = await Promise.all([
		db.playlists.findById(playlistId),
		db.playlists.findCurrentScreenDesign(playlistId, nowMs),
	]);
	if (!current) {
		return {
			screen: null,
			source: "playlist",
			playlistName: playlist?.name ?? null,
			playlist: null,
		};
	}

	return {
		screen: await db.screens.findById(current.screenDesignId),
		source: "playlist",
		playlistName: playlist?.name ?? null,
		playlist: current,
	};
}
