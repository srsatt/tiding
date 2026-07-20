import { t } from "ttag";
import { hydrateFormNavigation } from "./navigation-form";
import {
	installPageResponse,
	setShellStatus,
	updateActiveNavigation,
} from "./navigation-page";

type PageHydrator = () => void;

function navigableLink(event: MouseEvent) {
	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	)
		return null;
	const target = event.target as Element | null;
	const link = target?.closest<HTMLAnchorElement>("a[href]");
	if (
		!link ||
		link.target ||
		link.download ||
		link.dataset.noShellNavigation !== undefined
	)
		return null;
	const url = new URL(link.href, window.location.href);
	if (url.origin !== window.location.origin || url.pathname.startsWith("/api/"))
		return null;
	const current = new URL(window.location.href);
	if (
		url.hash &&
		url.pathname === current.pathname &&
		url.search === current.search
	)
		return null;
	return url;
}

export function hydratePersistentNavigation(hydratePage: PageHydrator) {
	const outlet = document.querySelector<HTMLElement>("[data-page-outlet]");
	if (!outlet || document.documentElement.dataset.navigationHydrated === "true")
		return;
	document.documentElement.dataset.navigationHydrated = "true";
	let pending: AbortController | null = null;

	const navigate = async (url: URL, push: boolean, init: RequestInit = {}) => {
		pending?.abort();
		const controller = new AbortController();
		pending = controller;
		outlet.dataset.navigationState = "loading";
		outlet.setAttribute("aria-busy", "true");
		try {
			const headers = new Headers(init.headers);
			headers.set("X-Tiding-Navigation", "shell");
			const response = await fetch(url, {
				...init,
				headers,
				signal: controller.signal,
			});
			const installed = await installPageResponse({
				response,
				outlet,
				hydratePage,
				push,
				formSubmission: Boolean(init.method),
			});
			if (!installed) throw new Error(`Navigation failed: ${response.status}`);
			if (init.method === "POST") setShellStatus(t`Changes saved`);
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			if (init.method) setShellStatus(t`Request failed`, "error");
			else window.location.assign(url);
		} finally {
			if (pending === controller) {
				pending = null;
				delete outlet.dataset.navigationState;
				outlet.removeAttribute("aria-busy");
			}
		}
	};

	document.addEventListener("click", (event) => {
		const url = navigableLink(event);
		if (!url) return;
		event.preventDefault();
		void navigate(url, true);
	});
	window.addEventListener("popstate", () => {
		void navigate(new URL(window.location.href), false);
	});
	hydrateFormNavigation((url, init) => navigate(url, true, init));
	updateActiveNavigation();
}
