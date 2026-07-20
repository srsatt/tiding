import type { DatabaseService } from "../../db";
import {
	fetchAndCacheDataSource,
	invalidateDataSourceScreens,
} from "../../services/data-source-fetch";
import {
	handleError,
	jsonResponse,
	optionalInteger,
	optionalText,
	parseBody,
	redirectResponse,
	requireJsonString,
	requireText,
	textResponse,
} from "../http";

function booleanInput(value: unknown, fallback?: boolean) {
	if (value === undefined) return fallback;
	return (
		value === true ||
		value === 1 ||
		value === "true" ||
		value === "1" ||
		value === "on"
	);
}

export async function handleDataSources(
	req: Request,
	db: DatabaseService,
	invalidateRender?: (screenId: number) => void,
) {
	const url = new URL(req.url);
	const path = url.pathname;
	const method = req.method;
	const idMatch = path.match(/\/api\/data-sources\/(\d+)/);
	const id = idMatch ? Number.parseInt(idMatch[1], 10) : null;

	try {
		if (path === "/api/data-sources" && method === "GET") {
			const sources = await db.dataSources.findAll();
			return jsonResponse(sources);
		}

		if (path === "/api/data-sources/test-all" && method === "POST") {
			const sources = (await db.dataSources.findAll()).filter((source) =>
				booleanInput(source.is_active, true),
			);
			const results = [];
			for (const source of sources) {
				results.push({
					id: source.id,
					...(await fetchAndCacheDataSource(db, source.id, invalidateRender)),
				});
			}
			if (req.headers.get("accept")?.includes("application/json"))
				return jsonResponse({ ok: true, results });
			return redirectResponse("/data-sources");
		}

		if (path === "/api/data-sources" && method === "POST") {
			const body = await parseBody(req);
			const newId = await db.dataSources.create({
				...body,
				name: requireText(body.name, "name"),
				url: requireText(body.url, "url"),
				description: optionalText(body.description),
				type: optionalText(body.type),
				method: optionalText(body.method),
				headers:
					body.headers === undefined
						? undefined
						: requireJsonString(body.headers, "headers"),
				context_schema:
					body.context_schema === undefined
						? undefined
						: requireJsonString(body.context_schema, "context_schema"),
				refresh_interval: optionalInteger(
					body.refresh_interval,
					"refresh_interval",
				),
				is_active: booleanInput(body.is_active, true),
			});
			if (req.headers.get("content-type")?.includes("form-urlencoded"))
				return redirectResponse(`/data-sources/${newId}`);
			return jsonResponse({ id: newId }, { status: 201 });
		}

		if (id && path.endsWith("/fetch") && method === "POST") {
			const source = await db.dataSources.findById(id);
			if (!source) return textResponse("Not Found", 404);

			const body = await parseBody(req);
			const result = await fetchAndCacheDataSource(db, id, invalidateRender, {
				context: body.test_context,
			});
			if (result.ok) {
				if (req.headers.get("accept")?.includes("application/json"))
					return jsonResponse({
						ok: true,
						data: result.data,
						fields: result.fields,
					});
				return redirectResponse(`/data-sources/${id}`);
			}
			if (req.headers.get("accept")?.includes("application/json"))
				return jsonResponse(
					{ ok: false, error: result.error },
					{ status: 502 },
				);
			return redirectResponse(`/data-sources/${id}`);
		}

		if (id && method === "GET") {
			const source = await db.dataSources.findById(id);
			if (!source) return textResponse("Not Found", 404);
			return jsonResponse(source);
		}

		if (id && path.endsWith("/toggle") && method === "POST") {
			const source = await db.dataSources.findById(id);
			if (!source) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			await db.dataSources.update(id, {
				is_active: booleanInput(
					body.is_active,
					!booleanInput(source.is_active),
				),
			});
			if (req.headers.get("accept")?.includes("application/json"))
				return jsonResponse(await db.dataSources.findById(id));
			return redirectResponse("/data-sources");
		}

		if (id && method === "POST") {
			const source = await db.dataSources.findById(id);
			if (!source) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			const isForm = req.headers
				.get("content-type")
				?.includes("form-urlencoded");
			if (body._method === "PATCH") {
				await db.dataSources.update(id, {
					...body,
					name: optionalText(body.name),
					url: optionalText(body.url),
					description: optionalText(body.description),
					type: optionalText(body.type),
					method: optionalText(body.method),
					headers:
						body.headers === undefined
							? undefined
							: requireJsonString(body.headers, "headers"),
					context_schema:
						body.context_schema === undefined
							? undefined
							: requireJsonString(body.context_schema, "context_schema"),
					refresh_interval: optionalInteger(
						body.refresh_interval,
						"refresh_interval",
					),
					is_active: isForm
						? booleanInput(body.is_active, false)
						: booleanInput(body.is_active),
				});
				await invalidateDataSourceScreens(db, id, invalidateRender);
				return redirectResponse(`/data-sources/${id}`);
			}
			if (body._method === "DELETE") {
				await invalidateDataSourceScreens(db, id, invalidateRender);
				await db.dataSources.delete(id);
				return redirectResponse("/data-sources");
			}
		}

		if (id && method === "PATCH") {
			const source = await db.dataSources.findById(id);
			if (!source) return textResponse("Not Found", 404);
			const body = await parseBody(req);
			await db.dataSources.update(id, {
				...body,
				name: optionalText(body.name),
				url: optionalText(body.url),
				description: optionalText(body.description),
				type: optionalText(body.type),
				method: optionalText(body.method),
				headers:
					body.headers === undefined
						? undefined
						: requireJsonString(body.headers, "headers"),
				context_schema:
					body.context_schema === undefined
						? undefined
						: requireJsonString(body.context_schema, "context_schema"),
				refresh_interval: optionalInteger(
					body.refresh_interval,
					"refresh_interval",
				),
				is_active: booleanInput(body.is_active),
			});
			await invalidateDataSourceScreens(db, id, invalidateRender);
			return new Response(null, { status: 204 });
		}

		if (id && method === "DELETE") {
			const source = await db.dataSources.findById(id);
			if (!source) return textResponse("Not Found", 404);
			await invalidateDataSourceScreens(db, id, invalidateRender);
			await db.dataSources.delete(id);
			return new Response(null, { status: 204 });
		}
	} catch (e) {
		return handleError(e);
	}

	return textResponse("Not Found", 404);
}
