import { t } from "ttag";
import type { Device } from "../../../db/repositories/device.repository";
import type {
	Playlist,
	PlaylistItem,
} from "../../../db/repositories/playlist.repository";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import { enabledLabel, formatTimestamp } from "../../format";
import { ButtonLink } from "../../ui";
import { ConnectedDevicesPanel } from "../devices/device-playlist-assignment";
import { PlaylistComposer } from "./playlist-composer";
import { PlaylistForm, PlaylistItemForm } from "./playlist-controls";
import { PlaylistItemsTable } from "./playlist-items-table";
import { PlaylistResolutionNotice } from "./playlist-resolution-notice";

export function PlaylistDetailPage({
	devices,
	items,
	playlist,
	screens,
	selectedLayout,
	selectedSlot,
}: {
	devices: Device[];
	items: PlaylistItem[];
	playlist: Playlist;
	screens: ScreenDesign[];
	selectedLayout: string;
	selectedSlot?: number;
}) {
	const nextOrder = (items.at(-1)?.order ?? -1) + 1;
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{playlist.name}</h1>
				<ButtonLink href="/playlists" variant="secondary">
					{t`Back`}
				</ButtonLink>
			</header>
			<section className={"panel"} id="add-screen">
				<h2>{t`Playlist Details`}</h2>
				<PlaylistForm
					playlist={playlist}
					action={`/api/playlists/${playlist.id}`}
					submitLabel={t`Save`}
				/>
			</section>
			<section className={"panel"}>
				<h2>{t`Playlist State`}</h2>
				<dl className={"facts"}>
					<dt>{t`Active`}</dt>
					<dd>{enabledLabel(playlist.is_active)}</dd>
					<dt>{t`Updated`}</dt>
					<dd>{formatTimestamp(playlist.updated_at)}</dd>
				</dl>
			</section>
			<section className={"panel"}>
				<h2>{t`Add Screens`}</h2>
				<PlaylistItemForm
					playlistId={playlist.id}
					screens={screens}
					nextOrder={nextOrder}
					selectedLayout={selectedLayout}
					selectedSlot={selectedSlot}
				/>
			</section>
			<ConnectedDevicesPanel devices={devices} />
			<PlaylistResolutionNotice items={items} screens={screens} />
			<PlaylistComposer
				playlistId={playlist.id}
				items={items}
				screens={screens}
				nextSlot={nextOrder}
			/>
			<PlaylistItemsTable items={items} />
		</>
	);
}
