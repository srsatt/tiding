import type { ComponentChildren } from "preact";
import { t } from "ttag";
import { Button, ButtonLink } from "../../design-system/buttons";
import {
	NumberField,
	SelectControl,
} from "../../design-system/native-controls";

export function ScreenDesignerProperties({
	children,
}: {
	children?: ComponentChildren;
}) {
	return (
		<div className={"designerSelection"}>
			<p data-selection-empty>{t`No selection`}</p>
			<div data-selection-panel hidden>
				<h3 data-selection-label>{t`Selected widget`}</h3>
				<div className={"propertyGrid"}>
					<NumberField label={t`X`} min="0" data-property-field="x" />
					<NumberField label={t`Y`} min="0" data-property-field="y" />
					<NumberField label={t`Width`} min="1" data-property-field="width" />
					<NumberField label={t`Height`} min="1" data-property-field="height" />
					<NumberField label={t`Layer`} data-property-field="zIndex" />
					<NumberField
						label={t`Rotation`}
						step="1"
						data-property-field="rotation"
					/>
					<NumberField
						label={t`Font`}
						min="6"
						max="96"
						data-property-field="fontSize"
					/>
					<NumberField
						label={t`Opacity`}
						min="0.1"
						max="1"
						step="0.1"
						data-property-field="opacity"
					/>
					<label htmlFor="designer-text-align">
						{t`Align`}
						<SelectControl
							id="designer-text-align"
							data-property-field="textAlign"
						>
							<option value="left">{t`Left`}</option>
							<option value="center">{t`Center`}</option>
							<option value="right">{t`Right`}</option>
						</SelectControl>
					</label>
				</div>
				<p className={"propertySummary"}>
					<span data-selection-position />
					<span data-selection-size />
					<span data-selection-rotation />
				</p>
				{children}
				<div className={"actions"}>
					<ButtonLink href="/screens" variant="secondary" data-selection-edit>
						{t`Configure`}
					</ButtonLink>
					<Button type="button" size="sm" data-selection-save>
						{t`Apply`}
					</Button>
					<Button type="button" tone="danger" data-selection-delete>
						{t`Delete`}
					</Button>
				</div>
			</div>
		</div>
	);
}
