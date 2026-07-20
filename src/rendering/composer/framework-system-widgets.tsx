import { FrameworkIcon } from "./framework-icon";
import type { FrameworkWidgetDefinition } from "./framework-widget-kit";
import { Panel, value } from "./framework-widget-kit";

export const SYSTEM_WIDGETS: FrameworkWidgetDefinition[] = [
	{
		name: "battery",
		label: "Battery Status",
		description: "Battery percentage",
		category: "System",
		defaultConfig: { percent: 87 },
		minWidth: 180,
		minHeight: 70,
		render: (config, context) => (
			<Panel>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px",
					}}
				>
					<FrameworkIcon name="battery" size={24} />
					<span>
						Battery {context.device?.battery ?? value(config, "percent", "0")}%
					</span>
				</div>
			</Panel>
		),
	},
	{
		name: "deviceinfo",
		label: "Device Info",
		description: "Device metadata",
		category: "System",
		defaultConfig: { label: "TRMNL", id: "device" },
		minWidth: 240,
		minHeight: 90,
		render: (config, context) => (
			<Panel>
				<strong>Device</strong>
				<span>{context.device?.label ?? value(config, "label", "TRMNL")}</span>
			</Panel>
		),
	},
	{
		name: "wifi",
		label: "WiFi Status",
		description: "WiFi signal",
		category: "System",
		defaultConfig: { rssi: -62 },
		minWidth: 180,
		minHeight: 70,
		render: (config, context) => (
			<Panel>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px",
					}}
				>
					<FrameworkIcon name="wifi" size={24} />
					<span>
						WiFi {context.device?.wifi ?? value(config, "rssi", "0")} dBm
					</span>
				</div>
			</Panel>
		),
	},
	{
		name: "weather",
		label: "Weather",
		description: "Weather summary",
		category: "Weather",
		defaultConfig: { temperature: "21C", condition: "Clear" },
		minWidth: 240,
		minHeight: 100,
		render: (config) => (
			<Panel>
				<FrameworkIcon name="cloud-sun" size={28} />
				<strong>{value(config, "temperature", "21C")}</strong>
				<span>{value(config, "condition", "Clear")}</span>
			</Panel>
		),
	},
];
