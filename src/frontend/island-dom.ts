import { t } from "ttag";

export function hydratePlainJsonEditors() {
	document
		.querySelectorAll<HTMLTextAreaElement>("[data-json-editor]")
		.forEach((el) => {
			const validate = () => {
				try {
					JSON.parse(el.value || "{}");
					el.dataset.jsonState = "valid";
					el.setCustomValidity("");
				} catch {
					el.dataset.jsonState = "invalid";
					el.setCustomValidity(t`Invalid JSON`);
				}
			};
			el.addEventListener("input", validate);
			validate();
		});
}

export function hydrateScreenPreview() {
	document
		.querySelectorAll<HTMLElement>('[data-island="screen-preview"]')
		.forEach((root) => {
			const img = root.querySelector("img");
			const props = JSON.parse(root.getAttribute("data-props") || "{}") as {
				src?: string;
			};
			const button = document.createElement("button");
			button.type = "button";
			button.className = "button";
			button.textContent = t`Refresh Preview`;
			button.addEventListener("click", () => {
				if (!img || !props.src) return;
				const separator = props.src.includes("?") ? "&" : "?";
				img.src = `${props.src}${separator}t=${Date.now()}`;
			});
			root.append(button);
		});
}

export function hydrateCustomWidgetSelects() {
	document
		.querySelectorAll<HTMLSelectElement>("[data-custom-widget-select]")
		.forEach((select) => {
			const form = select.closest("form");
			const config = form?.querySelector<HTMLTextAreaElement>(
				'textarea[name="config"]',
			);
			const template = form?.querySelector<HTMLSelectElement>(
				'select[name="template_id"]',
			);
			if (!config) return;
			select.addEventListener("change", () => {
				let parsed: Record<string, unknown> = {};
				try {
					parsed = JSON.parse(config.value || "{}") as Record<string, unknown>;
				} catch {
					return;
				}
				if (select.value)
					parsed.customWidgetId = Number.parseInt(select.value, 10);
				else delete parsed.customWidgetId;
				if (select.value && template && select.dataset.customWidgetTemplateId) {
					template.value = select.dataset.customWidgetTemplateId;
					template.dispatchEvent(new Event("change", { bubbles: true }));
				}
				config.value = JSON.stringify(parsed, null, 2);
				config.dispatchEvent(new Event("input", { bubbles: true }));
			});
		});
}

export function hydrateDeleteConfirms() {
	document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
		form.addEventListener("submit", (event) => {
			const submitter = event.submitter as HTMLElement | null;
			const message = submitter?.dataset.confirm || form.dataset.confirm;
			if (message && !confirm(message)) event.preventDefault();
		});
	});
}

export function hydrateResolutionPresets() {
	document
		.querySelectorAll<HTMLFormElement>("[data-resolution-form]")
		.forEach((form) => {
			const width = form.querySelector<HTMLInputElement>(
				"[data-resolution-width]",
			);
			const height = form.querySelector<HTMLInputElement>(
				"[data-resolution-height]",
			);
			const customSize = form.querySelector<HTMLElement>(
				"[data-resolution-custom-size]",
			);
			const syncCustomSize = () => {
				if (customSize && width && height) {
					customSize.textContent = `${width.value} × ${height.value}`;
				}
			};
			form.addEventListener("change", (event) => {
				const target = event.target as HTMLInputElement | null;
				if (target?.name !== "resolutionPreset" || target.value === "custom")
					return;
				if (!width || !height) return;
				width.value = target.dataset.width || width.value;
				height.value = target.dataset.height || height.value;
				syncCustomSize();
			});
			for (const input of [width, height]) {
				input?.addEventListener("input", () => {
					const custom = form.querySelector<HTMLInputElement>(
						'input[name="resolutionPreset"][value="custom"]',
					);
					if (custom) custom.checked = true;
					syncCustomSize();
				});
			}
			syncCustomSize();
		});
}

export function hydrateCopyButtons() {
	document
		.querySelectorAll<HTMLElement>("[data-copy-target]")
		.forEach((button) => {
			button.addEventListener("click", async () => {
				const key = button.dataset.copyTarget;
				const source = document.querySelector<HTMLTextAreaElement>(
					`[data-copy-source="${key}"]`,
				);
				if (!source) return;
				await navigator.clipboard?.writeText(source.value);
				button.dataset.copyState = "copied";
				button.textContent = t`Copied`;
			});
		});
}
