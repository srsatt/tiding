export type DataField = { path: string; type: string };

function readPath(source: unknown, path: string) {
	return path.split(".").reduce<unknown>((current, segment) => {
		if (current && typeof current === "object") {
			return (current as Record<string, unknown>)[segment];
		}
		return undefined;
	}, source);
}

export function parseContext(value: unknown) {
	if (!value) return {};
	if (typeof value === "object") return value as Record<string, unknown>;
	if (typeof value !== "string") return {};
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object"
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}

export function resolveContextPlaceholders(
	value: string,
	context: unknown,
	options: { encode?: boolean } = {},
) {
	const parsedContext = parseContext(context);
	return value.replace(/\{ctx\.([A-Za-z0-9_.-]+)\}/g, (_match, path) => {
		const resolved = readPath(parsedContext, String(path));
		if (resolved === undefined || resolved === null) return "";
		const text = String(resolved);
		return options.encode ? encodeURIComponent(text) : text;
	});
}

function resolveContextValue(value: unknown, context: unknown): unknown {
	if (typeof value === "string")
		return resolveContextPlaceholders(value, context);
	if (Array.isArray(value)) {
		return value.map((entry) => resolveContextValue(entry, context));
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [
				key,
				resolveContextValue(entry, context),
			]),
		);
	}
	return value;
}

export function resolveContextJsonText(value: string, context: unknown) {
	try {
		return JSON.stringify(resolveContextValue(JSON.parse(value), context));
	} catch {
		return resolveContextPlaceholders(value, context);
	}
}

function valueType(value: unknown) {
	if (Array.isArray(value)) return "array";
	if (value === null) return "null";
	return typeof value;
}

export function discoverJsonFields(data: string, limit = 80): DataField[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(data);
	} catch {
		return [{ path: "$", type: "string" }];
	}
	const fields: DataField[] = [];
	const visit = (value: unknown, path: string) => {
		if (fields.length >= limit) return;
		fields.push({ path, type: valueType(value) });
		if (!value || typeof value !== "object") return;
		if (Array.isArray(value)) {
			for (const [index, entry] of value.slice(0, 3).entries()) {
				visit(entry, `${path}[${index}]`);
			}
			return;
		}
		for (const [key, entry] of Object.entries(value)) {
			visit(entry, `${path}.${key}`);
		}
	};
	visit(parsed, "$");
	return fields;
}
