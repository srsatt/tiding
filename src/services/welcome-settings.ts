import type { Setting } from "../db/repositories/settings.repository";

export const WELCOME_DEFAULTS = {
	autoCreateScreen: "true",
	autoAssignPlaylist: "true",
	title: "Welcome to Tiding",
	subtitle: "Your TRMNL-compatible display is ready.",
	template: "standard",
};

export const WELCOME_TEMPLATES = {
	standard: { label: "Standard 800x480", width: 800, height: 480 },
	compact: { label: "Compact 640x384", width: 640, height: 384 },
};

type WelcomeTemplate = keyof typeof WELCOME_TEMPLATES;

function fromSettings(settings: Setting[], key: string, fallback: string) {
	return settings.find((setting) => setting.key === key)?.value ?? fallback;
}

export function welcomeSettingsFromRows(settings: Setting[]) {
	const template = fromSettings(
		settings,
		"welcome_template",
		WELCOME_DEFAULTS.template,
	);
	return {
		autoCreateScreen: fromSettings(
			settings,
			"welcome_auto_create_screen",
			WELCOME_DEFAULTS.autoCreateScreen,
		),
		autoAssignPlaylist: fromSettings(
			settings,
			"welcome_auto_assign_playlist",
			WELCOME_DEFAULTS.autoAssignPlaylist,
		),
		title: fromSettings(settings, "welcome_title", WELCOME_DEFAULTS.title),
		subtitle: fromSettings(
			settings,
			"welcome_subtitle",
			WELCOME_DEFAULTS.subtitle,
		),
		template:
			template in WELCOME_TEMPLATES
				? (template as WelcomeTemplate)
				: (WELCOME_DEFAULTS.template as WelcomeTemplate),
	};
}
