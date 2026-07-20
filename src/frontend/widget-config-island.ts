function parseConfig(textarea: HTMLTextAreaElement) {
	try {
		return JSON.parse(textarea.value || "{}") as Record<string, unknown>;
	} catch {
		return null;
	}
}

function inputValue(input: HTMLInputElement) {
	const type = input.dataset.configType || input.dataset.contextType;
	if (type === "number") {
		const value = Number(input.value);
		return Number.isFinite(value) ? value : input.value;
	}
	if (type === "checkbox") return input.checked;
	return input.value;
}

function syncVisibility(root: HTMLElement, templateId: string) {
	root
		.querySelectorAll<HTMLElement>("[data-framework-config]")
		.forEach((panel) => {
			panel.hidden = panel.dataset.templateId !== templateId;
		});
}

function syncField(textarea: HTMLTextAreaElement, input: HTMLInputElement) {
	const config = parseConfig(textarea);
	if (!config) return;
	const key = input.dataset.configKey;
	if (!key) return;
	config[key] = inputValue(input);
	textarea.value = JSON.stringify(config, null, 2);
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function syncContextVisibility(root: HTMLElement, customWidgetId: string) {
	root
		.querySelectorAll<HTMLElement>("[data-widget-context]")
		.forEach((panel) => {
			panel.hidden = panel.dataset.customWidgetId !== customWidgetId;
		});
}

function syncContext(textarea: HTMLTextAreaElement, input: HTMLInputElement) {
	const config = parseConfig(textarea);
	if (!config) return;
	const key = input.dataset.contextKey;
	if (!key) return;
	const ctx =
		typeof config.ctx === "object" && config.ctx
			? (config.ctx as Record<string, unknown>)
			: {};
	ctx[key] = inputValue(input);
	config.ctx = ctx;
	textarea.value = JSON.stringify(config, null, 2);
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function hydrateContextFields() {
	document
		.querySelectorAll<HTMLElement>("[data-widget-context-root]")
		.forEach((root) => {
			const form = root.closest("form");
			const customWidget = form?.querySelector<HTMLSelectElement>(
				"[data-custom-widget-select]",
			);
			const config = form?.querySelector<HTMLTextAreaElement>(
				'textarea[name="config"]',
			);
			if (!form || !customWidget || !config) return;

			syncContextVisibility(root, customWidget.value);
			customWidget.addEventListener("change", () =>
				syncContextVisibility(root, customWidget.value),
			);
			root
				.querySelectorAll<HTMLInputElement>("[data-widget-context-input]")
				.forEach((input) => {
					input.addEventListener("input", () => syncContext(config, input));
					input.addEventListener("change", () => syncContext(config, input));
				});
		});
}

export function hydrateWidgetConfigFields() {
	document
		.querySelectorAll<HTMLElement>("[data-framework-config-root]")
		.forEach((root) => {
			const form = root.closest("form");
			const template = form?.querySelector<HTMLSelectElement>(
				'select[name="template_id"]',
			);
			const config = form?.querySelector<HTMLTextAreaElement>(
				'textarea[name="config"]',
			);
			if (!form || !template || !config) return;

			syncVisibility(root, template.value);
			template.addEventListener("change", () =>
				syncVisibility(root, template.value),
			);
			root
				.querySelectorAll<HTMLInputElement>("[data-framework-config-input]")
				.forEach((input) => {
					input.addEventListener("input", () => syncField(config, input));
					input.addEventListener("change", () => syncField(config, input));
				});
		});
	hydrateContextFields();
}
