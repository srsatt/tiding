import type { DatabaseService } from "../../db";
import {
	handleError,
	jsonResponse,
	optionalInteger,
	parseBody,
	redirectResponse,
	requireInteger,
	requireJsonString,
	textResponse,
} from "../http";

export async function handleWidgets(
	req: Request,
	db: DatabaseService,
	invalidateRender?: (screenId: number) => void,
) {
	const url = new URL(req.url);
	const path = url.pathname;
	const method = req.method;

	const designMatch = path.match(/\/api\/screen-designs\/(\d+)\/widgets/);
	const designId = designMatch ? Number.parseInt(designMatch[1], 10) : null;

	const widgetMatch = path.match(/\/api\/widgets\/(\d+)/);
	const widgetId = widgetMatch ? Number.parseInt(widgetMatch[1], 10) : null;

	try {
		if (designId && method === "GET" && !widgetId) {
			const widgets = await db.widgets.findByScreenDesign(designId);
			return jsonResponse(widgets);
		}

		if ((path === "/api/widgets" || designId) && method === "POST") {
			const body = await parseBody(req);
			const screenDesignId =
				designId ?? requireInteger(body.screen_design_id, "screen_design_id");
			const newId = await db.widgets.create({
				...body,
				screen_design_id: screenDesignId,
				template_id: requireInteger(body.template_id, "template_id"),
				x: optionalInteger(body.x, "x", { min: 0 }) ?? 0,
				y: optionalInteger(body.y, "y", { min: 0 }) ?? 0,
				width: optionalInteger(body.width, "width") ?? 200,
				height: optionalInteger(body.height, "height") ?? 100,
				config: requireJsonString(body.config, "config"),
			});
			invalidateRender?.(screenDesignId);
			if (path === "/api/widgets")
				return redirectResponse(`/screens/${screenDesignId}`);
			return jsonResponse({ id: newId }, { status: 201 });
		}

		if (widgetId && method === "GET") {
			const widget = await db.widgets.findById(widgetId);
			if (!widget) return textResponse("Not Found", 404);
			return jsonResponse(widget);
		}

		if (widgetId && method === "PATCH") {
			const current = await db.widgets.findById(widgetId);
			if (!current) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			await db.widgets.update(widgetId, {
				...body,
				x: optionalInteger(body.x, "x", { min: 0 }),
				y: optionalInteger(body.y, "y", { min: 0 }),
				width: optionalInteger(body.width, "width"),
				height: optionalInteger(body.height, "height"),
				z_index: optionalInteger(body.z_index, "z_index", {}),
				config:
					body.config === undefined
						? undefined
						: requireJsonString(body.config, "config"),
			});
			invalidateRender?.(current.screen_design_id);
			return new Response(null, { status: 204 });
		}

		if (widgetId && method === "POST") {
			const current = await db.widgets.findById(widgetId);
			if (!current) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			if (body._method === "PATCH") {
				await db.widgets.update(widgetId, {
					...body,
					x: optionalInteger(body.x, "x", { min: 0 }),
					y: optionalInteger(body.y, "y", { min: 0 }),
					width: optionalInteger(body.width, "width"),
					height: optionalInteger(body.height, "height"),
					z_index: optionalInteger(body.z_index, "z_index", {}),
					config:
						body.config === undefined
							? undefined
							: requireJsonString(body.config, "config"),
				});
				invalidateRender?.(current.screen_design_id);
				return redirectResponse(`/screens/${current.screen_design_id}`);
			}
			if (body._method === "DELETE") {
				await db.widgets.delete(widgetId);
				invalidateRender?.(current.screen_design_id);
				return redirectResponse(`/screens/${current.screen_design_id}`);
			}
		}

		if (widgetId && method === "DELETE") {
			const current = await db.widgets.findById(widgetId);
			if (!current) return textResponse("Not Found", 404);
			await db.widgets.delete(widgetId);
			invalidateRender?.(current.screen_design_id);
			return redirectResponse("/");
		}
	} catch (e) {
		return handleError(e);
	}

	return textResponse("Not Found", 404);
}
