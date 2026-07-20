import { t } from "ttag";
import { PluginsOverview } from "../features/plugins/plugins-overview";
import { Page } from "../ui";

export function renderPluginsPage() {
	return Page({
		title: t`Plugins`,
		children: <PluginsOverview />,
	});
}
