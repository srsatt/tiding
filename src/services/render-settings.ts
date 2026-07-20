import type { DatabaseService } from "../db";
import type { Setting } from "../db/repositories/settings.repository";
import type { DitherMode } from "../rendering/bmp/mono-bmp";

export const RENDER_DEFAULTS = {
	ditherMode: "threshold" as DitherMode,
	threshold: 128,
};

const DITHER_MODES = new Set<DitherMode>([
	"threshold",
	"floyd-steinberg",
	"grayscale",
]);

function settingValue(settings: Setting[], key: string) {
	return settings.find((setting) => setting.key === key)?.value;
}

function legacyRenderSettings(settings: Setting[]) {
	const value = settingValue(settings, "eink_rendering");
	if (!value) return {};
	try {
		const parsed = JSON.parse(value) as Record<string, unknown>;
		return {
			ditherMode:
				typeof parsed.ditheringMode === "string"
					? parsed.ditheringMode
					: undefined,
			threshold:
				typeof parsed.threshold === "number" ? parsed.threshold : undefined,
		};
	} catch {
		return {};
	}
}

export function renderSettingsFromRows(settings: Setting[]) {
	const legacy = legacyRenderSettings(settings);
	const mode =
		settingValue(settings, "render_dither_mode") ||
		legacy.ditherMode ||
		"threshold";
	const threshold = Number.parseInt(
		settingValue(settings, "render_threshold") ||
			String(legacy.threshold ?? ""),
		10,
	);
	return {
		ditherMode: DITHER_MODES.has(mode as DitherMode)
			? (mode as DitherMode)
			: RENDER_DEFAULTS.ditherMode,
		threshold: Number.isInteger(threshold)
			? Math.max(0, Math.min(255, threshold))
			: RENDER_DEFAULTS.threshold,
	};
}

export async function renderSettings(db: DatabaseService) {
	return renderSettingsFromRows(await db.settings.findAll());
}
