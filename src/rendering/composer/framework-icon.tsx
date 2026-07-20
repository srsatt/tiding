import { __iconNode as battery } from "lucide-react/dist/esm/icons/battery.mjs";
import { __iconNode as calendar } from "lucide-react/dist/esm/icons/calendar-days.mjs";
import { __iconNode as check } from "lucide-react/dist/esm/icons/check.mjs";
import { __iconNode as gauge } from "lucide-react/dist/esm/icons/circle-gauge.mjs";
import { __iconNode as clock } from "lucide-react/dist/esm/icons/clock.mjs";
import { __iconNode as cloudSun } from "lucide-react/dist/esm/icons/cloud-sun.mjs";
import { __iconNode as image } from "lucide-react/dist/esm/icons/image.mjs";
import { __iconNode as qrCode } from "lucide-react/dist/esm/icons/qr-code.mjs";
import { __iconNode as timer } from "lucide-react/dist/esm/icons/timer.mjs";
import { __iconNode as wifi } from "lucide-react/dist/esm/icons/wifi.mjs";
import { h } from "preact";

const ICON_NODES = {
	battery,
	calendar,
	check,
	clock,
	"cloud-sun": cloudSun,
	gauge,
	image,
	"qr-code": qrCode,
	timer,
	wifi,
} as const;

export type FrameworkIconName = keyof typeof ICON_NODES;

export function FrameworkIcon({
	name,
	size = 24,
	label,
}: {
	name: FrameworkIconName;
	size?: number;
	label?: string;
}) {
	const nodes = ICON_NODES[name] ?? ICON_NODES.gauge;
	const dimension = Math.max(8, Math.round(Number(size) || 24));
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={dimension}
			height={dimension}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden={label ? undefined : "true"}
			aria-label={label}
			data-icon={name}
			style={{ flex: "0 0 auto" }}
		>
			{nodes.map(([tag, attributes], index) =>
				h(tag, { ...attributes, key: attributes.key ?? `${name}-${index}` }),
			)}
		</svg>
	);
}
