export function designSize(canvas: HTMLElement) {
	const style = getComputedStyle(canvas);
	return {
		width: Number.parseFloat(style.getPropertyValue("--design-width")),
		height: Number.parseFloat(style.getPropertyValue("--design-height")),
	};
}

export function positionFromEvent(
	canvas: HTMLElement,
	event: Pick<PointerEvent | DragEvent, "clientX" | "clientY">,
	size = { width: 0, height: 0 },
) {
	const rect = canvas.getBoundingClientRect();
	const design = designSize(canvas);
	const left = Math.max(
		0,
		Math.min(event.clientX - rect.left, rect.width - size.width),
	);
	const top = Math.max(
		0,
		Math.min(event.clientY - rect.top, rect.height - size.height),
	);
	return {
		left,
		top,
		x: Math.round((left / rect.width) * design.width),
		y: Math.round((top / rect.height) * design.height),
	};
}

export function clampWidget(widget: HTMLElement, canvas: HTMLElement) {
	const design = designSize(canvas);
	const width = Number(widget.dataset.width || 1);
	const height = Number(widget.dataset.height || 1);
	widget.dataset.x = String(
		Math.max(0, Math.min(Number(widget.dataset.x || 0), design.width - width)),
	);
	widget.dataset.y = String(
		Math.max(
			0,
			Math.min(Number(widget.dataset.y || 0), design.height - height),
		),
	);
}

export function applyWidgetStyle(canvas: HTMLElement, widget: HTMLElement) {
	const design = designSize(canvas);
	clampWidget(widget, canvas);
	widget.style.left = `${(Number(widget.dataset.x || 0) / design.width) * 100}%`;
	widget.style.top = `${(Number(widget.dataset.y || 0) / design.height) * 100}%`;
	widget.style.width = `${(Number(widget.dataset.width || 1) / design.width) * 100}%`;
	widget.style.height = `${(Number(widget.dataset.height || 1) / design.height) * 100}%`;
	widget.style.transform = `rotate(${widget.dataset.rotation || 0}deg)`;
	widget.style.fontSize = `${widget.dataset.fontSize || 12}px`;
	widget.style.opacity = widget.dataset.opacity || "1";
	widget.style.textAlign = widget.dataset.textAlign || "center";
}
