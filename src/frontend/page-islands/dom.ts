import { hydrateCustomWidgetWizards } from "../features/custom-widgets/custom-widget-wizard-island";
import {
	hydrateCopyButtons,
	hydrateCustomWidgetSelects,
	hydrateDeleteConfirms,
	hydratePlainJsonEditors,
	hydrateResolutionPresets,
	hydrateScreenPreview,
} from "../island-dom";
import { hydrateServerStatus } from "../server-status-island";
import { hydrateWidgetConfigFields } from "../widget-config-island";

export function hydrateDomPage() {
	hydratePlainJsonEditors();
	hydrateScreenPreview();
	hydrateResolutionPresets();
	hydrateCustomWidgetSelects();
	hydrateCustomWidgetWizards();
	hydrateCopyButtons();
	hydrateDeleteConfirms();
	hydrateWidgetConfigFields();
	hydrateServerStatus();
}
