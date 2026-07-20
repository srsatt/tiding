export type WidgetConfig = Record<string, unknown>;

export const WIDGET_DITHER_MODES = [
	"inherit",
	"threshold",
	"floyd-steinberg",
	"grayscale",
] as const;
export type WidgetDitherMode = (typeof WIDGET_DITHER_MODES)[number];

export function parseWidgetConfig(config: string): WidgetConfig {
	try {
		const parsed = JSON.parse(config || "{}");
		return parsed && typeof parsed === "object" ? (parsed as WidgetConfig) : {};
	} catch {
		return {};
	}
}

export function customWidgetIdFromConfig(config: string) {
	const id = Number(parseWidgetConfig(config).customWidgetId);
	return Number.isInteger(id) && id > 0 ? id : undefined;
}

export function widgetDitherModeFromConfig(
	config: string | WidgetConfig,
): WidgetDitherMode {
	const parsed =
		typeof config === "string" ? parseWidgetConfig(config) : config;
	const mode = String(parsed.ditherMode || "inherit");
	return WIDGET_DITHER_MODES.includes(mode as WidgetDitherMode)
		? (mode as WidgetDitherMode)
		: "inherit";
}

export function rotationFromConfig(config: string | WidgetConfig) {
	const parsed =
		typeof config === "string" ? parseWidgetConfig(config) : config;
	const rotation = Number(parsed.rotation);
	return Number.isFinite(rotation) ? rotation : 0;
}

export function configWithRotation(config: string, rotation: number) {
	return JSON.stringify({
		...parseWidgetConfig(config),
		rotation: Math.round(rotation),
	});
}

export function styleFromConfig(config: string | WidgetConfig) {
	const parsed =
		typeof config === "string" ? parseWidgetConfig(config) : config;
	const fontSize = Number(parsed.fontSize);
	const opacity = Number(parsed.opacity);
	const textAlign = String(parsed.textAlign || "center");
	return {
		fontSize: Number.isFinite(fontSize)
			? Math.max(6, Math.round(fontSize))
			: 12,
		opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0.1, opacity)) : 1,
		textAlign: ["left", "center", "right"].includes(textAlign)
			? textAlign
			: "center",
	};
}

export function configWithStyle(
	config: string,
	style: { fontSize: number; opacity: number; textAlign: string },
) {
	return JSON.stringify({
		...parseWidgetConfig(config),
		fontSize: Math.max(6, Math.round(style.fontSize)),
		opacity: Math.min(1, Math.max(0.1, style.opacity)),
		textAlign: style.textAlign,
	});
}
