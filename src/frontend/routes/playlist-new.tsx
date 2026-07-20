import { t } from "ttag";
import { NewPlaylistPage } from "../features/playlists/playlist-overview-page";
import { Page } from "../ui";

export function renderNewPlaylistPage() {
	return Page({
		title: t`New Playlist`,
		children: <NewPlaylistPage />,
	});
}
