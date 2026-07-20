import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import type { ScreenPackage } from "../../../services/screen-package";
import { ButtonLink } from "../../ui";
import { ExportScreenPackageDialog } from "../screens/screen-package-dialogs";
import { ScreenDesignerCanvas } from "./screen-designer-canvas";
import { ScreenDesignerInspector } from "./screen-designer-inspector";
import type { DesignerWidget } from "./screen-designer-model";
import { ScreenDesignerPalette } from "./screen-designer-palette";
import { ScreenDesignerToolbar } from "./screen-designer-toolbar-view";

export function ScreenDesignerPage({
	customWidgets,
	screen,
	screenPackage,
	templates,
	widgets,
}: {
	customWidgets: CustomWidget[];
	screen: ScreenDesign;
	screenPackage: ScreenPackage | null;
	templates: WidgetTemplate[];
	widgets: DesignerWidget[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>
						{t`Designer`}: {screen.name}
					</h1>
					<p>
						{screen.width}x{screen.height}
					</p>
				</div>
				<div className={"actions"}>
					<ButtonLink href={`/api/screen-designs/${screen.id}/preview`}>
						{t`Preview BMP`}
					</ButtonLink>
					{screenPackage ? (
						<ExportScreenPackageDialog pkg={screenPackage} />
					) : null}
					<ButtonLink href={`/screens/${screen.id}`} variant="secondary">
						{t`Edit details`}
					</ButtonLink>
					<ButtonLink href="/screens" variant="secondary">
						{t`Back`}
					</ButtonLink>
				</div>
			</header>
			<section
				className={"designerShell"}
				data-island="screen-designer"
				data-create-url={`/api/screen-designs/${screen.id}/widgets`}
				aria-label={t`Screen designer`}
			>
				<ScreenDesignerPalette
					screenId={screen.id}
					templates={templates}
					customWidgets={customWidgets}
				/>
				<section className={"designerStage"}>
					<ScreenDesignerToolbar
						screenId={screen.id}
						width={screen.width}
						height={screen.height}
						widgetCount={widgets.length}
					/>
					<div className={"designerCanvasViewport"}>
						<ScreenDesignerCanvas
							screenId={screen.id}
							widgets={widgets}
							width={screen.width}
							height={screen.height}
							background={screen.background}
						/>
					</div>
				</section>
				<ScreenDesignerInspector widgets={widgets} templates={templates} />
			</section>
		</>
	);
}
