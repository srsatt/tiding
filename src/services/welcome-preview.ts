import { h } from "preact";
import type { DatabaseService } from "../db";
import { renderScreenDocument } from "../rendering/composer/screen-document";
import { takumiRenderer } from "../rendering/takumi/renderer";
import { renderSettings } from "./render-settings";
import { WELCOME_DEFAULTS, WELCOME_TEMPLATES } from "./welcome-settings";

type WelcomeTemplate = keyof typeof WELCOME_TEMPLATES;

type WelcomePreviewInput = {
	welcome_title?: unknown;
	welcome_subtitle?: unknown;
	welcome_template?: unknown;
};

function templateFor(input: WelcomePreviewInput) {
	const key = String(input.welcome_template || WELCOME_DEFAULTS.template);
	const templateKey = (
		key in WELCOME_TEMPLATES ? key : WELCOME_DEFAULTS.template
	) as WelcomeTemplate;
	return WELCOME_TEMPLATES[templateKey];
}

export async function renderDraftWelcomePreview(
	db: DatabaseService,
	input: WelcomePreviewInput,
) {
	const template = templateFor(input);
	const title = String(input.welcome_title || WELCOME_DEFAULTS.title);
	const subtitle = String(input.welcome_subtitle || WELCOME_DEFAULTS.subtitle);
	const html = renderScreenDocument({
		background: "#ffffff",
		bodyBackground: "#ffffff",
		width: template.width,
		height: template.height,
		children: h(
			"main",
			{
				style: {
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					width: "100%",
					height: "100%",
					gap: "24px",
					color: "#000",
					textAlign: "center",
				},
			},
			h("strong", { style: { fontSize: "34px" } }, title),
			h("span", { style: { fontSize: "18px" } }, subtitle),
		),
	});
	const settings = await renderSettings(db);
	return takumiRenderer.renderHtmlToBmp(html, {
		width: template.width,
		height: template.height,
		threshold: settings.threshold,
		ditherMode: settings.ditherMode,
	});
}
