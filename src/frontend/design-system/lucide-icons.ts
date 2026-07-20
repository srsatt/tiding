export const LUCIDE_ICON_VERSION = "1.23.0";

export const LUCIDE_ICON_NAMES = [
	"battery",
	"blocks",
	"bring-to-front",
	"calendar-clock",
	"cloud-sun",
	"file-text",
	"gauge",
	"image",
	"layers",
	"layout-template",
	"list-video",
	"menu",
	"minus",
	"monitor",
	"palette",
	"panel-top",
	"plug",
	"plus",
	"puzzle",
	"qr-code",
	"rotate-ccw",
	"rotate-cw",
	"scan",
	"send-to-back",
	"separator-horizontal",
	"settings",
	"square",
	"timer",
	"wifi",
	"zoom-in",
	"zoom-out",
] as const;

export type LucideIconName = (typeof LUCIDE_ICON_NAMES)[number];
export type IconAsset =
	`/static/icons/lucide-${typeof LUCIDE_ICON_VERSION}/${LucideIconName}.svg`;

function iconAsset(name: LucideIconName): IconAsset {
	return `/static/icons/lucide-${LUCIDE_ICON_VERSION}/${name}.svg`;
}

export const batteryIcon = iconAsset("battery");
export const blocksIcon = iconAsset("blocks");
export const bringToFrontIcon = iconAsset("bring-to-front");
export const calendarClockIcon = iconAsset("calendar-clock");
export const cloudSunIcon = iconAsset("cloud-sun");
export const fileTextIcon = iconAsset("file-text");
export const gaugeIcon = iconAsset("gauge");
export const imageIcon = iconAsset("image");
export const layersIcon = iconAsset("layers");
export const layoutTemplateIcon = iconAsset("layout-template");
export const listVideoIcon = iconAsset("list-video");
export const menuIcon = iconAsset("menu");
export const minusIcon = iconAsset("minus");
export const monitorIcon = iconAsset("monitor");
export const paletteIcon = iconAsset("palette");
export const panelTopIcon = iconAsset("panel-top");
export const plugIcon = iconAsset("plug");
export const plusIcon = iconAsset("plus");
export const puzzleIcon = iconAsset("puzzle");
export const qrCodeIcon = iconAsset("qr-code");
export const rotateCcwIcon = iconAsset("rotate-ccw");
export const rotateCwIcon = iconAsset("rotate-cw");
export const scanIcon = iconAsset("scan");
export const sendToBackIcon = iconAsset("send-to-back");
export const separatorHorizontalIcon = iconAsset("separator-horizontal");
export const settingsIcon = iconAsset("settings");
export const squareIcon = iconAsset("square");
export const timerIcon = iconAsset("timer");
export const wifiIcon = iconAsset("wifi");
export const zoomInIcon = iconAsset("zoom-in");
export const zoomOutIcon = iconAsset("zoom-out");
