import { Fragment, h, type VNode } from "preact";
import { jsxDEV } from "preact/jsx-dev-runtime";
import { jsx, jsxs } from "preact/jsx-runtime";
import renderToString from "preact-render-to-string";
import type { CustomWidget } from "../../db/repositories/custom-widget.repository";
import type { DataSource } from "../../db/repositories/data-source.repository";
import type { Widget } from "../../db/repositories/widget.repository";
import { FrameworkIcon } from "./framework-icon";

export function escapeHtml(value: unknown) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function parseJsonValue(value: unknown) {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function resolvePath(source: unknown, path: string): unknown {
	const segments = path
		.replace(/^\$\./, "")
		.replace(/^\$/, "")
		.split(".")
		.filter(Boolean);

	let current = source;
	for (const segment of segments) {
		if (current === null || current === undefined) return undefined;
		const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
		if (arrayMatch) {
			current = (current as Record<string, unknown>)[arrayMatch[1]];
			if (!Array.isArray(current)) return undefined;
			current = current[Number.parseInt(arrayMatch[2], 10)];
			continue;
		}
		current = (current as Record<string, unknown>)[segment];
	}
	return current;
}

function renderTokenTemplate(
	template: string,
	context: Record<string, unknown>,
	data: unknown,
) {
	return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawPath) => {
		const path = String(rawPath).trim();
		const root = path.split(".")[0];
		const value =
			root in context ? resolvePath(context, path) : resolvePath(data, path);
		return value === undefined || value === null ? "" : escapeHtml(value);
	});
}

function isVNode(value: unknown): value is VNode {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"props" in value
	);
}

const SVG_ATTRIBUTE_NAMES: Record<string, string> = {
	ariaLabel: "aria-label",
	clipPath: "clip-path",
	clipRule: "clip-rule",
	fillRule: "fill-rule",
	strokeDasharray: "stroke-dasharray",
	strokeDashoffset: "stroke-dashoffset",
	strokeLinecap: "stroke-linecap",
	strokeLinejoin: "stroke-linejoin",
	strokeMiterlimit: "stroke-miterlimit",
	strokeWidth: "stroke-width",
};

export function normalizeSvgAttributes(markup: string) {
	const attributes = Object.entries(SVG_ATTRIBUTE_NAMES).reduce(
		(result, [reactName, svgName]) =>
			result.replace(new RegExp(`\\s${reactName}=`, "g"), ` ${svgName}=`),
		markup,
	);
	return attributes.replace(
		/<svg\b(?![^>]*\bxmlns=)/gi,
		'<svg xmlns="http://www.w3.org/2000/svg"',
	);
}

function renderExecutableResult(value: unknown): string {
	if (value === undefined || value === null) return "";
	if (isVNode(value)) return normalizeSvgAttributes(renderToString(value));
	if (Array.isArray(value)) {
		return normalizeSvgAttributes(
			value
				.map((item) =>
					isVNode(item)
						? renderToString(item)
						: `<div>${escapeHtml(
								typeof item === "object" ? JSON.stringify(item) : item,
							)}</div>`,
				)
				.join(""),
		);
	}
	if (typeof value === "object") return escapeHtml(JSON.stringify(value));
	return escapeHtml(value);
}

const tsxTranspiler = new Bun.Transpiler({ loader: "tsx" });

function bindStableJsxHelpers(transformedCode: string) {
	return transformedCode
		.replace(/\bjsxDEV_[A-Za-z0-9_$]+\b/g, "jsxDEV")
		.replace(/\bjsxs_[A-Za-z0-9_$]+\b/g, "jsxs")
		.replace(/\bjsx_[A-Za-z0-9_$]+\b/g, "jsx")
		.replace(/\bFragment_[A-Za-z0-9_$]+\b/g, "Fragment");
}

function evaluateLocalWidgetCode(
	code: string,
	runtime: Record<string, unknown>,
): unknown {
	const transformedCode = bindStableJsxHelpers(
		tsxTranspiler.transformSync(code),
	);
	const fn = new Function(
		"$",
		"ctx",
		"config",
		"customConfig",
		"widget",
		"customWidget",
		"dataSource",
		"h",
		"Fragment",
		"React",
		"jsxDEV",
		"jsx",
		"jsxs",
		"Icon",
		transformedCode,
	);
	return fn(
		runtime.$,
		runtime.ctx,
		runtime.config,
		runtime.customConfig,
		runtime.widget,
		runtime.customWidget,
		runtime.dataSource,
		h,
		Fragment,
		{ createElement: h, Fragment },
		jsxDEV,
		jsx,
		jsxs,
		FrameworkIcon,
	);
}

function stringValue(value: unknown) {
	return typeof value === "string" && value.trim() ? value : undefined;
}

export function renderCustomWidgetTemplate({
	customWidget,
	config,
	dataSource,
	data,
	widget,
}: {
	customWidget: CustomWidget;
	config: Record<string, unknown>;
	dataSource: DataSource | null;
	data: unknown;
	widget: Widget | null;
}) {
	const customConfig = parseJsonValue(customWidget.config);
	const customConfigObject =
		typeof customConfig === "object" && customConfig !== null
			? (customConfig as Record<string, unknown>)
			: {};
	const template = stringValue(config.template) ?? customWidget.template ?? "";
	const mode = String(
		config.templateMode ??
			customConfigObject.templateMode ??
			customWidget.displayType ??
			"",
	);
	const ctx = config.ctx ?? customConfigObject.ctx ?? config;

	if (customWidget.displayType === "script") {
		const scriptCode =
			stringValue(customConfigObject.scriptCode) ?? stringValue(template);
		if (!scriptCode) return "";
		try {
			return renderExecutableResult(
				evaluateLocalWidgetCode(scriptCode, {
					$: data,
					ctx,
					config,
					customConfig: customConfigObject,
					widget,
					customWidget,
					dataSource,
				}),
			);
		} catch (error) {
			return escapeHtml(
				`Custom widget script error: ${(error as Error).message}`,
			);
		}
	}

	if (customWidget.displayType === "framework" || mode === "jsx") {
		if (!template) return "";
		try {
			return renderExecutableResult(
				evaluateLocalWidgetCode(template, {
					$: data,
					ctx,
					config,
					customConfig: customConfigObject,
					widget,
					customWidget,
					dataSource,
				}),
			);
		} catch (error) {
			return escapeHtml(
				`Custom widget framework error: ${(error as Error).message}`,
			);
		}
	}

	return renderTokenTemplate(
		template || "{{data}}",
		{
			data,
			config,
			customConfig: customConfigObject,
			widget,
			customWidget,
			dataSource,
		},
		data,
	);
}
