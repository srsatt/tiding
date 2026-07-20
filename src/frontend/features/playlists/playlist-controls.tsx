import { t } from "ttag";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import {
	CheckboxField,
	NumberField,
	SelectControl,
	TextareaField,
	TextField,
} from "../../design-system/native-controls";
import { Button, ButtonLink, DeleteButton } from "../../ui";
import { PlaylistLayoutSelect } from "./playlist-layout-select";

export { PlaylistItemRows } from "./playlist-item-rows";

export function PlaylistForm({
	playlist,
	action,
	submitLabel,
}: {
	playlist?: {
		id: number;
		name: string;
		description?: string | null;
		is_active: unknown;
	};
	action: string;
	submitLabel: string;
}) {
	const active =
		playlist?.is_active === undefined ||
		playlist.is_active === true ||
		playlist.is_active === 1 ||
		playlist.is_active === "1";
	return (
		<form action={action} method="POST" className={"formGrid"}>
			{playlist ? <input type="hidden" name="_method" value="PATCH" /> : null}
			<TextField
				label={t`Name`}
				name="name"
				value={playlist?.name ?? ""}
				required
			/>
			<CheckboxField name="is_active" checked={active} label={t`Active`} />
			<TextareaField
				className={"wide"}
				label={t`Description`}
				name="description"
			>
				{playlist?.description || ""}
			</TextareaField>
			<div className={"formActions"}>
				<Button type="submit">{submitLabel}</Button>
				{playlist ? (
					<DeleteButton action={`/api/playlists/${playlist.id}`} />
				) : (
					<ButtonLink href="/playlists" variant="secondary">
						{t`Cancel`}
					</ButtonLink>
				)}
			</div>
		</form>
	);
}

export function PlaylistItemForm({
	playlistId,
	screens,
	nextOrder,
	selectedLayout = "1x1",
	selectedSlot,
}: {
	playlistId: number;
	screens: ScreenDesign[];
	nextOrder: number;
	selectedLayout?: string;
	selectedSlot?: number;
}) {
	const slot = selectedSlot ?? nextOrder;
	return (
		<form
			action={`/api/playlists/${playlistId}/items`}
			method="POST"
			className={"formGrid"}
		>
			<label htmlFor="playlist-item-screen">
				{t`Screen`}
				<SelectControl
					id="playlist-item-screen"
					name="screen_design_id"
					required
				>
					{screens.map((screen) => (
						<option key={screen.id} value={screen.id}>
							{screen.name} ({screen.width}x{screen.height})
						</option>
					))}
				</SelectControl>
			</label>
			<NumberField
				label={t`Duration seconds`}
				name="duration"
				value="60"
				min="1"
			/>
			<NumberField label={t`Order`} name="order" value={nextOrder} min="0" />
			<label htmlFor="playlist-composer-layout">
				{t`Composer layout`}
				<PlaylistLayoutSelect
					id="playlist-composer-layout"
					selected={selectedLayout}
				/>
			</label>
			<NumberField label={t`Composer slot`} name="slot" value={slot} min="0" />
			<div className={"formActions"}>
				<Button type="submit">{t`Add Screen`}</Button>
			</div>
		</form>
	);
}
