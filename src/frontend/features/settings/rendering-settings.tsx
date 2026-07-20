import { t } from "ttag";
import type { Setting } from "../../../db/repositories/settings.repository";
import {
	RENDER_DEFAULTS,
	renderSettingsFromRows,
} from "../../../services/render-settings";
import { Button } from "../../design-system/buttons";
import {
	NumberField,
	SelectControl,
} from "../../design-system/native-controls";
import type { AdminPageOptions } from "../../types";
import { CollapsibleSection, FormActions } from "../../ui";

const troubleshooting = [
	["device", t`Device connection`, t`Verify Wi-Fi, server URL, and HTTP_ID.`],
	[
		"loading",
		t`Loading screen`,
		t`Regenerate preview and check render cache path.`,
	],
	[
		"offline",
		t`Offline dashboard`,
		t`Refresh status and confirm the admin port.`,
	],
	[
		"updates",
		t`Screen not updating`,
		t`Check playlist assignment and refresh rate.`,
	],
	["setup", t`Re-setup`, t`Use the setup image and register the device again.`],
];
export function RenderingSettingsPanel({
	settings,
	options,
}: {
	settings: Setting[];
	options: AdminPageOptions;
}) {
	const render = renderSettingsFromRows(settings);
	const checkedAt = new Date().toISOString();
	return (
		<section className={"panel renderSettings"}>
			<h2>{t`E-ink Rendering`}</h2>
			<form action="/api/settings" method="POST" className={"formGrid"}>
				<label htmlFor="render-dither-mode">
					{t`Dithering mode`}
					<SelectControl id="render-dither-mode" name="render_dither_mode">
						<option
							value="floyd-steinberg"
							selected={render.ditherMode === "floyd-steinberg"}
						>
							Floyd-Steinberg
						</option>
						<option
							value="threshold"
							selected={render.ditherMode === "threshold"}
						>
							{t`Threshold`}
						</option>
						<option
							value="grayscale"
							selected={render.ditherMode === "grayscale"}
						>
							{t`Grayscale`}
						</option>
					</SelectControl>
				</label>
				<NumberField
					label={t`Threshold`}
					name="render_threshold"
					min="0"
					max="255"
					value={render.threshold}
				/>
				<FormActions>
					<Button type="submit">{t`Save rendering settings`}</Button>
					<Button
						type="submit"
						formAction="/api/settings/render-preview"
						formTarget="render-bmp-preview"
						tone="secondary"
					>
						{t`Preview BMP`}
					</Button>
					<Button
						type="submit"
						name="render_threshold"
						value={String(RENDER_DEFAULTS.threshold)}
						tone="secondary"
					>
						{t`Default`}
					</Button>
					<Button
						type="submit"
						name="render_threshold"
						value="255"
						tone="secondary"
					>
						{t`Non-white to black`}
					</Button>
				</FormActions>
			</form>
			<section className={"renderPreview"} aria-label={t`Render preview`}>
				<iframe
					name="render-bmp-preview"
					title={t`Rendering BMP preview`}
					className={"previewFrame renderBmpPreview"}
					data-render-bmp-preview
				/>
			</section>
			<section className={"statusPanel"} data-island="server-status">
				<h3>{t`Server Status`}</h3>
				<dl className={"facts"}>
					<dt>{t`State`}</dt>
					<dd data-server-status-field="state">{t`Online`}</dd>
					<dt>{t`Server IP`}</dt>
					<dd data-server-status-field="serverIp">{t`localhost`}</dd>
					<dt>{t`Device URL`}</dt>
					<dd>
						<code data-server-status-field="deviceUrl">
							{`http://localhost:${options.port}/api/display`}
						</code>
					</dd>
					<dt>{t`Last checked`}</dt>
					<dd data-server-status-field="lastChecked">{checkedAt}</dd>
				</dl>
				<Button
					type="button"
					tone="secondary"
					data-server-status-refresh="/api/settings/server-status"
				>
					{t`Refresh`}
				</Button>
			</section>
			<h3>{t`Troubleshooting`}</h3>
			{troubleshooting.map(([value, title, body]) => (
				<CollapsibleSection
					key={value}
					title={title}
					value={`trouble-${value}`}
				>
					<p>{body}</p>
				</CollapsibleSection>
			))}
		</section>
	);
}
