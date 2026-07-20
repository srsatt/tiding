import type { DatabaseService } from "../../db";
import {
	handleError,
	jsonResponse,
	optionalInteger,
	optionalText,
	parseBody,
	redirectResponse,
	requireInteger,
	requireJsonString,
	requireText,
	textResponse,
} from "../http";

export async function handleCustomWidgets(
	req: Request,
	db: DatabaseService,
	invalidateRender?: (screenId: number) => void,
	renderPreview?: (customWidgetId: number) => Promise<Buffer>,
	renderDraftPreview?: (input: {
		name: string;
		data_source_id: number;
		displayType?: string;
		template?: string | null;
		config: string;
		context_schema?: string | null;
		min_width?: number | null;
		min_height?: number | null;
	}) => Promise<Buffer>,
) {
	const url = new URL(req.url);
	const path = url.pathname;
	const method = req.method;
	const idMatch = path.match(/\/api\/custom-widgets\/(\d+)/);
	const id = idMatch ? Number.parseInt(idMatch[1], 10) : null;

	try {
		if (path === "/api/custom-widgets" && method === "GET") {
			const widgets = await db.customWidgets.findAll();
			return jsonResponse(widgets);
		}

		if (path === "/api/custom-widgets/preview" && method === "POST") {
			if (!renderDraftPreview) return textResponse("Preview unavailable", 501);
			const body = await parseBody(req);
			const image = await renderDraftPreview({
				name: requireText(body.name || "Preview", "name"),
				displayType: optionalText(body.displayType),
				template: optionalText(body.template),
				data_source_id: requireInteger(body.data_source_id, "data_source_id"),
				min_width: optionalInteger(body.min_width, "min_width"),
				min_height: optionalInteger(body.min_height, "min_height"),
				config: requireJsonString(body.config, "config"),
				context_schema:
					body.context_schema === undefined
						? undefined
						: requireJsonString(body.context_schema, "context_schema"),
			});
			return new Response(new Uint8Array(image), {
				headers: { "Content-Type": "image/bmp" },
			});
		}

		if (path === "/api/custom-widgets" && method === "POST") {
			const body = await parseBody(req);
			const newId = await db.customWidgets.create({
				...body,
				name: requireText(body.name, "name"),
				description: optionalText(body.description),
				displayType: optionalText(body.displayType),
				template: optionalText(body.template),
				data_source_id: requireInteger(body.data_source_id, "data_source_id"),
				min_width: optionalInteger(body.min_width, "min_width"),
				min_height: optionalInteger(body.min_height, "min_height"),
				config: requireJsonString(body.config, "config"),
				context_schema:
					body.context_schema === undefined
						? undefined
						: requireJsonString(body.context_schema, "context_schema"),
			});
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse(`/custom-widgets/${newId}`);
			return jsonResponse({ id: newId }, { status: 201 });
		}

		if (id && path.endsWith("/preview") && method === "GET") {
			if (!renderPreview) return textResponse("Preview unavailable", 501);
			const widget = await db.customWidgets.findById(id);
			if (!widget) return textResponse("Not Found", 404);
			const image = await renderPreview(id);
			return new Response(new Uint8Array(image), {
				headers: { "Content-Type": "image/bmp" },
			});
		}

		if (id && method === "GET") {
			const widget = await db.customWidgets.findById(id);
			if (!widget) return textResponse("Not Found", 404);
			return jsonResponse(widget);
		}

		if (id && method === "POST") {
			const widget = await db.customWidgets.findById(id);
			if (!widget) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			if (body._method === "PATCH") {
				const affectedWidgets = await db.widgets.findByCustomWidgetId(id);
				await db.customWidgets.update(id, {
					...body,
					name: optionalText(body.name),
					description: optionalText(body.description),
					displayType: optionalText(body.displayType),
					template: optionalText(body.template),
					data_source_id:
						body.data_source_id === undefined
							? undefined
							: requireInteger(body.data_source_id, "data_source_id"),
					min_width: optionalInteger(body.min_width, "min_width"),
					min_height: optionalInteger(body.min_height, "min_height"),
					config:
						body.config === undefined
							? undefined
							: requireJsonString(body.config, "config"),
					context_schema:
						body.context_schema === undefined
							? undefined
							: requireJsonString(body.context_schema, "context_schema"),
				});
				for (const widget of affectedWidgets) {
					invalidateRender?.(widget.screen_design_id);
				}
				return redirectResponse(`/custom-widgets/${id}`);
			}
			if (body._method === "DELETE") {
				const affectedWidgets = await db.widgets.findByCustomWidgetId(id);
				await db.customWidgets.delete(id);
				for (const widget of affectedWidgets) {
					invalidateRender?.(widget.screen_design_id);
				}
				return redirectResponse("/custom-widgets");
			}
		}

		if (id && method === "PATCH") {
			const widget = await db.customWidgets.findById(id);
			if (!widget) return textResponse("Not Found", 404);
			const affectedWidgets = await db.widgets.findByCustomWidgetId(id);
			const body = await parseBody(req);
			await db.customWidgets.update(id, {
				...body,
				name: optionalText(body.name),
				description: optionalText(body.description),
				displayType: optionalText(body.displayType),
				template: optionalText(body.template),
				data_source_id:
					body.data_source_id === undefined
						? undefined
						: requireInteger(body.data_source_id, "data_source_id"),
				min_width: optionalInteger(body.min_width, "min_width"),
				min_height: optionalInteger(body.min_height, "min_height"),
				config:
					body.config === undefined
						? undefined
						: requireJsonString(body.config, "config"),
				context_schema:
					body.context_schema === undefined
						? undefined
						: requireJsonString(body.context_schema, "context_schema"),
			});
			for (const widget of affectedWidgets) {
				invalidateRender?.(widget.screen_design_id);
			}
			return new Response(null, { status: 204 });
		}

		if (id && method === "DELETE") {
			const widget = await db.customWidgets.findById(id);
			if (!widget) return textResponse("Not Found", 404);
			const affectedWidgets = await db.widgets.findByCustomWidgetId(id);
			await db.customWidgets.delete(id);
			for (const widget of affectedWidgets) {
				invalidateRender?.(widget.screen_design_id);
			}
			return new Response(null, { status: 204 });
		}
	} catch (e) {
		return handleError(e);
	}

	return textResponse("Not Found", 404);
}
