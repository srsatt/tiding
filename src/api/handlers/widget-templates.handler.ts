import type { DatabaseService } from "../../db";
import { jsonResponse, textResponse } from "../http";

export async function handleWidgetTemplates(req: Request, db: DatabaseService) {
	const url = new URL(req.url);
	const routePath = url.pathname;
	const idMatch = routePath.match(/\/api\/widget-templates\/(\d+)/);
	const id = idMatch ? Number.parseInt(idMatch[1], 10) : null;

	if (routePath === "/api/widget-templates" && req.method === "GET") {
		return jsonResponse(await db.templates.findAll());
	}

	if (id && req.method === "GET") {
		const template = await db.templates.findById(id);
		if (!template) return textResponse("Not Found", 404);
		return jsonResponse(template);
	}

	return textResponse("Not Found", 404);
}
