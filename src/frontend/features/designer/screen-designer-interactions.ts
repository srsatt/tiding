import {
	hydrateDesignerLayerButtons,
	hydrateDesignerRotateButtons,
} from "./screen-designer-buttons";
import { hydrateDesignerCanvasWidgets } from "./screen-designer-controls";
import { hydrateDesignerKeyboard } from "./screen-designer-keyboard";
import { hydrateDesignerProperties } from "./screen-designer-property-controls";
import {
	hydrateDesignerDelete,
	hydrateDesignerPaletteSearch,
	hydrateDesignerSelection,
} from "./screen-designer-selection";
import { hydrateDesignerToolbar } from "./screen-designer-toolbar";

function hydrateDesignerSnapToggle(root: HTMLElement) {
	root
		.querySelectorAll<HTMLButtonElement>("[data-snap-toggle]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const enabled = root.dataset.snap !== "true";
				root.dataset.snap = String(enabled);
				button.setAttribute("aria-pressed", String(enabled));
				button.dataset.state = enabled ? "checked" : "unchecked";
			});
		});
}

export function hydrateDesignerInteractions(
	root: HTMLElement,
	canvas: HTMLElement,
) {
	hydrateDesignerCanvasWidgets(canvas);
	hydrateDesignerKeyboard(root, canvas);
	hydrateDesignerLayerButtons(root);
	hydrateDesignerRotateButtons(root);
	hydrateDesignerSelection(root);
	hydrateDesignerProperties(root);
	hydrateDesignerDelete(root);
	hydrateDesignerPaletteSearch(root);
	hydrateDesignerSnapToggle(root);
	hydrateDesignerToolbar(root);
}
