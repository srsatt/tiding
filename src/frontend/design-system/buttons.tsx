import type { ComponentChildren, JSX } from "preact";
import { t } from "ttag";

function classes(...values: Array<string | false | null | undefined>) {
	return values.filter(Boolean).join(" ");
}

type Tone = "primary" | "secondary" | "danger";
type Size = "md" | "sm";

function parkVariant(tone: Tone) {
	return tone === "secondary" ? "surface" : "solid";
}

function buttonClass(tone: Tone, size: Size, className?: string) {
	return classes(
		"button",
		tone === "secondary" && "secondary",
		tone === "danger" && "danger",
		size === "sm" && "small",
		className,
	);
}

type ButtonProps = Omit<JSX.IntrinsicElements["button"], "className"> & {
	className?: string;
	tone?: Tone;
	size?: Size;
};

export function Button({
	children,
	className,
	tone = "primary",
	size = "md",
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			className={buttonClass(tone, size, className)}
			data-park-variant={parkVariant(tone)}
			data-park-size={size === "sm" ? "sm" : undefined}
		>
			{children}
		</button>
	);
}

export function IconButton(props: ButtonProps) {
	return (
		<Button {...props} className={classes("iconButton", props.className)} />
	);
}

export function ButtonLink({
	href,
	children,
	variant,
	...props
}: Omit<JSX.IntrinsicElements["a"], "className"> & {
	children: ComponentChildren;
	variant?: "secondary" | "danger" | "small" | "smallSecondary";
}) {
	const tone =
		variant === "secondary" || variant === "smallSecondary"
			? "secondary"
			: variant === "danger"
				? "danger"
				: "primary";
	const size =
		variant === "small" || variant === "smallSecondary" ? "sm" : "md";
	return (
		<a
			{...props}
			className={buttonClass(tone, size)}
			data-park-variant={parkVariant(tone)}
			data-park-size={size === "sm" ? "sm" : undefined}
			href={href}
		>
			{children}
		</a>
	);
}

export function DeleteForm({ action }: { action: string }) {
	return (
		<form
			action={action}
			method="POST"
			className={"inlineForm"}
			data-confirm={t`Delete this item?`}
		>
			<input type="hidden" name="_method" value="DELETE" />
			<Button type="submit" tone="danger">
				{t`Delete`}
			</Button>
		</form>
	);
}

export function DeleteButton({ action }: { action: string }) {
	return (
		<Button
			type="submit"
			tone="danger"
			data-confirm={t`Delete this item?`}
			name="_method"
			value="DELETE"
			formMethod="POST"
			formAction={action}
		>
			{t`Delete`}
		</Button>
	);
}

export function FormActions({ children }: { children: ComponentChildren }) {
	return <div className={"formActions"}>{children}</div>;
}
