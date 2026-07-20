export function refreshWidgetPreview(widget: HTMLElement) {
	const preview = widget.querySelector<HTMLImageElement>(
		"[data-widget-preview]",
	);
	if (!preview) return;
	const source = new URL(preview.src, window.location.href);
	source.searchParams.set("t", String(Date.now()));
	preview.src = source.toString();
}
