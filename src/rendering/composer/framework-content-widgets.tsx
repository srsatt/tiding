import { QrCodeSvg } from "../../shared/qr-code";
import type { FrameworkWidgetDefinition } from "./framework-widget-kit";
import { Panel, value } from "./framework-widget-kit";

export const CONTENT_WIDGETS: FrameworkWidgetDefinition[] = [
	{
		name: "text",
		label: "Text Block",
		description: "Text content",
		category: "Content",
		defaultConfig: { text: "Hello" },
		minWidth: 180,
		minHeight: 80,
		render: (config) => <Panel>{value(config, "text", "Hello")}</Panel>,
	},
	{
		name: "github",
		label: "GitHub Stars",
		description: "Repository star count",
		category: "Content",
		defaultConfig: { repo: "owner/project", stars: 1234, live: false },
		minWidth: 220,
		minHeight: 80,
		render: (config) => (
			<Panel>
				<strong>GitHub Stars</strong>
				<span>{value(config, "repo", "owner/project")}</span>
				<span>{value(config, "stars", "0")}</span>
				{config.githubError ? (
					<span>{value(config, "githubError", "")}</span>
				) : null}
			</Panel>
		),
	},
	{
		name: "image",
		label: "Static Image",
		description: "Image URL placeholder",
		category: "Content",
		defaultConfig: { url: "", alt: "Image" },
		minWidth: 240,
		minHeight: 160,
		render: (config) => (
			<Panel>
				<strong>Static Image</strong>
				<span>{value(config, "alt", "Image")}</span>
			</Panel>
		),
	},
	{
		name: "qrcode",
		label: "QR Code",
		description: "QR payload placeholder",
		category: "Content",
		defaultConfig: { value: "https://example.com" },
		minWidth: 160,
		minHeight: 160,
		render: (config) => (
			<div style={{ display: "grid", placeItems: "center", height: "100%" }}>
				<QrCodeSvg
					value={value(config, "value", "https://example.com")}
					label="QR Code"
				/>
			</div>
		),
	},
];

export const LAYOUT_WIDGETS: FrameworkWidgetDefinition[] = [
	{
		name: "divider",
		label: "Divider Line",
		description: "Horizontal divider",
		category: "Layout",
		defaultConfig: { orientation: "horizontal" },
		minWidth: 240,
		minHeight: 20,
		render: () => (
			<div style={{ display: "grid", placeItems: "center", height: "100%" }}>
				<hr style={{ border: "1px solid #000", width: "100%" }} />
			</div>
		),
	},
	{
		name: "rectangle",
		label: "Rectangle",
		description: "Filled shape",
		category: "Layout",
		defaultConfig: { fill: "#111111" },
		minWidth: 160,
		minHeight: 100,
		render: (config) => (
			<div
				style={{
					width: "100%",
					height: "100%",
					background: value(config, "fill", "#111111"),
				}}
			/>
		),
	},
	{
		name: "plugin",
		label: "Plugin Widget",
		description: "Future plugin placeholder",
		category: "Plugins",
		defaultConfig: { unsupported: true },
		minWidth: 220,
		minHeight: 90,
		render: () => (
			<Panel>
				<strong>Plugin Widget</strong>
				<span>Unsupported</span>
			</Panel>
		),
	},
];
