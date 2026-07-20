import { t } from "ttag";

export function widgetCountLabel(count: number) {
	return count === 1 ? t`1 widget` : `${count} ${t`widgets`}`;
}

export function syncDesignerWidgetCount(root: HTMLElement) {
	const count = root.querySelectorAll(".designerWidget").length;
	const metric = root.querySelector<HTMLElement>(
		"[data-designer-widget-count]",
	);
	if (metric) metric.textContent = widgetCountLabel(count);
	const emptyState = root.querySelector<HTMLElement>(
		"[data-designer-empty-state]",
	);
	if (emptyState) emptyState.hidden = count > 0;
}
