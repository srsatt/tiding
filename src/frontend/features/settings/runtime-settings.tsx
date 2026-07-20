import { t } from "ttag";
import type { Setting } from "../../../db/repositories/settings.repository";
import { Button } from "../../design-system/buttons";
import { NumberField } from "../../design-system/native-controls";
import { settingValue } from "../../format";
import type { AdminPageOptions } from "../../types";
import { FormActions } from "../../ui";

export function RuntimeSettingsPanel({ settings }: { settings: Setting[] }) {
	const dataSourceTimeoutMs = settingValue(
		settings,
		"data_source_timeout_ms",
		"2000",
	);
	return (
		<section className={"panel"}>
			<h2>{t`Runtime Settings`}</h2>
			<form action="/api/settings" method="POST" className={"formGrid"}>
				<NumberField
					label={t`Data source timeout`}
					name="data_source_timeout_ms"
					value={dataSourceTimeoutMs}
					min="250"
					max="60000"
				/>
				<FormActions>
					<Button type="submit">{t`Save settings`}</Button>
				</FormActions>
			</form>
		</section>
	);
}

export function SystemSettingsPanel({
	options,
}: {
	options: AdminPageOptions;
}) {
	return (
		<section className={"panel"}>
			<h2>{t`System`}</h2>
			<dl className={"facts"}>
				<dt>{t`Database path`}</dt>
				<dd>
					<code>{options.dbPath}</code>
				</dd>
				<dt>{t`Render cache`}</dt>
				<dd>
					<code>{options.cachePath}</code>
				</dd>
				<dt>{t`Port`}</dt>
				<dd>
					<code>{options.port}</code>
				</dd>
				<dt>{t`Version`}</dt>
				<dd>
					<code>{options.version}</code>
				</dd>
				<dt>{t`Renderer`}</dt>
				<dd>{t`Takumi, BMP output, 1-bit monochrome`}</dd>
				<dt>MCP</dt>
				<dd>{options.mcpEnabled ? t`Enabled` : t`Disabled by default`}</dd>
				<dt>{t`Runtime`}</dt>
				<dd>{t`Bun native, SQLite, no Prisma or NestJS`}</dd>
			</dl>
		</section>
	);
}
