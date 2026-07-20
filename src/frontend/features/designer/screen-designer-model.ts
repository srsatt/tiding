import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { Widget } from "../../../db/repositories/widget.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { frameworkWidgetInstance } from "../../../shared/framework-widget-instance";
import {
	parseWidgetConfig,
	styleFromConfig,
} from "../../../shared/widget-config";

export type DesignerWidget = Widget & {
	displayLabel: string;
	detailLabel: string;
	fontSize: number;
	opacity: number;
	textAlign: string;
};

export function designerWidgets(
	widgets: Widget[],
	templates: WidgetTemplate[],
	customWidgets: CustomWidget[],
): DesignerWidget[] {
	const templatesById = new Map(
		templates.map((template) => [template.id, template]),
	);
	return widgets.map((widget) => {
		const config = parseWidgetConfig(widget.config);
		const template = templatesById.get(widget.template_id);
		const instance = frameworkWidgetInstance({
			config,
			template,
			customWidgets,
		});
		const style = styleFromConfig(config);
		const displayLabel =
			String(config.label || config.text || "") ||
			instance.label ||
			`#${widget.id}`;
		return {
			...widget,
			displayLabel,
			detailLabel: instance.category,
			...style,
		};
	});
}
