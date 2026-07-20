const THEME_KEY = "tiding.theme";
const THEMES = ["jade", "slate", "amber", "dark"];

function setTheme(theme: string) {
	const next = THEMES.includes(theme) ? theme : "jade";
	document.documentElement.dataset.theme = next;
	try {
		localStorage.setItem(THEME_KEY, next);
	} catch {}
	// Cookie Store is not available in all supported browsers; the server reads this cookie.
	// biome-ignore lint/suspicious/noDocumentCookie: compatibility fallback
	document.cookie = `tiding_theme=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function hydrateNavState() {
	const current = window.location.pathname;
	document
		.querySelectorAll<HTMLAnchorElement>("[data-nav-link]")
		.forEach((link) => {
			const href = link.getAttribute("href") || "";
			const selected = current === href || current.startsWith(`${href}/`);
			if (!selected) return;
			link.setAttribute("aria-current", "page");
			link.dataset.state = "active";
		});
}

export function hydrateThemePicker() {
	const picker = document.querySelector<HTMLSelectElement>(
		"[data-theme-picker]",
	);
	let theme = "jade";
	try {
		theme = localStorage.getItem(THEME_KEY) || theme;
	} catch {}
	if (picker) picker.value = theme;
	setTheme(theme);
	picker?.addEventListener("change", () => setTheme(picker.value));
	hydrateNavState();
}
