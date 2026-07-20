import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { exportScreenPackage } from "../../services/screen-package";
import { designerWidgets } from "../features/designer/screen-designer-model";
import { ScreenDesignerPage } from "../features/designer/screen-designer-page";
import { Page } from "../ui";

export async function renderScreenDesignerPage(
	db: DatabaseService,
	screenId: number,
) {
	const screen = await db.screens.findById(screenId);
	if (!screen) return null;
	const [widgets, templates, customWidgets] = await Promise.all([
		db.widgets.findByScreenDesign(screenId),
		db.templates.findAll(),
		db.customWidgets.findAll(),
	]);
	const designerItems = designerWidgets(widgets, templates, customWidgets);
	const screenPackage = await exportScreenPackage(db, screenId);
	return Page({
		title: t`Designer ${screen.name}`,
		children: (
			<ScreenDesignerPage
				customWidgets={customWidgets}
				screen={screen}
				screenPackage={screenPackage}
				templates={templates}
				widgets={designerItems}
			/>
		),
	});
}
