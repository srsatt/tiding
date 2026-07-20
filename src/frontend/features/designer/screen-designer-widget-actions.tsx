import { t } from "ttag";
import { Icon } from "../../design-system/icon";
import {
	bringToFrontIcon,
	type IconAsset,
	rotateCcwIcon,
	rotateCwIcon,
	sendToBackIcon,
} from "../../design-system/lucide-icons";
import { IconButton } from "../../ui";
import type { DesignerWidget } from "./screen-designer-model";

function LayerButton({
	widget,
	action,
	icon,
	label,
}: {
	widget: DesignerWidget;
	action: "back" | "front";
	icon: IconAsset;
	label: string;
}) {
	return (
		<IconButton
			type="button"
			tone="secondary"
			size="sm"
			title={label}
			aria-label={label}
			data-layer-url={`/api/widgets/${widget.id}`}
			data-widget-id={widget.id}
			data-layer-action={action}
		>
			<Icon asset={icon} />
		</IconButton>
	);
}

function RotationButton({
	widget,
	delta,
	icon,
	label,
}: {
	widget: DesignerWidget;
	delta: number;
	icon: IconAsset;
	label: string;
}) {
	return (
		<IconButton
			type="button"
			tone="secondary"
			size="sm"
			title={label}
			aria-label={label}
			data-rotate-url={`/api/widgets/${widget.id}`}
			data-widget-id={widget.id}
			data-rotation-delta={delta}
		>
			<Icon asset={icon} />
		</IconButton>
	);
}

export function ScreenDesignerWidgetActions({
	widget,
}: {
	widget: DesignerWidget;
}) {
	return (
		<div className={"designerIconActions"}>
			<LayerButton
				widget={widget}
				action="back"
				icon={sendToBackIcon}
				label={t`Send to back`}
			/>
			<LayerButton
				widget={widget}
				action="front"
				icon={bringToFrontIcon}
				label={t`Bring to front`}
			/>
			<RotationButton
				widget={widget}
				delta={-15}
				icon={rotateCcwIcon}
				label={t`Rotate left`}
			/>
			<RotationButton
				widget={widget}
				delta={15}
				icon={rotateCwIcon}
				label={t`Rotate right`}
			/>
		</div>
	);
}
