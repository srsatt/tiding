import { t } from "ttag";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import { cacheExists } from "../../format";
import { ButtonLink, cx, DeleteForm, EmptyRow } from "../../ui";
import { ScreenDesignForm } from "./screen-form";
import { ImportScreenPackageDialog } from "./screen-package-dialogs";

export function ScreensOverviewPage({
	cachePath,
	screens,
}: {
	cachePath: string;
	screens: ScreenDesign[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Screen Designs`}</h1>
					<p>{t`Manage screen layouts and cached 1-bit BMP preview artifacts.`}</p>
				</div>
				<div className={"actions"}>
					<ImportScreenPackageDialog />
					<ButtonLink href="/screens/new">{t`New Screen`}</ButtonLink>
				</div>
			</header>
			<section className={"panel"}>
				<table>
					<thead>
						<tr>
							<th>{t`Preview`}</th>
							<th>{t`Name`}</th>
							<th>{t`Resolution`}</th>
							<th>{t`Cached BMP`}</th>
							<th>{t`Actions`}</th>
						</tr>
					</thead>
					<tbody>
						{screens.length === 0 ? (
							<EmptyRow colSpan={5}>{t`No screens yet.`}</EmptyRow>
						) : (
							screens.map((screen) => (
								<ScreenOverviewRow
									key={screen.id}
									cachePath={cachePath}
									screen={screen}
								/>
							))
						)}
					</tbody>
				</table>
			</section>
		</>
	);
}

function ScreenOverviewRow({
	cachePath,
	screen,
}: {
	cachePath: string;
	screen: ScreenDesign;
}) {
	const cached = cacheExists(cachePath, screen.id);
	const previewUrl = `/api/screen-designs/${screen.id}/preview`;
	return (
		<tr>
			<td>
				<a href={previewUrl} className={"screenThumbLink"}>
					<img
						className={"screenThumb"}
						src={previewUrl}
						alt={t`${screen.name} preview`}
						loading="lazy"
					/>
				</a>
			</td>
			<td>
				<a href={`/screens/${screen.id}`}>{screen.name}</a>
			</td>
			<td>
				{screen.width}x{screen.height}
			</td>
			<td>
				<span className={cx("status", cached ? "ok" : "muted")}>
					{cached ? t`Available` : t`Not cached`}
				</span>
			</td>
			<td className={"actions"}>
				<ButtonLink href={`/screens/designer/${screen.id}`} variant="small">
					{t`Designer`}
				</ButtonLink>
				<ButtonLink href={`/screens/${screen.id}`} variant="small">
					{t`Details`}
				</ButtonLink>
				<ButtonLink href={previewUrl} variant="secondary">
					{t`Open BMP`}
				</ButtonLink>
				<ButtonLink
					href={`/api/screen-designs/${screen.id}/export`}
					variant="secondary"
				>
					{t`Export`}
				</ButtonLink>
				<DeleteForm action={`/api/screen-designs/${screen.id}`} />
			</td>
		</tr>
	);
}

export function NewScreenPage() {
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{t`Create Screen`}</h1>
			</header>
			<section className={"panel"}>
				<ScreenDesignForm />
			</section>
		</>
	);
}
