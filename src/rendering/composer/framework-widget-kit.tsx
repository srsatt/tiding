import type { ComponentChildren } from "preact";

export type WidgetConfig = Record<string, unknown>;

export interface FrameworkDeviceContext {
	id: number;
	label: string;
	battery: number;
	wifi: number;
	firmwareVersion?: string | null;
}

export interface FrameworkRenderContext {
	now: Date;
	device?: FrameworkDeviceContext;
}

export type FrameworkWidget = (
	config: WidgetConfig,
	context: FrameworkRenderContext,
) => ComponentChildren;

export interface FrameworkWidgetDefinition {
	name: string;
	label: string;
	description: string;
	category: string;
	defaultConfig: WidgetConfig;
	minWidth: number;
	minHeight: number;
	render: FrameworkWidget;
}

export function value(config: WidgetConfig, key: string, fallback: string) {
	const candidate = config[key];
	return candidate === undefined || candidate === null
		? fallback
		: String(candidate);
}

export function Panel({ children }: { children: ComponentChildren }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				gap: "4px",
			}}
		>
			{children}
		</div>
	);
}
