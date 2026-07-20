const RESPONSIVE_DISPLAY_FONTS = new Set([
	"arial",
	"geist",
	"inter",
	"sans-serif",
	"trmnl12",
	"trmnl16",
	"trmnl21",
]);

const TRMNL_NATIVE_FACES = [
	{ family: "TRMNL12", fontSize: 12 },
	{ family: "TRMNL16", fontSize: 16 },
	{ family: "TRMNL21", fontSize: 21 },
] as const;

export interface DisplayFontSelection {
	family: string;
	fontSize: number;
}

function unquotedFamily(value: unknown) {
	if (typeof value !== "string") return "";
	return (
		value
			.trim()
			.split(",")[0]
			?.trim()
			.replace(/^['"]|['"]$/g, "") ?? ""
	);
}

export function displayFontSelection(
	fontSize: number,
	requested?: unknown,
): DisplayFontSelection {
	const family = unquotedFamily(requested);
	if (family && !RESPONSIVE_DISPLAY_FONTS.has(family.toLowerCase())) {
		return { family, fontSize };
	}
	const nearest = TRMNL_NATIVE_FACES.reduce((best, candidate) =>
		Math.abs(candidate.fontSize - fontSize) < Math.abs(best.fontSize - fontSize)
			? candidate
			: best,
	);
	if (Math.abs(nearest.fontSize - fontSize) <= 4) return nearest;
	return { family: "Geist", fontSize };
}

export function displayFontFamily(fontSize: number, requested?: unknown) {
	return displayFontSelection(fontSize, requested).family;
}

function optimizeStyle(style: string) {
	const sizeMatch = style.match(/font-size\s*:\s*(-?\d+(?:\.\d+)?)px/i);
	const familyMatch = style.match(/font-family\s*:\s*([^;]+)/i);
	if (!sizeMatch && !familyMatch) return style;
	if (!sizeMatch) {
		const family = unquotedFamily(familyMatch?.[1]);
		if (!family || !RESPONSIVE_DISPLAY_FONTS.has(family.toLowerCase())) {
			return style;
		}
		return style.replace(/font-family\s*:\s*([^;]+)/i, "font-family:Geist");
	}

	const fontSize = Number(sizeMatch[1]);
	if (!Number.isFinite(fontSize)) return style;
	const selected = displayFontSelection(fontSize, familyMatch?.[1]);
	let result = familyMatch
		? style.replace(
				/font-family\s*:\s*([^;]+)/i,
				`font-family:${selected.family}`,
			)
		: `font-family:${selected.family};${style}`;
	if (selected.fontSize !== fontSize) {
		result = result.replace(
			/font-size\s*:\s*(-?\d+(?:\.\d+)?)px/i,
			`font-size:${selected.fontSize}px`,
		);
	}
	return result;
}

export function optimizeDisplayFonts(html: string) {
	return html
		.replace(
			/(\sstyle=)(["'])([\s\S]*?)\2/gi,
			(_match, prefix, quote, style) =>
				`${prefix}${quote}${optimizeStyle(style)}${quote}`,
		)
		.replace(
			/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
			(_match, open, stylesheet, close) =>
				`${open}${optimizeDisplayStylesheet(stylesheet)}${close}`,
		);
}

export function optimizeDisplayStylesheet(stylesheet: string) {
	return stylesheet.replace(
		/(\{)([^{}]*)(\})/g,
		(_match, open, declarations, close) =>
			`${open}${optimizeStyle(declarations)}${close}`,
	);
}
