import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { PlaylistDetailPage } from "../features/playlists/playlist-detail-page";
import { PlaylistOverviewPage } from "../features/playlists/playlist-overview-page";
import { Page } from "../ui";

export async function renderPlaylistsPage(db: DatabaseService) {
	const playlists = await db.playlists.findAll();
	const counts = new Map<number, number>();
	for (const playlist of playlists) {
		counts.set(playlist.id, (await db.playlists.findItems(playlist.id)).length);
	}
	return Page({
		title: t`Playlists`,
		children: <PlaylistOverviewPage counts={counts} playlists={playlists} />,
	});
}

export async function renderPlaylistDetailPage(
	db: DatabaseService,
	playlistId: number,
	params?: URLSearchParams,
) {
	const [playlist, items, screens, devices] = await Promise.all([
		db.playlists.findById(playlistId),
		db.playlists.findItems(playlistId),
		db.screens.findAll(),
		db.devices.findByPlaylistId(playlistId),
	]);
	if (!playlist) return null;
	const selectedLayout = params?.get("layout") || "1x1";
	const selectedSlot = Number.parseInt(params?.get("slot") || "", 10);
	return Page({
		title: t`Playlist ${playlist.name}`,
		children: (
			<PlaylistDetailPage
				devices={devices}
				items={items}
				playlist={playlist}
				screens={screens}
				selectedLayout={selectedLayout}
				selectedSlot={Number.isInteger(selectedSlot) ? selectedSlot : undefined}
			/>
		),
	});
}
