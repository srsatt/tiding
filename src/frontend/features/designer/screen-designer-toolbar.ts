import { t } from "ttag";
import { setDesignerStatus } from "./screen-designer-status";

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5];

function zoomIndex(root: HTMLElement) {
	const current = Number(root.dataset.zoom || 1);
	const found = ZOOM_STEPS.indexOf(current);
	return found >= 0 ? found : ZOOM_STEPS.indexOf(1);
}

function applyZoom(root: HTMLElement, zoom: number, announce = true) {
	root.dataset.zoom = String(zoom);
	root.style.setProperty("--designer-zoom", String(zoom));
	const value = root.querySelector<HTMLElement>("[data-designer-zoom-value]");
	const percent = `${Math.round(zoom * 100)}%`;
	if (value) value.textContent = percent;
	if (announce) setDesignerStatus(root, `${t`Zoom`} ${percent}`);
}

function initialZoom(root: HTMLElement) {
	const viewport = root.querySelector<HTMLElement>(".designerCanvasViewport");
	if (!viewport) return 1;
	if (viewport.clientWidth < 520) return 0.5;
	if (viewport.clientWidth < 720) return 0.75;
	return 1;
}

function hydrateDesignerZoom(root: HTMLElement) {
	applyZoom(root, initialZoom(root), false);
	root
		.querySelectorAll<HTMLButtonElement>("[data-designer-zoom-action]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const action = button.dataset.designerZoomAction;
				const index = zoomIndex(root);
				if (action === "out")
					applyZoom(root, ZOOM_STEPS[Math.max(0, index - 1)]);
				if (action === "in") {
					applyZoom(
						root,
						ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, index + 1)],
					);
				}
				if (action === "reset") applyZoom(root, 1);
			});
		});
}

function hydrateDesignerStatus(root: HTMLElement) {
	root
		.querySelectorAll<HTMLButtonElement>("[data-snap-toggle]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const enabled = root.dataset.snap === "true";
				setDesignerStatus(root, enabled ? t`Snap on` : t`Snap off`);
			});
		});
}

function hydrateDesignerGridToggle(root: HTMLElement) {
	root.dataset.grid = root.dataset.grid || "true";
	root
		.querySelectorAll<HTMLButtonElement>("[data-grid-toggle]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const enabled = root.dataset.grid !== "true";
				root.dataset.grid = String(enabled);
				button.setAttribute("aria-pressed", String(enabled));
				button.dataset.state = enabled ? "checked" : "unchecked";
				setDesignerStatus(root, enabled ? t`Grid on` : t`Grid off`);
			});
		});
}

function hydrateDesignerSaveAction(root: HTMLElement) {
	root
		.querySelectorAll<HTMLButtonElement>("[data-designer-save]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const panel = root.querySelector<HTMLElement>("[data-selection-panel]");
				const apply = root.querySelector<HTMLButtonElement>(
					"[data-selection-save]",
				);
				if (panel && !panel.hidden && apply) {
					apply.click();
					return;
				}
				button.dataset.saveState = "saved";
				setDesignerStatus(root, t`Layout already saved`, "saved");
			});
		});
}

export function hydrateDesignerToolbar(root: HTMLElement) {
	hydrateDesignerZoom(root);
	hydrateDesignerGridToggle(root);
	hydrateDesignerStatus(root);
	hydrateDesignerSaveAction(root);
}
