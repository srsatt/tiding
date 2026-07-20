import * as fs from "node:fs";
import * as path from "node:path";
import { fromHtml } from "takumi-js/helpers/html";
import { type Font, type Node, Renderer } from "takumi-js/node";
import {
	type DitherMode,
	type DitherRegion,
	encodeRawTo1BitBmp,
} from "../bmp/mono-bmp";
import { downsampleRgbaToGrayscale } from "../bmp/mono-pixels";
import {
	optimizeDisplayFonts,
	optimizeDisplayStylesheet,
} from "./display-fonts";

export interface RenderOptions {
	width: number;
	height: number;
	stylesheets?: string[];
	threshold?: number;
	ditherMode?: DitherMode;
	ditherRegions?: DitherRegion[];
	supersample?: 1 | 2;
	topDown?: boolean;
}

function scaleCssPixels(value: string, scale: number) {
	return value.replace(/(-?\d+(?:\.\d+)?)px/g, (_match, pixels) => {
		return `${Number(pixels) * scale}px`;
	});
}

function scaleDocumentPixels(html: string, scale: number) {
	if (scale === 1) return html;
	return html
		.replace(
			/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
			(_match, open, css, close) =>
				`${open}${scaleCssPixels(css, scale)}${close}`,
		)
		.replace(
			/(\sstyle=)(["'])([\s\S]*?)\2/gi,
			(_match, prefix, quote, css) =>
				`${prefix}${quote}${scaleCssPixels(css, scale)}${quote}`,
		)
		.replace(
			/(\s(?:width|height)=)(["'])(-?\d+(?:\.\d+)?)\2/gi,
			(_match, prefix, quote, pixels) =>
				`${prefix}${quote}${Number(pixels) * scale}${quote}`,
		);
}

function hideText(node: Node): Node {
	if (node.type === "text") {
		return {
			...node,
			style: { ...node.style, color: "transparent" },
		};
	}
	if (node.type === "container") {
		return {
			...node,
			children: node.children?.map(hideText),
		};
	}
	return node;
}

function withDisplayFontDefault(node: Node): Node {
	return {
		...node,
		style: {
			fontFamily: "TRMNL16",
			fontSize: 16,
			...node.style,
		},
	};
}

function displayStylesheets(
	parsed: string[],
	configured: string[] | undefined,
) {
	return [...parsed, ...(configured ?? [])].map(optimizeDisplayStylesheet);
}

export class TakumiRenderer {
	private renderer: Promise<Renderer> | null = null;
	private retainedFonts: Font[] | null = null;
	private renderQueue: Promise<void> = Promise.resolve();

	private async renderExclusive<T>(operation: () => Promise<T>) {
		const previous = this.renderQueue;
		let release = () => {};
		this.renderQueue = new Promise<void>((resolve) => {
			release = resolve;
		});
		await previous;
		try {
			return await operation();
		} finally {
			release();
		}
	}

	private async getRenderer() {
		this.renderer ??= this.createRenderer();
		return this.renderer;
	}

	private async createRenderer() {
		const renderer = new Renderer();
		for (const font of this.renderFonts()) {
			await renderer.registerFont(font);
		}
		return renderer;
	}

	private renderFonts(): Font[] {
		if (this.retainedFonts) return this.retainedFonts;
		const fontsDir = path.join(process.cwd(), "assets", "fonts");
		const fonts: Font[] = [];
		for (const [name, file, weight] of [
			["DejaVu Sans", "DejaVuSans.ttf", 400],
			["TRMNL12", "TRMNL12-Regular.ttf", 400],
			["TRMNL12", "TRMNL12-Bold.ttf", 700],
			["TRMNL16", "TRMNL16-Regular.ttf", 400],
			["TRMNL16", "TRMNL16-Bold.ttf", 700],
			["TRMNL21", "TRMNL21-Regular.ttf", 400],
			["TRMNL21", "TRMNL21-Bold.ttf", 700],
		] as const) {
			const fontPath = path.join(fontsDir, file);
			if (!fs.existsSync(fontPath)) continue;
			fonts.push({
				name,
				data: fs.readFileSync(fontPath),
				weight,
				style: "normal",
			});
		}
		this.retainedFonts = fonts;
		return fonts;
	}

	async renderHtmlToPng(html: string, options: RenderOptions): Promise<Buffer> {
		const { node, stylesheets } = fromHtml(optimizeDisplayFonts(html));
		const renderer = await this.getRenderer();
		const result = await this.renderExclusive(() =>
			renderer.render(withDisplayFontDefault(node), {
				width: options.width,
				height: options.height,
				format: "png",
				stylesheets: displayStylesheets(stylesheets || [], options.stylesheets),
			}),
		);
		return Buffer.from(result);
	}

	async renderHtmlToRaw(
		html: string,
		options: RenderOptions,
	): Promise<Uint8Array> {
		return this.renderHtmlLayerToRaw(html, options, false);
	}

	private async renderHtmlLayerToRaw(
		html: string,
		options: RenderOptions,
		withoutText: boolean,
	): Promise<Uint8Array> {
		const supersample = options.supersample ?? 1;
		const parsed = fromHtml(
			scaleDocumentPixels(optimizeDisplayFonts(html), supersample),
		);
		const renderer = await this.getRenderer();
		const node = withDisplayFontDefault(parsed.node);
		const rendered = await this.renderExclusive(() =>
			renderer.render(withoutText ? hideText(node) : node, {
				width: options.width,
				height: options.height,
				format: "raw",
				stylesheets: displayStylesheets(
					parsed.stylesheets || [],
					options.stylesheets,
				),
			}),
		);
		return new Uint8Array(rendered);
	}

	async renderHtmlToBmp(html: string, options: RenderOptions): Promise<Buffer> {
		const supersample = options.supersample ?? 1;
		const raw = await this.renderHtmlToRaw(html, {
			...options,
			width: options.width * supersample,
			height: options.height * supersample,
			supersample,
		});
		const needsTextProtection =
			(options.ditherMode ?? "threshold") !== "threshold" ||
			options.ditherRegions?.some(
				(region) => region.ditherMode !== "threshold",
			);
		const textlessRaw = needsTextProtection
			? await this.renderHtmlLayerToRaw(
					html,
					{
						...options,
						width: options.width * supersample,
						height: options.height * supersample,
						supersample,
					},
					true,
				)
			: undefined;
		const pixels =
			supersample === 1
				? raw
				: downsampleRgbaToGrayscale(
						raw,
						options.width,
						options.height,
						supersample,
					);
		const textlessPixels = textlessRaw
			? supersample === 1
				? textlessRaw
				: downsampleRgbaToGrayscale(
						textlessRaw,
						options.width,
						options.height,
						supersample,
					)
			: undefined;
		return encodeRawTo1BitBmp(pixels, {
			width: options.width,
			height: options.height,
			threshold: options.threshold,
			ditherMode: options.ditherMode,
			ditherRegions: options.ditherRegions,
			textlessRaw: textlessPixels,
			topDown: options.topDown,
		});
	}
}

export const takumiRenderer = new TakumiRenderer();
