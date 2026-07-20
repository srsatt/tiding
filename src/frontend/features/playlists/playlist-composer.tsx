import { t } from "ttag";
import type { PlaylistItem } from "../../../db/repositories/playlist.repository";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";

function screenById(screens: ScreenDesign[]) {
	return new Map(screens.map((screen) => [screen.id, screen]));
}

function composerConfig(item: PlaylistItem) {
	try {
		const config = JSON.parse(item.config || "{}") as {
			layout?: string;
			slot?: number;
		};
		return {
			layout: config.layout || "1x1",
			slot: Number.isFinite(config.slot) ? Number(config.slot) : item.order,
		};
	} catch {
		return { layout: "1x1", slot: item.order };
	}
}

export function PlaylistComposer({
	playlistId,
	items,
	screens,
	nextSlot,
}: {
	playlistId: number;
	items: PlaylistItem[];
	screens: ScreenDesign[];
	nextSlot: number;
}) {
	const screensById = screenById(screens);
	return (
		<section className={"panel"}>
			<h2>{t`Screen Composer`}</h2>
			<div className={"composerOptions"}>
				{["2x2", "2x1", "1x2"].map((layout) => (
					<a
						key={layout}
						href={`/playlists/${playlistId}?layout=${layout}&slot=${nextSlot}#add-screen`}
					>
						{layout}
					</a>
				))}
				<a
					href={`/playlists/${playlistId}?layout=1x1&slot=${nextSlot}#add-screen`}
				>
					{t`Add slot`}
				</a>
				<a href={`/playlists/${playlistId}?layout=2x2&slot=0#add-screen`}>
					{t`Add grid`}
				</a>
			</div>
			<div className={"composerGrid"}>
				{items.length === 0 ? (
					<p className={"mutedText"}>{t`No screens in this playlist yet.`}</p>
				) : (
					items.map((item) => {
						const screen = screensById.get(Number(item.screen_design_id));
						const config = composerConfig(item);
						return (
							<a
								key={item.id}
								className={"composerSlot"}
								data-composer-layout={config.layout}
								data-composer-slot={config.slot}
								href={screen ? `/screens/${screen.id}` : "/screens"}
							>
								<span>
									{config.layout} · {t`slot`} {config.slot}
								</span>
								<strong>{screen?.name ?? t`Missing screen`}</strong>
								<small>
									{screen ? `${screen.width}x${screen.height}` : t`unknown`}
								</small>
								<small>
									{item.duration}s · {item.kind}
								</small>
							</a>
						);
					})
				)}
			</div>
		</section>
	);
}
