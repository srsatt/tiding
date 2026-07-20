import { t } from "ttag";
import type { DatabaseService } from "../../db";
import { ScreenEditorPage } from "../features/screens/screen-editor-page";
import { Page } from "../ui";

export async function renderScreenEditorPage(
	db: DatabaseService,
	screenId: number,
) {
	const screen = await db.screens.findById(screenId);
	if (!screen) return null;
	const widgets = await db.widgets.findByScreenDesign(screenId);

	return Page({
		title: t`Edit ${screen.name}`,
		children: <ScreenEditorPage screen={screen} widgets={widgets} />,
	});
}
