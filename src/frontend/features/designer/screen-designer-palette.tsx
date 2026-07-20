import { t } from "ttag";
import type { CustomWidget } from "../../../db/repositories/custom-widget.repository";
import type { WidgetTemplate } from "../../../db/repositories/widget-template.repository";
import { Icon } from "../../design-system/icon";
import {
	batteryIcon,
	calendarClockIcon,
	cloudSunIcon,
	fileTextIcon,
	type IconAsset,
	imageIcon,
	layersIcon,
	layoutTemplateIcon,
	plugIcon,
	qrCodeIcon,
	separatorHorizontalIcon,
	squareIcon,
	timerIcon,
	wifiIcon,
} from "../../design-system/lucide-icons";
import { TextField } from "../../design-system/native-controls";
import {
	type DesignerPaletteItem,
	frameworkPaletteGroups,
	palettePayload,
} from "./screen-designer-palette-model";
import { serializeDesignerWidgetPayload } from "./screen-designer-payload";

const categoryIcons: Record<string, IconAsset> = {
	content: fileTextIcon,
	custom: layersIcon,
	layout: layoutTemplateIcon,
	plugins: plugIcon,
	system: batteryIcon,
	time: calendarClockIcon,
	weather: cloudSunIcon,
};

const itemIcons: Record<string, IconAsset> = {
	battery: batteryIcon,
	countdown: timerIcon,
	date: calendarClockIcon,
	divider: separatorHorizontalIcon,
	image: imageIcon,
	qrcode: qrCodeIcon,
	rectangle: squareIcon,
	wifi: wifiIcon,
};

function categoryLabel(category: string) {
	const normalized = category.trim().toLowerCase();
	if (normalized === "time") return t`Time & Date`;
	if (normalized === "plugins") return t`Plug-ins`;
	return category.trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categoryIcon(category: string) {
	return categoryIcons[category.trim().toLowerCase()] || layersIcon;
}

function itemIcon(item: DesignerPaletteItem) {
	return itemIcons[item.frameworkName] || categoryIcon(item.category);
}

function PaletteItem({
	item,
	screenId,
}: {
	item: DesignerPaletteItem;
	screenId: number;
}) {
	const payload = palettePayload(item);
	return (
		<a
			className={"paletteItem"}
			href={`/screens/widgets/new?screenId=${screenId}`}
			draggable={Boolean(payload)}
			data-park-variant="surface"
			data-palette-add
			data-framework-kind={item.kind}
			data-framework-name={item.frameworkName}
			data-template-id={item.templateId}
			data-create-payload={
				payload ? serializeDesignerWidgetPayload(payload) : undefined
			}
		>
			<span className="paletteItemIcon" aria-hidden="true">
				<Icon asset={itemIcon(item)} />
			</span>
			<span className="paletteItemBody">
				<span className="paletteItemLabel">{item.label}</span>
				<span className="paletteItemMeta">
					{item.kind === "custom-js-framework"
						? t`Custom`
						: categoryLabel(item.category)}
				</span>
			</span>
		</a>
	);
}

export function ScreenDesignerPalette({
	screenId,
	templates,
	customWidgets,
}: {
	screenId: number;
	templates: WidgetTemplate[];
	customWidgets: CustomWidget[];
}) {
	const groups = frameworkPaletteGroups(templates, customWidgets);
	return (
		<aside className={"designerPalette"} data-framework-palette>
			<header className="designerPaletteHeader">
				<h2>{t`Widgets`}</h2>
				<span className="designerPaletteCount">
					{groups.flatMap((group) => group.items).length}
				</span>
			</header>
			<TextField
				className={"paletteSearch"}
				type="search"
				label={t`Search widgets`}
				placeholder={t`Search widgets`}
				aria-label={t`Search widgets`}
				data-palette-search
			/>
			{groups.map((group) => (
				<section className="designerPaletteGroup" key={group.category}>
					<h3>
						<Icon asset={categoryIcon(group.category)} />
						<span>{categoryLabel(group.category)}</span>
						<small>{group.items.length}</small>
					</h3>
					{group.items.map((item) => (
						<PaletteItem key={item.key} item={item} screenId={screenId} />
					))}
				</section>
			))}
			{customWidgets.length === 0 ? <p>{t`No custom widgets.`}</p> : null}
		</aside>
	);
}
