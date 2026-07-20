import { hydrateDesignerInteractions } from "./screen-designer-interactions";
import {
	addDesignerPaletteWidget,
	paletteClickPosition,
	paletteDropPosition,
	payloadFromPaletteData,
	payloadFromPaletteItem,
} from "./screen-designer-palette-add";

function hydratePalette(root: HTMLElement, canvas: HTMLElement) {
	root.querySelectorAll<HTMLElement>(".paletteItem").forEach((item) => {
		item.addEventListener("click", (event) => {
			const payload = payloadFromPaletteItem(item);
			if (!payload) return;
			event.preventDefault();
			void addDesignerPaletteWidget(
				root,
				payload,
				paletteClickPosition(canvas, payload),
			);
		});
		item.addEventListener("dragstart", (event) => {
			event.dataTransfer?.setData(
				"application/json",
				item.dataset.createPayload || "",
			);
		});
	});
	canvas.addEventListener("dragenter", () => {
		canvas.dataset.dropActive = "true";
	});
	canvas.addEventListener("dragover", (event) => event.preventDefault());
	canvas.addEventListener("dragleave", () => {
		delete canvas.dataset.dropActive;
	});
	canvas.addEventListener("drop", async (event) => {
		event.preventDefault();
		delete canvas.dataset.dropActive;
		const payload = payloadFromPaletteData(
			event.dataTransfer?.getData("application/json"),
		);
		if (!payload) return;
		await addDesignerPaletteWidget(
			root,
			payload,
			paletteDropPosition(canvas, event),
		);
	});
}

export function hydrateScreenDesigner() {
	document
		.querySelectorAll<HTMLElement>('[data-island="screen-designer"]')
		.forEach((root) => {
			const canvas = root.querySelector<HTMLElement>(".designerCanvas");
			if (!canvas) return;
			hydratePalette(root, canvas);
			hydrateDesignerInteractions(root, canvas);
		});
}
