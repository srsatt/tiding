type PageHydrator = () => void;

let statusTimer: ReturnType<typeof setTimeout> | undefined;

export function setShellStatus(message: string, state = "saved") {
	const status = document.querySelector<HTMLOutputElement>(
		"[data-shell-status]",
	);
	if (!status) return;
	if (statusTimer) clearTimeout(statusTimer);
	status.textContent = message;
	status.dataset.state = state;
	status.hidden = false;
	statusTimer = setTimeout(() => {
		status.hidden = true;
	}, 3000);
}

export function updateActiveNavigation() {
	const current = window.location.pathname;
	document
		.querySelectorAll<HTMLAnchorElement>("[data-nav-link]")
		.forEach((link) => {
			const href = link.getAttribute("href") || "";
			const selected = current === href || current.startsWith(`${href}/`);
			link.toggleAttribute("aria-current", selected);
			if (selected) {
				link.setAttribute("aria-current", "page");
				link.dataset.state = "active";
			} else delete link.dataset.state;
		});
}

function focusPage(outlet: HTMLElement) {
	outlet.scrollTo({ top: 0, left: 0 });
	window.scrollTo({ top: 0, left: 0 });
	const heading = outlet.querySelector<HTMLElement>("h1");
	if (!heading) return;
	heading.tabIndex = -1;
	heading.focus({ preventScroll: true });
	heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), {
		once: true,
	});
}

export async function installPageResponse({
	response,
	outlet,
	hydratePage,
	push,
	formSubmission,
}: {
	response: Response;
	outlet: HTMLElement;
	hydratePage: PageHydrator;
	push: boolean;
	formSubmission: boolean;
}) {
	if (
		!response.ok ||
		!response.headers.get("content-type")?.includes("text/html")
	)
		return false;
	const page = new DOMParser().parseFromString(
		await response.text(),
		"text/html",
	);
	const nextOutlet = page.querySelector<HTMLElement>("[data-page-outlet]");
	if (!nextOutlet) return false;
	outlet.replaceChildren(...Array.from(nextOutlet.childNodes));
	document.title = page.title;
	const destination = response.url || window.location.href;
	if (push) {
		const replace = formSubmission && destination === window.location.href;
		history[replace ? "replaceState" : "pushState"]({}, "", destination);
	}
	updateActiveNavigation();
	document
		.querySelectorAll<HTMLDetailsElement>("[data-nav-menu][open]")
		.forEach((menu) => {
			menu.removeAttribute("open");
		});
	hydratePage();
	focusPage(outlet);
	return true;
}
