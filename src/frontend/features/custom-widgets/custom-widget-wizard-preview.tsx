import { t } from "ttag";
import { Button } from "../../ui";

export function CustomWidgetWizardPreview() {
	return (
		<section className={"panel"}>
			<div className={"sectionHeader"}>
				<h2>{t`Live Preview`}</h2>
				<Button
					type="submit"
					formNoValidate
					formAction="/api/custom-widgets/preview"
					formTarget="custom-widget-preview"
					tone="secondary"
				>
					{t`Refresh Preview`}
				</Button>
			</div>
			<iframe
				name="custom-widget-preview"
				title={t`Custom widget preview`}
				className={"previewFrame"}
				data-custom-widget-draft-preview
			/>
		</section>
	);
}
