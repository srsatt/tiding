import type { ComponentChildren } from "preact";
import { renderShell } from "./shell";

export {
	Button,
	ButtonLink,
	DeleteButton,
	DeleteForm,
	FormActions,
	IconButton,
} from "./design-system/buttons";

export function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function Page({
	title,
	children,
}: {
	title: string;
	children: ComponentChildren;
}) {
	return renderShell({ title, children });
}

export function EmptyRow({
	colSpan,
	children,
}: {
	colSpan: number;
	children: string;
}) {
	return (
		<tr>
			<td colSpan={colSpan}>{children}</td>
		</tr>
	);
}

export function CollapsibleSection({
	title,
	value,
	defaultOpen = false,
	children,
}: {
	title: string;
	value: string;
	defaultOpen?: boolean;
	children: ComponentChildren;
}) {
	return (
		<section
			className={"panel"}
			data-island="ark-collapsible"
			data-ark-collapsible
			data-props={JSON.stringify({ title, value, defaultOpen })}
		>
			<details open={defaultOpen}>
				<summary>{title}</summary>
				<div data-collapsible-content>{children}</div>
			</details>
		</section>
	);
}
