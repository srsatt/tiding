import { t } from "ttag";
import type { Playlist } from "../../../db/repositories/playlist.repository";
import { formatTimestamp } from "../../format";
import { ButtonLink, cx, EmptyRow } from "../../ui";
import { PlaylistForm } from "./playlist-controls";

export function PlaylistOverviewPage({
	counts,
	playlists,
}: {
	counts: Map<number, number>;
	playlists: Playlist[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Playlists`}</h1>
					<p>{t`Create playlists and arrange screen rotations.`}</p>
				</div>
				<ButtonLink href="/playlists/new">{t`Create Playlist`}</ButtonLink>
			</header>
			<section className={"panel"}>
				<table>
					<thead>
						<tr>
							<th>{t`Name`}</th>
							<th>{t`Status`}</th>
							<th>{t`Screens`}</th>
							<th>{t`Description`}</th>
							<th>{t`Updated`}</th>
						</tr>
					</thead>
					<tbody>
						{playlists.length === 0 ? (
							<EmptyRow colSpan={5}>{t`No playlists yet.`}</EmptyRow>
						) : (
							playlists.map((playlist) => (
								<tr key={playlist.id}>
									<td>
										<a href={`/playlists/${playlist.id}`}>{playlist.name}</a>
									</td>
									<td>
										<span
											className={cx(
												"status",
												playlist.is_active ? "ok" : "muted",
											)}
										>
											{playlist.is_active ? t`active` : t`inactive`}
										</span>
									</td>
									<td>{counts.get(playlist.id) ?? 0}</td>
									<td>{playlist.description || t`none`}</td>
									<td>{formatTimestamp(playlist.updated_at)}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</section>
		</>
	);
}

export function NewPlaylistPage() {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{t`Create Playlist`}</h1>
			</header>
			<section className={"panel"}>
				<PlaylistForm action="/api/playlists" submitLabel={t`Create`} />
			</section>
		</>
	);
}
