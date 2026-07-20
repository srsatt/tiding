import { t } from "ttag";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import type { Widget } from "../../../db/repositories/widget.repository";
import { ButtonLink } from "../../ui";
import { ScreenDesignForm } from "./screen-form";
import { ScreenWidgetsTable } from "./screen-widgets";

export function ScreenEditorPage({
	screen,
	widgets,
}: {
	screen: ScreenDesign;
	widgets: Widget[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{screen.name}</h1>
					<p>
						{screen.width}x{screen.height}{" "}
						{t`screen. Preview renders through Takumi to 1-bit BMP.`}
					</p>
				</div>
				<div className={"actions"}>
					<ButtonLink href={`/screens/designer/${screen.id}`}>
						{t`Open Designer`}
					</ButtonLink>
					<ButtonLink href="/screens" variant="secondary">
						{t`Back`}
					</ButtonLink>
				</div>
			</header>
			<div className={"splitLayout"}>
				<section className={"panel"}>
					<h2>{t`Details`}</h2>
					<ScreenDesignForm screen={screen} />
				</section>
				<ScreenPreviewPanel screen={screen} />
			</div>
			<section className={"panel"}>
				<div className={"sectionHeader"}>
					<h2>{t`Widgets`}</h2>
					<ButtonLink href={`/screens/widgets/new?screenId=${screen.id}`}>
						{t`Add Widget`}
					</ButtonLink>
				</div>
				<ScreenWidgetsTable widgets={widgets} />
			</section>
		</>
	);
}

function ScreenPreviewPanel({ screen }: { screen: ScreenDesign }) {
	const previewUrl = `/api/screen-designs/${screen.id}/preview`;
	return (
		<section className={"panel"}>
			<h2>{t`Preview`}</h2>
			<div
				data-island="screen-preview"
				data-props={JSON.stringify({ screenId: screen.id, src: previewUrl })}
			>
				<div className={"previewFrame"}>
					<img src={previewUrl} alt={t`Screen preview`} />
				</div>
				<ButtonLink href={previewUrl} variant="secondary">
					{t`Open BMP`}
				</ButtonLink>
			</div>
		</section>
	);
}
