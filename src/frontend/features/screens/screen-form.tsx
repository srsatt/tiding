import { t } from "ttag";
import type { ScreenDesign } from "../../../db/repositories/screen-design.repository";
import {
	NumberField,
	RadioField,
	TextField,
} from "../../design-system/native-controls";
import { Button, ButtonLink, DeleteButton, FormActions } from "../../ui";

const PRESETS = [
	{ label: t`TRMNL Standard`, value: "standard", width: 800, height: 480 },
	{ label: t`TRMNL Portrait`, value: "portrait", width: 480, height: 800 },
	{ label: t`Custom`, value: "custom", width: 800, height: 480 },
];

function selectedPreset(screen?: ScreenDesign) {
	if (!screen) return "standard";
	if (screen.width === 800 && screen.height === 480) return "standard";
	if (screen.width === 480 && screen.height === 800) return "portrait";
	return "custom";
}

export function ScreenDesignForm({ screen }: { screen?: ScreenDesign }) {
	const action = screen
		? `/api/screen-designs/${screen.id}`
		: "/api/screen-designs";
	const preset = selectedPreset(screen);
	const customWidth = screen?.width ?? 800;
	const customHeight = screen?.height ?? 480;
	return (
		<form
			action={action}
			method="POST"
			className={"formGrid"}
			data-resolution-form
		>
			{screen ? <input type="hidden" name="_method" value="PATCH" /> : null}
			<TextField
				label={t`Name`}
				name="name"
				value={screen?.name ?? ""}
				required
			/>
			<fieldset className={"resolutionPicker wide"}>
				<legend>{t`Resolution`}</legend>
				<div className={"resolutionOptions"}>
					{PRESETS.map((option) => {
						const width =
							option.value === "custom" ? customWidth : option.width;
						const height =
							option.value === "custom" ? customHeight : option.height;
						return (
							<RadioField
								key={option.value}
								className={"resolutionCard"}
								name="resolutionPreset"
								value={option.value}
								checked={preset === option.value}
								data-width={option.width}
								data-height={option.height}
								label={
									<>
										<span>{option.label}</span>
										<small>
											<span
												data-resolution-custom-size={
													option.value === "custom" ? "" : undefined
												}
											>
												{width} × {height}
											</span>
										</small>
									</>
								}
							/>
						);
					})}
				</div>
			</fieldset>
			<NumberField
				label={t`Width`}
				name="width"
				value={screen?.width ?? 800}
				min="1"
				required={!screen}
				data-resolution-width
			/>
			<NumberField
				label={t`Height`}
				name="height"
				value={screen?.height ?? 480}
				min="1"
				required={!screen}
				data-resolution-height
			/>
			<TextField
				label={t`Background`}
				type="color"
				name="background"
				value={screen?.background ?? "#FFFFFF"}
			/>
			<FormActions>
				<Button type="submit">{screen ? t`Save` : t`Create`}</Button>
				{screen ? (
					<DeleteButton action={`/api/screen-designs/${screen.id}`} />
				) : (
					<ButtonLink href="/screens" variant="secondary">
						{t`Cancel`}
					</ButtonLink>
				)}
			</FormActions>
		</form>
	);
}
