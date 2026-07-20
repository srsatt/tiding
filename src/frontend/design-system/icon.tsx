import type { JSX } from "preact";
import type { IconAsset } from "./lucide-icons";

export function Icon({
	asset,
	label,
	className = "icon",
}: {
	asset: IconAsset;
	label?: string;
	className?: string;
}) {
	const style = {
		"--icon-url": `url("${asset}")`,
	} as JSX.CSSProperties;
	if (label) {
		return (
			<span className={className} style={style} aria-label={label} role="img" />
		);
	}
	return <span className={className} style={style} aria-hidden="true" />;
}
