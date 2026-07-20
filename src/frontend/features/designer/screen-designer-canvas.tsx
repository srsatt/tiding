import type { JSX } from "preact";
import { t } from "ttag";
import {
	rotationFromConfig,
	styleFromConfig,
} from "../../../shared/widget-config";
import type { DesignerWidget } from "./screen-designer-model";

export function ScreenDesignerCanvas({
	screenId,
	widgets,
	width,
	height,
	background,
}: {
	screenId: number;
	widgets: DesignerWidget[];
	width: number;
	height: number;
	background: string;
}) {
	const canvasStyle = {
		"--design-width": String(width),
		"--design-width-px": `${width}px`,
		"--design-height": String(height),
		aspectRatio: `${width}/${height}`,
		background,
	} as JSX.CSSProperties;
	return (
		<div
			className={"designerCanvas"}
			data-widget-count={widgets.length}
			style={canvasStyle}
			role="application"
			aria-label={t`Screen canvas`}
		>
			<img
				alt={t`Rendered screen preview`}
				className="designerCanvasRender"
				src={`/api/screen-designs/${screenId}/preview`}
				hidden={widgets.length > 0}
			/>
			<section
				className={"designerCanvasBounds"}
				data-designer-canvas-bounds
				aria-label={t`Canvas bounds`}
			>
				<span className={"boundsOrigin"}>0,0</span>
				<span className={"boundsWidth"}>{width}px</span>
				<span className={"boundsHeight"}>{height}px</span>
				<span className={"boundsMax"}>
					{width},{height}
				</span>
			</section>
			<div
				className={"designerEmptyState"}
				data-designer-empty-state
				hidden={widgets.length > 0}
				role="status"
				aria-label={t`Empty screen canvas`}
			>
				<span>{t`Empty screen`}</span>
			</div>
			{widgets.map((widget) => {
				const rotation = rotationFromConfig(widget.config);
				const widgetStyle = styleFromConfig(widget.config);
				const itemStyle = {
					left: `${(widget.x / width) * 100}%`,
					top: `${(widget.y / height) * 100}%`,
					width: `${(widget.width / width) * 100}%`,
					height: `${(widget.height / height) * 100}%`,
					zIndex: widget.z_index,
					transform: `rotate(${rotation}deg)`,
					fontSize: `${widgetStyle.fontSize}px`,
					opacity: widgetStyle.opacity,
					textAlign: widgetStyle.textAlign,
				} as JSX.CSSProperties;
				return (
					<a
						key={widget.id}
						className={"designerWidget"}
						aria-label={widget.displayLabel}
						href={`/screens/widgets/${widget.id}`}
						data-widget-id={widget.id}
						data-update-url={`/api/widgets/${widget.id}`}
						data-config={widget.config}
						data-label={widget.displayLabel}
						data-rotation={rotation}
						data-font-size={widgetStyle.fontSize}
						data-opacity={widgetStyle.opacity}
						data-text-align={widgetStyle.textAlign}
						data-x={widget.x}
						data-y={widget.y}
						data-width={widget.width}
						data-height={widget.height}
						data-z-index={widget.z_index}
						style={itemStyle}
					>
						<img
							alt=""
							aria-hidden="true"
							className="designerWidgetRender"
							src={`/api/widgets/${widget.id}/preview`}
							data-widget-preview
						/>
						<span data-canvas-widget-label>{widget.displayLabel}</span>
						<span className={"designerResizeHandle"} aria-hidden="true" />
					</a>
				);
			})}
		</div>
	);
}
