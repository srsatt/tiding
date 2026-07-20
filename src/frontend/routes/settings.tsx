import { t } from "ttag";
import type { Setting } from "../../db/repositories/settings.repository";
import type { CompatibilitySchemaReport } from "../../db/schema";
import { TabsShell } from "../design-system/tabs";
import { CompatibilityReportPanel } from "../features/settings/compatibility-report";
import { RenderingSettingsPanel } from "../features/settings/rendering-settings";
import {
	RuntimeSettingsPanel,
	SystemSettingsPanel,
} from "../features/settings/runtime-settings";
import { SecuritySettingsPanel } from "../features/settings/security-settings";
import { WelcomeSettingsPanel } from "../features/settings/welcome-settings";
import type { AdminPageOptions } from "../types";
import { Page } from "../ui";

export function renderSettingsPage(
	options: AdminPageOptions,
	settings: Setting[],
	compatibility: CompatibilitySchemaReport,
) {
	return Page({
		title: t`Settings`,
		children: (
			<>
				<header className={"pageHeader"}>
					<h1>{t`Settings`}</h1>
				</header>
				<TabsShell
					defaultValue="runtime"
					items={[
						{
							value: "runtime",
							label: t`Runtime`,
							children: <RuntimeSettingsPanel settings={settings} />,
						},
						{
							value: "security",
							label: t`Security`,
							children: <SecuritySettingsPanel settings={settings} />,
						},
						{
							value: "welcome",
							label: t`Welcome`,
							children: <WelcomeSettingsPanel settings={settings} />,
						},
						{
							value: "rendering",
							label: t`Rendering`,
							children: (
								<RenderingSettingsPanel settings={settings} options={options} />
							),
						},
						{
							value: "compatibility",
							label: t`Compatibility`,
							children: <CompatibilityReportPanel report={compatibility} />,
						},
						{
							value: "system",
							label: t`System`,
							children: <SystemSettingsPanel options={options} />,
						},
					]}
				/>
			</>
		),
	});
}
