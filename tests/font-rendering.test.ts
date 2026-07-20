import { expect, test } from "bun:test";
import {
	displayFontFamily,
	displayFontSelection,
} from "../src/rendering/takumi/display-fonts";
import { takumiRenderer } from "../src/rendering/takumi/renderer";

test("responsive display text snaps to native TRMNL strikes", () => {
	expect(displayFontFamily(12, "Inter")).toBe("TRMNL12");
	expect(displayFontFamily(16, "Arial")).toBe("TRMNL16");
	expect(displayFontFamily(21, "sans-serif")).toBe("TRMNL21");
	expect(displayFontFamily(40, "TRMNL21")).toBe("Geist");
	expect(displayFontFamily(40, "Symbola")).toBe("Symbola");
	expect(displayFontSelection(24, "TRMNL21")).toEqual({
		family: "TRMNL21",
		fontSize: 21,
	});
	expect(displayFontSelection(27, "TRMNL21")).toEqual({
		family: "Geist",
		fontSize: 27,
	});
});

test("text without an explicit family uses native TRMNL16", async () => {
	const implicit = await takumiRenderer.renderHtmlToBmp(
		'<html><body style="margin:0;background:#fff"><div>Default 123</div></body></html>',
		{ width: 180, height: 40 },
	);
	const explicit = await takumiRenderer.renderHtmlToBmp(
		'<html><body style="margin:0;background:#fff"><div style="font-family:TRMNL16;font-size:16px">Default 123</div></body></html>',
		{ width: 180, height: 40 },
	);

	expect(implicit.equals(explicit)).toBe(true);
});

test("Floyd-Steinberg conversion does not dither display text", async () => {
	const html =
		'<html><body style="margin:0;background:#fff"><div style="font-family:TRMNL21;font-size:40px;color:#000">00:33 Clean</div></body></html>';
	const options = { width: 320, height: 70, threshold: 128 } as const;
	const threshold = await takumiRenderer.renderHtmlToBmp(html, {
		...options,
		ditherMode: "threshold",
	});
	const dithered = await takumiRenderer.renderHtmlToBmp(html, {
		...options,
		ditherMode: "floyd-steinberg",
	});

	expect(dithered.equals(threshold)).toBe(true);
});

test("text protection does not disable dithering for grayscale artwork", async () => {
	const html =
		'<html><body style="margin:0;background:#fff"><div style="font-family:TRMNL21;font-size:21px;color:#000">Clean</div><div style="width:120px;height:24px;background:#777"></div></body></html>';
	const options = { width: 180, height: 70, threshold: 128 } as const;
	const threshold = await takumiRenderer.renderHtmlToBmp(html, {
		...options,
		ditherMode: "threshold",
	});
	const dithered = await takumiRenderer.renderHtmlToBmp(html, {
		...options,
		ditherMode: "floyd-steinberg",
	});

	expect(dithered.equals(threshold)).toBe(false);
});
