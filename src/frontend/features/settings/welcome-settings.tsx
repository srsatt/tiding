import { t } from "ttag";
import type { Setting } from "../../../db/repositories/settings.repository";
import {
	WELCOME_TEMPLATES,
	welcomeSettingsFromRows,
} from "../../../services/welcome-settings";
import { Button } from "../../design-system/buttons";
import {
	CheckboxField,
	SelectControl,
	TextField,
} from "../../design-system/native-controls";
import { FormActions } from "../../ui";

export function WelcomeSettingsPanel({ settings }: { settings: Setting[] }) {
	const welcome = welcomeSettingsFromRows(settings);
	const template = WELCOME_TEMPLATES[welcome.template];
	return (
		<section className={"panel welcomeSettings"}>
			<header className={"sectionHeader"}>
				<div>
					<h2>{t`Welcome Screen Configuration`}</h2>
					<p>{t`Choose what new devices display before custom content exists.`}</p>
				</div>
			</header>
			<div className={"welcomeGrid"}>
				<form action="/api/settings" method="POST" className={"formGrid"}>
					<input
						type="hidden"
						name="welcome_auto_create_screen"
						value="false"
					/>
					<CheckboxField
						className={"wide inlineToggle"}
						name="welcome_auto_create_screen"
						value="true"
						checked={welcome.autoCreateScreen === "true"}
						label={t`Auto-create welcome screen`}
					/>
					<input
						type="hidden"
						name="welcome_auto_assign_playlist"
						value="false"
					/>
					<CheckboxField
						className={"wide inlineToggle"}
						name="welcome_auto_assign_playlist"
						value="true"
						checked={welcome.autoAssignPlaylist === "true"}
						label={t`Auto-assign playlist to new or unassigned devices`}
					/>
					<TextField
						label={t`Title`}
						name="welcome_title"
						value={welcome.title}
					/>
					<TextField
						label={t`Subtitle`}
						name="welcome_subtitle"
						value={welcome.subtitle}
					/>
					<label className={"wide"} htmlFor="welcome-template">
						{t`Default template`}
						<SelectControl id="welcome-template" name="welcome_template">
							{Object.entries(WELCOME_TEMPLATES).map(([key, option]) => (
								<option
									key={key}
									value={key}
									selected={key === welcome.template}
								>
									{option.label}
								</option>
							))}
						</SelectControl>
					</label>
					<FormActions>
						<Button type="submit">{t`Save welcome settings`}</Button>
						<Button
							type="submit"
							formAction="/api/settings/welcome/preview"
							formTarget="welcome-bmp-preview"
							tone="secondary"
						>
							{t`Preview BMP`}
						</Button>
						<Button
							type="submit"
							formAction="/api/settings/welcome/regenerate"
							data-confirm={t`Regenerate welcome screen and playlist?`}
							tone="secondary"
						>
							{t`Regenerate`}
						</Button>
						<Button
							type="submit"
							formAction="/api/settings/welcome/reset"
							data-confirm={t`Reset welcome settings?`}
							tone="secondary"
						>
							{t`Reset`}
						</Button>
					</FormActions>
				</form>
				<section className={"welcomePreview"} aria-label={t`Welcome preview`}>
					<div
						className={"welcomePreviewCanvas"}
						style={{ aspectRatio: `${template.width}/${template.height}` }}
					>
						<strong>{welcome.title}</strong>
						<span>{welcome.subtitle}</span>
					</div>
					<p>
						{template.width}x{template.height} · {t`monochrome preview`}
					</p>
					<iframe
						name="welcome-bmp-preview"
						title={t`Welcome BMP preview`}
						className={"previewFrame welcomeBmpPreview"}
						data-welcome-bmp-preview
					/>
				</section>
			</div>
			<p className={"mutedText"}>
				{t`When enabled, Tiding creates a welcome screen, adds it to the default playlist, and assigns that playlist to newly registered or unassigned devices.`}
			</p>
		</section>
	);
}
