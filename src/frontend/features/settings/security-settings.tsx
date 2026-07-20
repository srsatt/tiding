import { t } from "ttag";
import type { Setting } from "../../../db/repositories/settings.repository";
import { Button } from "../../design-system/buttons";
import { CheckboxField, TextField } from "../../design-system/native-controls";
import { settingValue } from "../../format";
import { FormActions } from "../../ui";

function hasToken(settings: Setting[]) {
	return Boolean(settingValue(settings, "github_api_token", ""));
}

export function SecuritySettingsPanel({ settings }: { settings: Setting[] }) {
	const allowLocal = settingValue(
		settings,
		"data_source_allow_local_network",
		"true",
	);
	return (
		<section className={"panel"}>
			<h2>{t`API Tokens And Network Security`}</h2>
			<form action="/api/settings" method="POST" className={"formGrid"}>
				<div className={"wide stackedField"}>
					<TextField
						label={t`GitHub API token`}
						type="password"
						name="github_api_token"
						placeholder={hasToken(settings) ? "******" : "ghp_..."}
						autoComplete="off"
					/>
					<span className={"mutedText"}>
						{hasToken(settings)
							? t`Token saved. Leave blank to keep it.`
							: t`Used for GitHub Stars requests to avoid anonymous rate limits.`}
					</span>
				</div>
				<input
					type="hidden"
					name="data_source_allow_local_network"
					value="false"
				/>
				<CheckboxField
					className={"wide inlineToggle"}
					name="data_source_allow_local_network"
					value="true"
					checked={allowLocal === "true"}
					label={t`Allow local network data sources`}
				/>
				<p className={"wide mutedText"}>
					{t`Turn this off to block localhost and private IP data sources. Metadata service hostnames remain blocked.`}
				</p>
				<FormActions>
					<Button type="submit">{t`Save security settings`}</Button>
					<Button
						type="submit"
						formAction="/api/settings/github-token/test"
						formMethod="POST"
						tone="secondary"
					>
						{t`Test GitHub Token`}
					</Button>
				</FormActions>
			</form>
		</section>
	);
}
