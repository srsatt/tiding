import { hydratePersistentNavigation } from "./navigation-island";
import { hydrateThemePicker } from "./theme-island";

let pageHydration = 0;

function has(selector: string) {
	return document.querySelector(selector) !== null;
}

function hydratePageIslands() {
	const hydration = ++pageHydration;
	const current = (run: () => void) => {
		if (hydration === pageHydration) run();
	};

	if (
		has(
			'[data-island="ark-collapsible"], [data-island="ark-dialog"], [data-island="ark-tabs"]',
		)
	) {
		void import("./page-islands/ark").then(({ hydrateArkPage }) =>
			current(hydrateArkPage),
		);
	}

	if (has('[data-island="screen-designer"]')) {
		void import("./page-islands/designer").then(({ hydrateDesignerPage }) =>
			current(hydrateDesignerPage),
		);
	}

	if (
		has(
			'[data-json-editor], [data-island="screen-preview"], [data-resolution-form], [data-custom-widget-select], [data-custom-widget-wizard], [data-copy-target], [data-confirm], [data-framework-config-root], [data-island="server-status"]',
		)
	) {
		void import("./page-islands/dom").then(({ hydrateDomPage }) =>
			current(hydrateDomPage),
		);
	}
}

hydratePageIslands();
hydrateThemePicker();
hydratePersistentNavigation(hydratePageIslands);
