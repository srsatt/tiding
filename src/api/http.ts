export type RequestBody = Record<string, unknown>;

export async function parseBody(req: Request): Promise<RequestBody> {
	const contentType = req.headers.get("content-type") || "";
	if (contentType.includes("application/x-www-form-urlencoded")) {
		return Object.fromEntries(new URLSearchParams(await req.text()));
	}

	if (contentType.includes("application/json")) {
		try {
			const body = await req.json();
			return typeof body === "object" && body !== null ? body : {};
		} catch {
			throw new HttpError(400, "Malformed JSON body");
		}
	}

	return {};
}

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init.headers || {}),
		},
	});
}

export function textResponse(message: string, status = 200) {
	return new Response(message, { status });
}

export function redirectResponse(location: string, status = 303) {
	return new Response(null, { status, headers: { Location: location } });
}

export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

export function handleError(error: unknown) {
	if (error instanceof HttpError) {
		return jsonResponse({ error: error.message }, { status: error.status });
	}
	const message = error instanceof Error ? error.message : String(error);
	if (/constraint|foreign key|unique/i.test(message)) {
		return jsonResponse({ error: message }, { status: 409 });
	}
	return jsonResponse({ error: message }, { status: 500 });
}

export function requireInteger(
	value: unknown,
	name: string,
	options: { min?: number } = { min: 1 },
) {
	const parsed =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number(value)
				: Number.NaN;
	if (!Number.isInteger(parsed))
		throw new HttpError(400, `${name} must be an integer`);
	if (options.min !== undefined && parsed < options.min) {
		const label =
			options.min === 1 ? "a positive integer" : `at least ${options.min}`;
		throw new HttpError(400, `${name} must be ${label}`);
	}
	return parsed;
}

export function optionalInteger(
	value: unknown,
	name: string,
	options: { min?: number } = { min: 1 },
) {
	if (value === undefined || value === null || value === "") return undefined;
	return requireInteger(value, name, options);
}

export function requireJsonString(
	value: unknown,
	name: string,
	fallback = "{}",
) {
	const candidate =
		value === undefined || value === null || value === ""
			? fallback
			: typeof value === "string"
				? value
				: JSON.stringify(value);
	try {
		JSON.parse(candidate);
	} catch {
		throw new HttpError(400, `${name} must be valid JSON`);
	}
	return candidate;
}

export function requireText(value: unknown, name: string) {
	if (typeof value !== "string" || !value.trim())
		throw new HttpError(400, `${name} is required`);
	return value;
}

export function optionalText(value: unknown) {
	return typeof value === "string" ? value : undefined;
}
