import { t } from "ttag";
import type { DeviceScreenSelection } from "../../../services/device-screen-selection";
import { ButtonLink } from "../../ui";

function sourceLabel(selection: DeviceScreenSelection) {
	if (selection.source === "assignment") return t`Direct assignment`;
	if (selection.source === "playlist") {
		return selection.playlistName
			? `${t`Playlist`}: ${selection.playlistName}`
			: t`Playlist`;
	}
	return t`No active screen`;
}

export function DeviceCurrentScreen({
	deviceId,
	selection,
}: {
	deviceId: number;
	selection: DeviceScreenSelection;
}) {
	const screen = selection.screen;
	const previewUrl = `/api/devices/${deviceId}/current-screen.bmp`;
	return (
		<section className={"panel"}>
			<div className={"sectionHeader"}>
				<h2>{t`Current Screen`}</h2>
				<span>{sourceLabel(selection)}</span>
			</div>
			{screen ? (
				<div
					className={"splitLayout"}
					data-island="screen-preview"
					data-props={JSON.stringify({
						screenId: screen.id,
						src: previewUrl,
					})}
				>
					<div className={"previewFrame"}>
						<img src={previewUrl} alt={t`Current screen preview`} />
					</div>
					<div>
						<h3>{screen.name}</h3>
						<p>
							{screen.width} x {screen.height}
						</p>
						{selection.playlist ? (
							<p>
								{selection.playlist.remainingSeconds} {t`seconds remaining`}
							</p>
						) : null}
						<div className={"actions"}>
							<ButtonLink href={`/screens/designer/${screen.id}`}>
								{t`Open Designer`}
							</ButtonLink>
							<ButtonLink href={previewUrl} variant="secondary">
								{t`Open BMP`}
							</ButtonLink>
						</div>
					</div>
				</div>
			) : (
				<p>{t`No active screen is available for this device.`}</p>
			)}
		</section>
	);
}
