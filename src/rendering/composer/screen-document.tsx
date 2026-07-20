import type { ComponentChildren } from "preact";
import renderToString from "preact-render-to-string";
import type { Widget } from "../../db/repositories/widget.repository";
import {
	rotationFromConfig,
	styleFromConfig,
	type WidgetConfig,
} from "../../shared/widget-config";
import { displayFontSelection } from "../takumi/display-fonts";

export function renderScreenDocument({
	background,
	width,
	height,
	children,
	bodyBackground,
}: {
	background: string;
	width: number;
	height: number;
	children: ComponentChildren;
	bodyBackground?: string;
}) {
	return renderToString(
		<html lang="en" style={{ background }}>
			<body
				style={{
					margin: "0",
					padding: "0",
					width: `${width}px`,
					height: `${height}px`,
					position: "relative",
					background: bodyBackground,
				}}
			>
				{children}
			</body>
		</html>,
	);
}

export function ScreenWidgetFrame({
	widget,
	config,
	children,
}: {
	widget: Widget;
	config: WidgetConfig;
	children: ComponentChildren;
}) {
	const rotation = rotationFromConfig(config);
	const widgetStyle = styleFromConfig(config);
	const displayFont = displayFontSelection(
		widgetStyle.fontSize,
		config.fontFamily,
	);
	return (
		<div
			style={{
				position: "absolute",
				left: `${widget.x}px`,
				top: `${widget.y}px`,
				width: `${widget.width}px`,
				height: `${widget.height}px`,
				border: "1px solid #111",
				color: "#000",
				background: "transparent",
				overflow: "hidden",
				fontSize: `${displayFont.fontSize}px`,
				fontFamily: displayFont.family,
				opacity: widgetStyle.opacity,
				textAlign: widgetStyle.textAlign,
				transform: rotation ? `rotate(${rotation}deg)` : undefined,
				transformOrigin: "center center",
				boxSizing: "border-box",
			}}
		>
			{children}
		</div>
	);
}

export function CustomWidgetFrame({ children }: { children: string }) {
	return (
		<div
			style={{ width: "100%", height: "100%" }}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Custom widget output is escaped or framework-rendered at this isolated boundary.
			dangerouslySetInnerHTML={{ __html: children }}
		/>
	);
}

export function CustomWidgetPreviewFrame({
	width,
	height,
	children,
}: {
	width: number;
	height: number;
	children: string;
}) {
	return (
		<div
			style={{
				position: "absolute",
				left: "0",
				top: "0",
				width: `${width}px`,
				height: `${height}px`,
				color: "#000",
				background: "transparent",
				overflow: "hidden",
				fontSize: "12px",
			}}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Custom widget output is escaped or framework-rendered at this isolated boundary.
			dangerouslySetInnerHTML={{ __html: children }}
		/>
	);
}
