import { t } from "ttag";
import type { PlaylistItem } from "../../../db/repositories/playlist.repository";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";

function usedResolutions(items: PlaylistItem[], screens: ScreenDesign[]) {
	const screensById = new Map(screens.map((screen) => [screen.id, screen]));
	return [
		...new Set(
			items
				.map((item) => screensById.get(Number(item.screen_design_id)))
				.filter(Boolean)
				.map((screen) => `${screen?.width}x${screen?.height}`),
		),
	];
}

export function PlaylistResolutionNotice({
	items,
	screens,
}: {
	items: PlaylistItem[];
	screens: ScreenDesign[];
}) {
	const resolutions = usedResolutions(items, screens);
	if (resolutions.length <= 1) return null;
	return (
		<section className={"panel"} data-playlist-resolution-warning>
			<h2>{t`Resolution mismatch`}</h2>
			<p>
				{t`This playlist mixes screen resolutions. Devices will render each screen at its own size; verify the assigned devices support:`}{" "}
				{resolutions.join(", ")}.
			</p>
		</section>
	);
}
