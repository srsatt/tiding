export type FormNavigator = (
	url: URL,
	init: RequestInit,
	submitter: HTMLElement | null,
) => Promise<void>;

function formSubmitter(event: SubmitEvent) {
	return event.submitter instanceof HTMLButtonElement ||
		event.submitter instanceof HTMLInputElement
		? event.submitter
		: null;
}

function formRequest(event: SubmitEvent) {
	if (event.defaultPrevented || !(event.target instanceof HTMLFormElement))
		return null;
	const form = event.target;
	const submitter = formSubmitter(event);
	if (form.dataset.noShellNavigation !== undefined) return null;
	const target = submitter?.formTarget || form.target;
	if (target) return null;
	const method = (submitter?.formMethod || form.method || "get").toUpperCase();
	if (method !== "GET" && method !== "POST") return null;
	const action =
		submitter?.getAttribute("formaction") ||
		form.getAttribute("action") ||
		window.location.href;
	const url = new URL(action, window.location.href);
	if (url.origin !== window.location.origin) return null;
	const data = new FormData(form, submitter);
	if (method === "GET") {
		url.search = "";
		for (const [key, value] of data.entries()) {
			if (typeof value === "string") url.searchParams.append(key, value);
		}
		return {
			url,
			init: { headers: { Accept: "text/html" }, method },
			submitter,
		};
	}
	const enctype = submitter?.formEnctype || form.enctype;
	const body =
		enctype === "multipart/form-data"
			? data
			: new URLSearchParams(
					Array.from(data.entries(), ([key, value]) => [key, String(value)]),
				);
	return {
		url,
		init: { body, headers: { Accept: "text/html" }, method },
		submitter,
	};
}

export function hydrateFormNavigation(navigate: FormNavigator) {
	document.addEventListener("submit", (event) => {
		const request = formRequest(event);
		if (!request) return;
		event.preventDefault();
		if (request.submitter) {
			request.submitter.disabled = true;
			request.submitter.setAttribute("aria-busy", "true");
		}
		void navigate(request.url, request.init, request.submitter).finally(() => {
			if (!request.submitter?.isConnected) return;
			request.submitter.disabled = false;
			request.submitter.removeAttribute("aria-busy");
		});
	});
}
