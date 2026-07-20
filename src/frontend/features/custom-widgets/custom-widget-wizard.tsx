import { t } from "ttag";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { discoverJsonFields } from "../../../services/data-source-context";
import {
	DataSourceSelect,
	DisplayTypeSelect,
} from "../../design-system/form-controls";
import { TextareaField, TextField } from "../../design-system/native-controls";
import { Button, ButtonLink } from "../../ui";
import { CustomWidgetWizardPreview } from "./custom-widget-wizard-preview";
import { WizardSourceDetails } from "./custom-widget-wizard-source";
import { WizardStepper } from "./custom-widget-wizard-steps";

function selectedSource(sources: DataSource[], selectedId?: number) {
	return (
		sources.find((source) => source.id === selectedId) ??
		sources.find((source) => source.last_data) ??
		sources[0]
	);
}

function fieldRows(source?: DataSource) {
	if (!source?.last_data) return [];
	const text =
		typeof source.last_data === "string"
			? source.last_data
			: JSON.stringify(source.last_data);
	return discoverJsonFields(text).slice(0, 24);
}

function defaultTemplate(displayType: string) {
	if (displayType === "framework") {
		return 'return <div style={{display:"flex", gap:"8px", alignItems:"center"}}><Icon name="check" size={24} />{$.value ?? $.data ?? "No data"}</div>';
	}
	if (displayType === "script") return "return $.items ?? $";
	return "{{data}}";
}

export function CustomWidgetWizard({
	sources,
	selectedSourceId,
}: {
	sources: DataSource[];
	selectedSourceId?: number;
}) {
	const source = selectedSource(sources, selectedSourceId);
	const fields = fieldRows(source);
	return (
		<form
			action="/api/custom-widgets"
			method="POST"
			className={"wizardGrid"}
			data-custom-widget-wizard
		>
			<section className={"panel wizardMain wide"}>
				<WizardStepper />
				<p className={"mutedText"}>
					{t`Work through one step at a time. Your draft stays in place as you move between steps.`}
				</p>
			</section>
			<section
				className={"panel wizardMain wizardStep"}
				id="wizard-source-step"
			>
				<h2>
					{t`Step 1`} · {t`Data Source`}
				</h2>
				<label htmlFor="wizard-source">
					{t`Data source`}
					<DataSourceSelect
						id="wizard-source"
						sources={sources}
						selected={source?.id}
					/>
				</label>
				<Button
					type="submit"
					formNoValidate
					formMethod="GET"
					formAction="/custom-widgets/new"
				>
					{t`Load Source`}
				</Button>
				<WizardSourceDetails source={source} fields={fields} />
			</section>
			<section
				className={"panel wizardMain wizardStep"}
				id="wizard-display-step"
				hidden
			>
				<h2>
					{t`Step 2`} · {t`Display Type`}
				</h2>
				<label htmlFor="wizard-display-type">
					{t`Display type`}
					<DisplayTypeSelect id="wizard-display-type" selected="framework" />
				</label>
			</section>
			<section
				className={"panel wizardMain wizardStep"}
				id="wizard-context-step"
				hidden
			>
				<h2>
					{t`Step 3`} · {t`Widget Context`}
				</h2>
				<TextareaField
					label={t`Widget context JSON Schema`}
					name="context_schema"
					data-json-editor
				>
					{"{}"}
				</TextareaField>
			</section>
			<section
				className={"panel wizardMain wizardStep"}
				id="wizard-template-step"
				hidden
			>
				<h2>
					{t`Step 4`} · {t`Template`}
				</h2>
				<TextField label={t`Name`} name="name" required />
				<TextareaField label={t`Template`} name="template" rows={8}>
					{defaultTemplate("framework")}
				</TextareaField>
				<TextareaField label={t`Config JSON`} name="config" data-json-editor>
					{"{}"}
				</TextareaField>
				<input type="hidden" name="step" value="4" />
				<input type="hidden" name="min_width" value="100" />
				<input type="hidden" name="min_height" value="50" />
				<div className={"formActions"}>
					<Button type="submit">{t`Create`}</Button>
					<ButtonLink href="/custom-widgets" variant="secondary">
						{t`Cancel`}
					</ButtonLink>
				</div>
			</section>
			<CustomWidgetWizardPreview />
		</form>
	);
}
