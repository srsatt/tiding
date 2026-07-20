export type DesignerWidgetPayload = {
	template_id: number;
	config: string;
	width: number;
	height: number;
};

export function serializeDesignerWidgetPayload(payload: DesignerWidgetPayload) {
	return JSON.stringify(payload);
}

export function parseDesignerWidgetPayload(
	value: string | null | undefined,
): DesignerWidgetPayload | null {
	if (!value) return null;
	try {
		const payload = JSON.parse(value) as Partial<DesignerWidgetPayload>;
		const templateId = payload.template_id;
		if (!Number.isInteger(templateId) || (templateId ?? 0) <= 0) {
			return null;
		}
		return {
			template_id: templateId ?? 0,
			config: typeof payload.config === "string" ? payload.config : "{}",
			width: positiveNumber(payload.width, 200),
			height: positiveNumber(payload.height, 100),
		};
	} catch {
		return null;
	}
}

function positiveNumber(value: unknown, fallback: number) {
	return typeof value === "number" && Number.isFinite(value) && value > 0
		? value
		: fallback;
}
