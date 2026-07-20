export function hydrateCustomWidgetWizards() {
	document
		.querySelectorAll<HTMLFormElement>("[data-custom-widget-wizard]")
		.forEach((form) => {
			const steps = Array.from(
				form.querySelectorAll<HTMLElement>(".wizardStep[id]"),
			);
			const triggers = Array.from(
				form.querySelectorAll<HTMLButtonElement>("[data-wizard-step-target]"),
			);
			const show = (id: string) => {
				for (const step of steps) step.hidden = step.id !== id;
				for (const trigger of triggers) {
					if (trigger.dataset.wizardStepTarget === id) {
						trigger.setAttribute("aria-current", "step");
					} else {
						trigger.removeAttribute("aria-current");
					}
				}
			};
			for (const trigger of triggers) {
				trigger.addEventListener("click", () => {
					const id = trigger.dataset.wizardStepTarget;
					if (id) show(id);
				});
			}
		});
}
