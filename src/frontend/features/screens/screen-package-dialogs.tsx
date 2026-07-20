import type { ComponentChildren } from "preact";
import { t } from "ttag";
import type { ScreenPackage } from "../../../services/screen-package";
import { TextareaField } from "../../design-system/native-controls";
import { Button } from "../../ui";

function ArkDialog({
	title,
	trigger,
	variant = "secondary",
	children,
}: {
	title: string;
	trigger: string;
	variant?: "secondary" | "small";
	children: ComponentChildren;
}) {
	return (
		<div
			className={"dialogFallback"}
			data-island="ark-dialog"
			data-props={JSON.stringify({ title, trigger, variant })}
		>
			<Button
				type="button"
				tone={variant === "secondary" ? "secondary" : "primary"}
				size={variant === "small" ? "sm" : "md"}
			>
				{trigger}
			</Button>
			<div data-dialog-content hidden>
				{children}
			</div>
		</div>
	);
}

export function ImportScreenPackageDialog() {
	return (
		<ArkDialog title={t`Import Screen Package`} trigger={t`Import`}>
			<form action="/api/screen-designs/import" method="POST">
				<TextareaField
					label={t`Screen Code`}
					id="screenPackage"
					name="package"
					rows={12}
					placeholder={t`Paste exported screen JSON`}
				/>
				<div className={"formActions"}>
					<Button type="submit">{t`Import`}</Button>
				</div>
			</form>
		</ArkDialog>
	);
}

export function ExportScreenPackageDialog({ pkg }: { pkg: ScreenPackage }) {
	const code = JSON.stringify(pkg, null, 2);
	return (
		<ArkDialog title={t`Screen Package`} trigger={t`Copy Code`}>
			<TextareaField
				label={t`Screen Code`}
				id="screenPackageExport"
				rows={16}
				readOnly
				data-copy-source="screen-package"
			>
				{code}
			</TextareaField>
			<div className={"formActions"}>
				<Button type="button" data-copy-target="screen-package">
					{t`Copy`}
				</Button>
			</div>
		</ArkDialog>
	);
}
