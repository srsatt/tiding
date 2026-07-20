import { exec } from "preact-iso/router";

export type RouteMatch = Record<string, string>;

export type RouteContext<TContext> = TContext & {
	match: RouteMatch;
};

export type RouteHandler<TContext, TResult> = (
	context: RouteContext<TContext>,
) => TResult;

export type Route<TContext, TResult> = {
	pattern: string;
	render: RouteHandler<TContext, TResult>;
};

export function defineRoute<TContext, TResult>(
	pattern: string,
	render: RouteHandler<TContext, TResult>,
): Route<TContext, TResult> {
	return { pattern, render };
}

export function matchRoute<TContext, TResult>(
	routes: Route<TContext, TResult>[],
	pathname: string,
	context: TContext,
) {
	for (const route of routes) {
		const result = exec(pathname, route.pattern);
		if (!result) continue;
		const match = Object.fromEntries(
			Object.entries(result.params).map(([key, value]) => [key, value || ""]),
		);
		return route.render({ ...context, match });
	}
	return null;
}
