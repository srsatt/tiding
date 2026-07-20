import { t } from "ttag";
import type { PlaylistItem } from "../../../db/repositories/playlist.repository";
import { PlaylistItemRows } from "./playlist-item-rows";

export function PlaylistItemsTable({ items }: { items: PlaylistItem[] }) {
	return (
		<section className={"panel"}>
			<h2>{t`Items`}</h2>
			<table>
				<tbody>
					<tr>
						<th>{t`Order`}</th>
						<th>{t`Duration`}</th>
						<th>{t`Screen`}</th>
						<th>{t`Screen design`}</th>
						<th>{t`Layout`}</th>
						<th>{t`Slot`}</th>
						<th>{t`Actions`}</th>
					</tr>
					<PlaylistItemRows items={items} />
				</tbody>
			</table>
		</section>
	);
}
