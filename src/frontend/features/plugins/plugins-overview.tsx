import { t } from "ttag";

export function PluginsOverview() {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{t`Plugins`}</h1>
					<p>{t`Homelab integrations and plugin widgets are a planned extension surface.`}</p>
				</div>
			</header>
			<section className={"panel"}>
				<h2>{t`Coming Soon`}</h2>
				<p>
					{t`Plugins will bring server monitoring, smart home dashboards, network stats, and other self-hosted integrations to e-ink displays.`}
				</p>
			</section>
			<section className={"panel"}>
				<h2>{t`Current Status`}</h2>
				<dl className={"facts"}>
					<dt>{t`Plugin management`}</dt>
					<dd>{t`Not implemented yet`}</dd>
					<dt>{t`Plugin widget`}</dt>
					<dd>{t`Visible in the designer as an unsupported future widget`}</dd>
					<dt>{t`Use today`}</dt>
					<dd>{t`Use data sources and custom widgets for dynamic integrations.`}</dd>
				</dl>
			</section>
		</>
	);
}
