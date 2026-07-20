import type { DatabaseService } from "../../db";
import {
	exportScreenPackage,
	importScreenPackage,
	type ScreenPackage,
} from "../../services/screen-package";
import {
	HttpError,
	handleError,
	jsonResponse,
	optionalInteger,
	optionalText,
	parseBody,
	redirectResponse,
	requireText,
	textResponse,
} from "../http";

function packageFromBody(body: Record<string, unknown>): ScreenPackage {
	const raw = body.package ?? body.screenPackage ?? body;
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw) as ScreenPackage;
		} catch {
			throw new HttpError(400, "screen package must be valid JSON");
		}
	}
	return raw as ScreenPackage;
}

export async function handleScreenDesigns(
	req: Request,
	db: DatabaseService,
	invalidateRender?: (screenId: number) => void,
) {
	const url = new URL(req.url);
	const path = url.pathname;
	const method = req.method;
	const idMatch = path.match(/\/api\/screen-designs\/(\d+)/);
	const id = idMatch ? Number.parseInt(idMatch[1], 10) : null;

	try {
		if (path === "/api/screen-designs" && method === "GET") {
			const screens = await db.screens.findAll();
			return jsonResponse(screens);
		}

		if (path === "/api/screen-designs/import" && method === "POST") {
			const body = await parseBody(req);
			const screenPackage = packageFromBody(body);
			if (screenPackage.version !== 1) {
				throw new HttpError(400, "Unsupported screen package version");
			}
			const newId = await importScreenPackage(db, screenPackage);
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse(`/screens/designer/${newId}`);
			return jsonResponse({ id: newId }, { status: 201 });
		}

		if (path === "/api/screen-designs" && method === "POST") {
			const body = await parseBody(req);
			const newId = await db.screens.create(
				requireText(body.name, "name"),
				optionalText(body.description),
				{
					width: optionalInteger(body.width, "width"),
					height: optionalInteger(body.height, "height"),
					background: optionalText(body.background),
				},
			);
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse(`/screens/${newId}`);
			return jsonResponse({ id: newId }, { status: 201 });
		}

		if (id && path.endsWith("/export") && method === "GET") {
			const pkg = await exportScreenPackage(db, id);
			if (!pkg) return textResponse("Not Found", 404);
			return jsonResponse(pkg, {
				headers: {
					"Content-Disposition": `attachment; filename="screen-${id}.json"`,
				},
			});
		}

		if (id && method === "GET") {
			const screen = await db.screens.findById(id);
			if (!screen) return textResponse("Not Found", 404);
			return jsonResponse(screen);
		}

		if (id && method === "POST") {
			const screen = await db.screens.findById(id);
			if (!screen) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			if (body._method === "PATCH") {
				await db.screens.update(
					id,
					optionalText(body.name),
					optionalText(body.description),
					optionalText(body.background),
					optionalInteger(body.width, "width"),
					optionalInteger(body.height, "height"),
				);
				invalidateRender?.(id);
				return redirectResponse(`/screens/${id}`);
			}
			if (body._method === "DELETE") {
				await db.screens.delete(id);
				invalidateRender?.(id);
				return redirectResponse("/screens");
			}
		}

		if (id && method === "PATCH") {
			const screen = await db.screens.findById(id);
			if (!screen) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			await db.screens.update(
				id,
				optionalText(body.name),
				optionalText(body.description),
				optionalText(body.background),
				optionalInteger(body.width, "width"),
				optionalInteger(body.height, "height"),
			);
			invalidateRender?.(id);
			return new Response(null, { status: 204 });
		}

		if (id && method === "DELETE") {
			const screen = await db.screens.findById(id);
			if (!screen) return textResponse("Not Found", 404);
			await db.screens.delete(id);
			invalidateRender?.(id);
			return new Response(null, { status: 204 });
		}
	} catch (e) {
		return handleError(e);
	}

	return textResponse("Not Found", 404);
}
