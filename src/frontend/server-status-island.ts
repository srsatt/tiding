import { t } from "ttag";

type ServerStatusResponse = {
	ok?: boolean;
	data?: Record<string, string | number>;
};

function setField(root: HTMLElement, field: string, value: unknown) {
	const element = root.querySelector<HTMLElement>(
		`[data-server-status-field="${field}"]`,
	);
	if (element) element.textContent = String(value ?? "");
}

export function hydrateServerStatus() {
	document
		.querySelectorAll<HTMLElement>('[data-island="server-status"]')
		.forEach((root) => {
			const button = root.querySelector<HTMLButtonElement>(
				"[data-server-status-refresh]",
			);
			if (!button) return;
			button.addEventListener("click", async () => {
				const url = button.dataset.serverStatusRefresh;
				if (!url) return;
				button.disabled = true;
				try {
					const response = await fetch(url, {
						headers: { Accept: "application/json" },
					});
					const body = (await response.json()) as ServerStatusResponse;
					if (!response.ok || !body.data) throw new Error("status unavailable");
					for (const [field, value] of Object.entries(body.data)) {
						setField(root, field, value);
					}
				} catch {
					setField(root, "state", t`Unavailable`);
				} finally {
					button.disabled = false;
				}
			});
		});
}
