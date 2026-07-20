import { t } from "ttag";
import type { PlaylistItem } from "../../../db/repositories/playlist.repository";
import { NumberField } from "../../design-system/native-controls";
import { enabledLabel } from "../../format";
import { Button, EmptyRow } from "../../ui";
import { PlaylistLayoutSelect } from "./playlist-layout-select";

function itemConfig(item: PlaylistItem) {
	try {
		const parsed = JSON.parse(item.config || "{}") as {
			layout?: string;
			slot?: number;
		};
		return {
			layout: parsed.layout || "1x1",
			slot: Number.isFinite(parsed.slot) ? Number(parsed.slot) : item.order,
		};
	} catch {
		return { layout: "1x1", slot: item.order };
	}
}

function PlaylistItemRow({ item }: { item: PlaylistItem }) {
	const config = itemConfig(item);
	return (
		<tr>
			<td>
				<NumberField
					label={t`Order`}
					form={`playlist-item-${item.id}`}
					name="order"
					value={item.order}
				/>
			</td>
			<td>
				<NumberField
					label={t`Duration`}
					form={`playlist-item-${item.id}`}
					name="duration"
					value={item.duration}
					min="1"
				/>
			</td>
			<td>{enabledLabel(item.kind === "screen")}</td>
			<td>
				{item.screen_design_id ? (
					<a href={`/screens/${item.screen_design_id}`}>
						{item.screen_design_id}
					</a>
				) : (
					t`none`
				)}
				<input
					form={`playlist-item-${item.id}`}
					type="hidden"
					name="screen_design_id"
					value={item.screen_design_id ?? ""}
				/>
			</td>
			<td>
				<PlaylistLayoutSelect
					id={`playlist-item-layout-${item.id}`}
					form={`playlist-item-${item.id}`}
					selected={config.layout}
				/>
			</td>
			<td>
				<NumberField
					label={t`Slot`}
					form={`playlist-item-${item.id}`}
					name="slot"
					value={config.slot}
					min="0"
				/>
			</td>
			<td className={"actions"}>
				<form
					id={`playlist-item-${item.id}`}
					action={`/api/playlists/${item.playlist_id}/items/${item.id}`}
					method="POST"
					className={"inlineForm"}
				>
					<input type="hidden" name="_method" value="PATCH" />
					<Button type="submit" size="sm">
						{t`Save`}
					</Button>
				</form>
				<form
					action={`/api/playlists/${item.playlist_id}/items/${item.id}`}
					method="POST"
					className={"inlineForm"}
					data-confirm={t`Delete this item?`}
				>
					<input type="hidden" name="_method" value="DELETE" />
					<Button type="submit" tone="danger" size="sm">
						{t`Remove`}
					</Button>
				</form>
			</td>
		</tr>
	);
}

export function PlaylistItemRows({ items }: { items: PlaylistItem[] }) {
	if (items.length === 0)
		return <EmptyRow colSpan={7}>{t`No playlist items.`}</EmptyRow>;
	return (
		<>
			{items.map((item) => (
				<PlaylistItemRow key={item.id} item={item} />
			))}
		</>
	);
}
