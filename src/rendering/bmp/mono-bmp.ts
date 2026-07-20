import {
	type DitherMode,
	type DitherRegion,
	monochromePixelsWithRegions,
	monochromePixelsWithThresholdedText,
} from "./mono-pixels";

export type { DitherMode, DitherRegion };

export interface MonoBmpOptions {
	width: number;
	height: number;
	threshold?: number;
	ditherMode?: DitherMode;
	ditherRegions?: DitherRegion[];
	textlessRaw?: Uint8Array;
	topDown?: boolean;
}

function detectChannels(raw: Uint8Array, width: number, height: number) {
	const pixels = width * height;
	for (const channels of [4, 3, 1]) {
		if (raw.length === pixels * channels) return channels;
	}
	throw new Error(
		`Unexpected raw render size: got ${raw.length}, expected ${pixels}, ${pixels * 3}, or ${pixels * 4}`,
	);
}

export function encodeRawTo1BitBmp(raw: Uint8Array, options: MonoBmpOptions) {
	const { width, height } = options;
	const threshold = options.threshold ?? 128;
	// TRMNL firmware through v1.6.10 reads height as an unsigned integer and
	// accepts only a conventional positive-height, bottom-up 800x480 BMP.
	const topDown = options.topDown ?? false;
	const mode = options.ditherMode ?? "threshold";
	const channels = detectChannels(raw, width, height);
	const pixels = options.textlessRaw
		? monochromePixelsWithThresholdedText(
				raw,
				options.textlessRaw,
				width,
				height,
				channels,
				threshold,
				mode,
				options.ditherRegions,
			)
		: monochromePixelsWithRegions(
				raw,
				width,
				height,
				channels,
				threshold,
				mode,
				options.ditherRegions,
			);
	const rowStride = Math.ceil(width / 32) * 4;
	const pixelDataSize = rowStride * height;
	const pixelOffset = 14 + 40 + 8;
	const fileSize = pixelOffset + pixelDataSize;
	const bmp = Buffer.alloc(fileSize);

	bmp.write("BM", 0, "ascii");
	bmp.writeUInt32LE(fileSize, 2);
	bmp.writeUInt32LE(pixelOffset, 10);

	bmp.writeUInt32LE(40, 14);
	bmp.writeInt32LE(width, 18);
	bmp.writeInt32LE(topDown ? -height : height, 22);
	bmp.writeUInt16LE(1, 26);
	bmp.writeUInt16LE(1, 28);
	bmp.writeUInt32LE(0, 30);
	bmp.writeUInt32LE(pixelDataSize, 34);
	bmp.writeInt32LE(2835, 38);
	bmp.writeInt32LE(2835, 42);
	bmp.writeUInt32LE(2, 46);
	bmp.writeUInt32LE(2, 50);

	bmp[pixelOffset - 8] = 0x00;
	bmp[pixelOffset - 7] = 0x00;
	bmp[pixelOffset - 6] = 0x00;
	bmp[pixelOffset - 5] = 0x00;
	bmp[pixelOffset - 4] = 0xff;
	bmp[pixelOffset - 3] = 0xff;
	bmp[pixelOffset - 2] = 0xff;
	bmp[pixelOffset - 1] = 0x00;

	for (let y = 0; y < height; y++) {
		const rowOffset = pixelOffset + y * rowStride;
		const sourceY = topDown ? y : height - 1 - y;
		for (let x = 0; x < width; x++) {
			if (!pixels[sourceY * width + x]) continue;

			const byteOffset = rowOffset + Math.floor(x / 8);
			const bit = 7 - (x % 8);
			bmp[byteOffset] |= 1 << bit;
		}
	}

	return bmp;
}
