import type { ComponentChildren, JSX } from "preact";

function classes(...values: unknown[]) {
	return values.filter(Boolean).map(String).join(" ");
}
type SelectProps = JSX.IntrinsicElements["select"] & {
	children: ComponentChildren;
	wrapperClass?: string;
};

export function SelectControl({
	children,
	wrapperClass,
	...props
}: SelectProps) {
	return (
		<span
			className={classes("parkSelect", wrapperClass)}
			data-scope="select"
			data-part="root"
			data-park-variant="surface"
		>
			<select {...props} data-part="control">
				{children}
			</select>
		</span>
	);
}
type NumberFieldProps = Omit<JSX.IntrinsicElements["input"], "type"> & {
	label: ComponentChildren;
};

type TextFieldProps = Omit<JSX.IntrinsicElements["input"], "type"> & {
	label: ComponentChildren;
	type?: "color" | "password" | "search" | "text" | "url";
};

function FieldRoot({
	children,
	className,
	controlId,
	scope,
}: {
	children: ComponentChildren;
	className?: unknown;
	controlId: string;
	scope: string;
}) {
	return (
		<label
			className={classes("parkField", className)}
			htmlFor={controlId}
			data-scope={scope}
			data-part="root"
			data-park-variant="surface"
		>
			{children}
		</label>
	);
}
function controlId(
	props: { id?: unknown; name?: unknown },
	label: ComponentChildren,
) {
	if (typeof props.id === "string" && props.id) return props.id;
	if (typeof props.name === "string" && props.name) return props.name;
	return `field-${String(label)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")}`;
}
type TextareaFieldProps = JSX.IntrinsicElements["textarea"] & {
	label: ComponentChildren;
};

export function TextField({
	label,
	className,
	type = "text",
	...props
}: TextFieldProps) {
	const id = controlId(props, label);
	return (
		<FieldRoot className={className} controlId={id} scope="text-field">
			<span data-part="label">{label}</span>
			<input {...props} id={id} type={type} data-part="control" />
		</FieldRoot>
	);
}

export function TextareaField({
	children,
	label,
	className,
	...props
}: TextareaFieldProps) {
	const id = controlId(props, label);
	return (
		<FieldRoot className={className} controlId={id} scope="textarea-field">
			<span data-part="label">{label}</span>
			<textarea {...props} id={id} data-part="control">
				{children}
			</textarea>
		</FieldRoot>
	);
}

export function NumberField({ label, className, ...props }: NumberFieldProps) {
	const id = controlId(props, label);
	return (
		<FieldRoot className={className} controlId={id} scope="number-field">
			<span data-part="label">{label}</span>
			<input {...props} id={id} type="number" data-part="control" />
		</FieldRoot>
	);
}

type ChoiceProps = Omit<JSX.IntrinsicElements["input"], "type"> & {
	label: ComponentChildren;
};

function ChoiceField({
	className,
	label,
	type,
	...props
}: ChoiceProps & { type: "checkbox" | "radio" }) {
	return (
		<label
			className={classes("parkChoice", className)}
			data-scope={type}
			data-part="root"
			data-park-variant="surface"
		>
			<input {...props} type={type} data-part="native-control" />
			<span className="parkChoiceControl" data-part="control" />
			<span className="parkChoiceLabel" data-part="label">
				{label}
			</span>
		</label>
	);
}

export function CheckboxField(props: ChoiceProps) {
	return <ChoiceField {...props} type="checkbox" />;
}

export function RadioField(props: ChoiceProps) {
	return <ChoiceField {...props} type="radio" />;
}
