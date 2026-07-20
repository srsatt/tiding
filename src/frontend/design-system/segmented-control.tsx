import type { ComponentChildren } from "preact";
import { Button } from "./buttons";

function classes(...values: Array<string | false | null | undefined>) {
	return values.filter(Boolean).join(" ");
}

export function SegmentedControl({
	label,
	children,
	className,
	labelHidden = false,
}: {
	label: ComponentChildren;
	children: ComponentChildren;
	className?: string;
	labelHidden?: boolean;
}) {
	return (
		<fieldset
			className={classes("parkSegmented", className)}
			data-scope="segmented-control"
			data-part="root"
		>
			<legend
				data-part="label"
				data-visibility={labelHidden ? "hidden" : undefined}
			>
				{label}
			</legend>
			<div className="parkSegmentedControl" data-part="control">
				{children}
			</div>
		</fieldset>
	);
}

export function SegmentedItem({
	children,
	checked = false,
	disabled = false,
	...props
}: {
	children: ComponentChildren;
	checked?: boolean;
	disabled?: boolean;
} & Omit<Parameters<typeof Button>[0], "children" | "tone" | "size">) {
	return (
		<Button
			{...props}
			type={props.type ?? "button"}
			tone={checked ? "primary" : "secondary"}
			size="sm"
			disabled={disabled}
			aria-pressed={disabled ? undefined : checked}
			data-part="item"
			data-state={disabled ? "disabled" : checked ? "checked" : "unchecked"}
		>
			{children}
		</Button>
	);
}
