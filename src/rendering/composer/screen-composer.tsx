import type { DatabaseService } from "../../db";
import type { Widget } from "../../db/repositories/widget.repository";
import type { WidgetTemplate } from "../../db/repositories/widget-template.repository";
import { enrichGithubStarsConfig } from "../../services/github-stars";
import { frameworkWidgetInstance } from "../../shared/framework-widget-instance";
import {
	parseWidgetConfig,
	widgetDitherModeFromConfig,
} from "../../shared/widget-config";
import type { DitherRegion } from "../bmp/mono-pixels";
import {
	renderCustomWidgetContent,
	renderCustomWidgetFrame,
} from "./custom-widget-content";
import {
	type FrameworkRenderContext,
	renderFrameworkWidget,
} from "./framework-widgets";
import {
	CustomWidgetPreviewFrame,
	renderScreenDocument,
	ScreenWidgetFrame,
} from "./screen-document";

export class ScreenComposer {
	constructor(
		private db: DatabaseService,
		private fetcher: typeof fetch = globalThis.fetch,
	) {}

	async composeCustomWidgetHtml(
		customWidgetId: number,
	): Promise<{ html: string; width: number; height: number }> {
		const customWidget = await this.db.customWidgets.findById(customWidgetId);
		if (!customWidget) throw new Error("Custom widget not found");

		const content = await renderCustomWidgetContent(this.db, customWidget, {});
		const width = Math.max(1, customWidget.min_width || 100);
		const height = Math.max(1, customWidget.min_height || 50);

		return {
			width,
			height,
			html: renderScreenDocument({
				background: "#ffffff",
				bodyBackground: "#ffffff",
				width,
				height,
				children: (
					<CustomWidgetPreviewFrame width={width} height={height}>
						{content}
					</CustomWidgetPreviewFrame>
				),
			}),
		};
	}

	async composeHtml(
		screenId: number,
		context: FrameworkRenderContext = { now: new Date() },
	): Promise<{
		html: string;
		width: number;
		height: number;
		ditherRegions: DitherRegion[];
	}> {
		const screen = await this.db.screens.findById(screenId);
		if (!screen) throw new Error("Screen not found");

		const [widgets, templates] = await Promise.all([
			this.db.widgets.findByScreenDesign(screenId),
			this.db.templates.findAll(),
		]);
		const templatesById = new Map(
			templates.map((template) => [template.id, template]),
		);

		const renderedWidgets = [];
		const ditherRegions: DitherRegion[] = [];
		for (const widget of widgets) {
			const config = parseWidgetConfig(widget.config);
			const ditherMode = widgetDitherModeFromConfig(config);
			if (ditherMode !== "inherit") {
				ditherRegions.push({
					x: widget.x,
					y: widget.y,
					width: widget.width,
					height: widget.height,
					ditherMode,
				});
			}
			const content = await this.renderWidgetContent(
				widget,
				config,
				templatesById.get(widget.template_id),
				context,
			);
			renderedWidgets.push(
				<ScreenWidgetFrame key={widget.id} widget={widget} config={config}>
					{content}
				</ScreenWidgetFrame>,
			);
		}

		const html = renderScreenDocument({
			background: screen.background,
			bodyBackground: screen.background,
			width: screen.width,
			height: screen.height,
			children: renderedWidgets,
		});

		return {
			html,
			width: screen.width,
			height: screen.height,
			ditherRegions,
		};
	}

	async composeWidgetHtml(widgetId: number): Promise<{
		html: string;
		width: number;
		height: number;
		ditherRegions: DitherRegion[];
	}> {
		const widget = await this.db.widgets.findById(widgetId);
		if (!widget) throw new Error("Widget not found");
		const [screen, template] = await Promise.all([
			this.db.screens.findById(widget.screen_design_id),
			this.db.templates.findById(widget.template_id),
		]);
		if (!screen) throw new Error("Screen not found");

		const config = parseWidgetConfig(widget.config);
		const content = await this.renderWidgetContent(
			widget,
			config,
			template ?? undefined,
			{ now: new Date() },
		);
		const width = Math.max(1, widget.width);
		const height = Math.max(1, widget.height);
		const ditherMode = widgetDitherModeFromConfig(config);
		return {
			width,
			height,
			ditherRegions:
				ditherMode === "inherit"
					? []
					: [{ x: 0, y: 0, width, height, ditherMode }],
			html: renderScreenDocument({
				background: screen.background,
				bodyBackground: screen.background,
				width,
				height,
				children: (
					<ScreenWidgetFrame widget={{ ...widget, x: 0, y: 0 }} config={config}>
						{content}
					</ScreenWidgetFrame>
				),
			}),
		};
	}

	private async renderWidgetContent(
		widget: Widget,
		config: Record<string, unknown>,
		template?: WidgetTemplate,
		context: FrameworkRenderContext = { now: new Date() },
	) {
		const instance = frameworkWidgetInstance({ config, template });
		if (instance.kind === "custom-js") {
			return renderCustomWidgetFrame(
				this.db,
				widget,
				config,
				instance.customWidgetId,
			);
		}

		const frameworkConfig =
			instance.frameworkName === "github"
				? await enrichGithubStarsConfig(this.db, config, this.fetcher)
				: config;
		return renderFrameworkWidget(
			instance.frameworkName,
			frameworkConfig,
			widget.id,
			context,
		);
	}
}
