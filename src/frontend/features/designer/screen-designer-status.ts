export function setDesignerStatus(
	root: HTMLElement,
	text: string,
	state: "ready" | "saved" | "error" = "ready",
) {
	const status = root.querySelector<HTMLElement>("[data-designer-status]");
	if (!status) return;
	status.textContent = text;
	status.dataset.designerStatusState = state;
}

export function setDesignerSelectionSummary(root: HTMLElement, text: string) {
	const summary = root.querySelector<HTMLElement>(
		"[data-designer-selection-summary]",
	);
	if (summary) summary.textContent = text;
}
