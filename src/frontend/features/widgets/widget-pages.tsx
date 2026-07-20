import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { Widget } from "../../../db/repositories/widget.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { WidgetForm } from "./widget-form";

export function WidgetEditorPage({
	cancelHref,
	customWidgets,
	screenId,
	templates,
	widget,
}: {
	cancelHref: string;
	customWidgets: CustomWidget[];
	screenId: number;
	templates: WidgetTemplate[];
	widget?: Widget;
}) {
	const title = widget ? t`Edit Widget ${widget.id}` : t`Add Widget`;
	return (
		<>
			<header className={"pageHeader"}>
				<h1>{title}</h1>
			</header>
			<section className={"panel"}>
				<WidgetForm
					screenId={screenId}
					widget={widget}
					templates={templates}
					customWidgets={customWidgets}
					cancelHref={cancelHref}
				/>
			</section>
		</>
	);
}
