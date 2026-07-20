import { t } from "ttag";
import { Button } from "../../ui";

const wizardSteps = [
	["wizard-source-step", t`Data Source`],
	["wizard-display-step", t`Display Type`],
	["wizard-context-step", t`Widget Context`],
	["wizard-template-step", t`Template`],
];

export function WizardStepper() {
	return (
		<nav className={"wizardStepper"} aria-label={t`Wizard steps`}>
			{wizardSteps.map(([href, label], index) => (
				<Button
					key={href}
					type="button"
					tone="secondary"
					size="sm"
					aria-controls={href}
					aria-current={index === 0 ? "step" : undefined}
					data-wizard-step-target={href}
				>
					<span>{index + 1}</span>
					{label}
				</Button>
			))}
		</nav>
	);
}
