import { t } from "ttag";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { rotationFromConfig } from "../../../shared/widget-config";
import { ScreenDesignerConfigPanels } from "./screen-designer-config-panels";
import type { DesignerWidget } from "./screen-designer-model";
import { ScreenDesignerProperties } from "./screen-designer-properties";
import { ScreenDesignerWidgetActions } from "./screen-designer-widget-actions";

function WidgetCard({ widget }: { widget: DesignerWidget }) {
	const rotation = rotationFromConfig(widget.config);
	return (
		<article
			className={"designerWidgetCard"}
			data-widget-row
			data-widget-id={widget.id}
			data-label={widget.displayLabel}
			data-x={widget.x}
			data-y={widget.y}
			data-width={widget.width}
			data-height={widget.height}
			data-z-index={widget.z_index}
			data-rotation={rotation}
			data-font-size={widget.fontSize}
			data-opacity={widget.opacity}
			data-text-align={widget.textAlign}
		>
			<div className={"designerWidgetCardHeader"}>
				<a href={`/screens/widgets/${widget.id}`} data-widget-card-title>
					{widget.displayLabel}
				</a>
				<span>{widget.detailLabel}</span>
			</div>
			<div className={"designerWidgetFacts"}>
				<span data-widget-position>
					{widget.x}, {widget.y}
				</span>
				<span data-widget-size>
					{widget.width}x{widget.height}
				</span>
				<span>{rotation}deg</span>
				<span data-widget-layer>{t`Layer ${widget.z_index}`}</span>
			</div>
			<ScreenDesignerWidgetActions widget={widget} />
		</article>
	);
}

export function ScreenDesignerInspector({
	widgets,
	templates,
}: {
	widgets: DesignerWidget[];
	templates: WidgetTemplate[];
}) {
	return (
		<aside className={"designerInspector"}>
			<header className={"inspectorHeader"}>
				<h2>{t`Active Widgets`}</h2>
				<span>{widgets.length}</span>
			</header>
			<div className={"designerWidgetList"}>
				{widgets.length === 0 ? (
					<p className={"mutedText"}>{t`No widgets yet.`}</p>
				) : (
					widgets.map((widget) => (
						<WidgetCard key={widget.id} widget={widget} />
					))
				)}
			</div>
			<ScreenDesignerProperties>
				<ScreenDesignerConfigPanels widgets={widgets} templates={templates} />
			</ScreenDesignerProperties>
		</aside>
	);
}
