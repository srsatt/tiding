import type { ComponentChildren } from "preact";
import renderToString from "preact-render-to-string";
import { t } from "ttag";
import { Button } from "./design-system/buttons";
import { Icon } from "./design-system/icon";
import {
	blocksIcon,
	gaugeIcon,
	type IconAsset,
	listVideoIcon,
	menuIcon,
	monitorIcon,
	paletteIcon,
	panelTopIcon,
	puzzleIcon,
	settingsIcon,
} from "./design-system/lucide-icons";
import { SelectControl } from "./design-system/native-controls";

const navItems: Array<[string, string, IconAsset]> = [
	["/dashboard", t`Dashboard`, gaugeIcon],
	["/devices", t`Devices`, monitorIcon],
	["/screens", t`Screens`, panelTopIcon],
	["/playlists", t`Playlists`, listVideoIcon],
	["/plugins", t`Plugins`, puzzleIcon],
	["/extensions", t`Extensions`, blocksIcon],
	["/settings", t`Settings`, settingsIcon],
];

const themeOptions = [
	["jade", t`Jade`],
	["slate", t`Slate`],
	["amber", t`Amber`],
	["dark", t`Dark`],
];

function NavigationLinks({ className }: { className: string }) {
	return (
		<div className={className} data-nav-links>
			{navItems.map(([href, label, icon]) => (
				<a key={href} href={href} data-nav-link={href}>
					<Icon asset={icon} />
					<span>{label}</span>
				</a>
			))}
		</div>
	);
}

const themeBootstrapScript = `(() => {
	const key = "tiding.theme";
	const allowed = new Set(["jade", "slate", "amber", "dark"]);
	let theme = "";
	try {
		theme = localStorage.getItem(key) || "";
	} catch {}
	if (!allowed.has(theme)) {
		const match = document.cookie.match(/(?:^|; )tiding_theme=([^;]+)/);
		theme = match ? decodeURIComponent(match[1]) : "";
	}
	if (allowed.has(theme)) {
		document.documentElement.dataset.theme = theme;
	}
})();`;

export interface ShellProps {
	title: string;
	children: ComponentChildren;
}

export function renderShell({ title, children }: ShellProps) {
	const html = renderToString(
		<html lang="en" data-theme="jade">
			<head>
				<meta charset="UTF-8" />
				<title>
					{title} | {t`Tiding`}
				</title>
				<script
					data-theme-bootstrap
					dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
				/>
				<link rel="stylesheet" href="/static/admin.css" />
				<link rel="icon" type="image/svg+xml" href={gaugeIcon} />
			</head>
			<body>
				<nav className={"nav"} data-persistent-shell>
					<div className={"navBrand"}>
						<strong>{t`Tiding`}</strong>
						<span>{t`Admin Console`}</span>
					</div>
					<NavigationLinks className="navLinks navLinksDesktop" />
					<details className="navMobileMenu" data-nav-menu>
						<summary>
							<Icon asset={menuIcon} />
							<span>{t`Menu`}</span>
						</summary>
						<NavigationLinks className="navLinks navMobileLinks" />
					</details>
					<div className="themePicker">
						<label className="themePickerLabel" htmlFor="theme-picker">
							<Icon asset={paletteIcon} />
							{t`Theme`}
						</label>
						<SelectControl
							id="theme-picker"
							name="theme"
							data-theme-picker
							aria-label={t`Theme`}
						>
							{/** The select is the single source of truth for keyboard and touch input. */}
							{themeOptions.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</SelectControl>
					</div>
					<output
						className="shellStatus"
						data-shell-status
						aria-live="polite"
						hidden
					/>
					<form
						action="/logout"
						method="POST"
						className={"navLogout"}
						data-no-shell-navigation
					>
						<Button type="submit" className={"navLogoutButton"}>
							{t`Logout`}
						</Button>
					</form>
				</nav>
				<main className={"main"} data-page-outlet>
					{children}
				</main>
				<script type="module" src="/static/js/islands.js" />
			</body>
		</html>,
	);
	return `<!DOCTYPE html>${html}`;
}
