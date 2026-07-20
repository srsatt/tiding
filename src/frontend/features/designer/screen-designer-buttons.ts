import { t } from "ttag";
import { configWithRotation } from "../../../shared/widget-config";
import { syncDesignerRow } from "./screen-designer-state";
import { setDesignerStatus } from "./screen-designer-status";

export function hydrateDesignerLayerButtons(root: HTMLElement) {
	root
		.querySelectorAll<HTMLButtonElement>("[data-layer-url]")
		.forEach((button) => {
			button.addEventListener("click", async () => {
				const widget = root.querySelector<HTMLElement>(
					`.designerWidget[data-widget-id="${button.dataset.widgetId}"]`,
				);
				if (!widget) return;
				const layers = Array.from(
					root.querySelectorAll<HTMLElement>(".designerWidget"),
				).map((item) => Number(item.dataset.zIndex || 0));
				const target =
					button.dataset.layerAction === "back"
						? Math.min(...layers) - 1
						: Math.max(...layers) + 1;
				const response = await fetch(button.dataset.layerUrl || "", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ z_index: target }),
				});
				if (response.ok) {
					widget.style.zIndex = String(target);
					widget.dataset.zIndex = String(target);
					syncDesignerRow(root, widget);
				}
				button.dataset.saveState = response.ok ? "saved" : "error";
				setDesignerStatus(
					root,
					response.ok ? t`Layer saved` : t`Layer save failed`,
					response.ok ? "saved" : "error",
				);
			});
		});
}

export function hydrateDesignerRotateButtons(root: HTMLElement) {
	root
		.querySelectorAll<HTMLButtonElement>("[data-rotate-url]")
		.forEach((button) => {
			button.addEventListener("click", async () => {
				const widget = root.querySelector<HTMLElement>(
					`.designerWidget[data-widget-id="${button.dataset.widgetId}"]`,
				);
				if (!widget) return;
				const rotation =
					Number(widget.dataset.rotation || 0) +
					Number(button.dataset.rotationDelta || 0);
				const config = configWithRotation(
					widget.dataset.config || "{}",
					rotation,
				);
				const response = await fetch(button.dataset.rotateUrl || "", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ config }),
				});
				if (response.ok) {
					widget.dataset.config = config;
					widget.dataset.rotation = String(rotation);
					widget.style.transform = `rotate(${rotation}deg)`;
				}
				button.dataset.saveState = response.ok ? "saved" : "error";
				setDesignerStatus(
					root,
					response.ok ? t`Rotation saved` : t`Rotation save failed`,
					response.ok ? "saved" : "error",
				);
			});
		});
}
