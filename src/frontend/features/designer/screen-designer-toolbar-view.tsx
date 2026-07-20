import { t } from "ttag";
import { Icon } from "../../design-system/icon";
import {
	minusIcon,
	plusIcon,
	scanIcon,
	zoomInIcon,
	zoomOutIcon,
} from "../../design-system/lucide-icons";
import {
	SegmentedControl,
	SegmentedItem,
} from "../../design-system/segmented-control";
import { Button, ButtonLink, IconButton } from "../../ui";
import { widgetCountLabel } from "./screen-designer-widget-count";

export function ScreenDesignerToolbar({
	screenId,
	width,
	height,
	widgetCount,
}: {
	screenId: number;
	width: number;
	height: number;
	widgetCount: number;
}) {
	return (
		<div className={"designerToolbar"}>
			<SegmentedControl
				label={t`Canvas tools`}
				className="designerToolGroup"
				labelHidden
			>
				<SegmentedItem checked data-grid-toggle>
					{t`Grid`}
				</SegmentedItem>
				<SegmentedItem data-snap-toggle>{t`Snap`}</SegmentedItem>
				<SegmentedItem disabled>{t`Draw`}</SegmentedItem>
			</SegmentedControl>
			<span className={"designerMetric"}>
				{width} x {height}
			</span>
			<span className={"designerMetric"} data-designer-widget-count>
				{widgetCountLabel(widgetCount)}
			</span>
			<span className={"designerMetric"} data-designer-selection-summary>
				{t`No selection`}
			</span>
			<fieldset className={"designerZoom"}>
				<legend>{t`Canvas zoom`}</legend>
				<IconButton
					type="button"
					tone="secondary"
					size="sm"
					aria-label={t`Zoom out`}
					data-designer-zoom-action="out"
				>
					<Icon asset={zoomOutIcon} />
				</IconButton>
				<Button
					type="button"
					tone="secondary"
					size="sm"
					aria-label={t`Reset zoom`}
					data-designer-zoom-action="reset"
					data-designer-zoom-value
				>
					<Icon asset={scanIcon} />
					100%
				</Button>
				<IconButton
					type="button"
					tone="secondary"
					size="sm"
					aria-label={t`Zoom in`}
					data-designer-zoom-action="in"
				>
					<Icon asset={zoomInIcon} />
				</IconButton>
			</fieldset>
			<span className={"designerStatus"} data-designer-status>
				{t`Ready`}
			</span>
			<Button type="button" size="sm" data-designer-save>
				{t`Save Layout`}
			</Button>
			<ButtonLink
				href={`/api/screen-designs/${screenId}/preview`}
				variant="smallSecondary"
			>
				<Icon asset={scanIcon} />
				{t`Render BMP`}
			</ButtonLink>
			<ButtonLink
				href={`/screens/widgets/new?screenId=${screenId}`}
				variant="smallSecondary"
			>
				<Icon asset={plusIcon} />
				{t`Add Widget`}
			</ButtonLink>
			<ButtonLink href={`/screens/${screenId}`} variant="smallSecondary">
				<Icon asset={minusIcon} />
				{t`Back`}
			</ButtonLink>
		</div>
	);
}
