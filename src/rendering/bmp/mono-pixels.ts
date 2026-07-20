export type DitherMode = "threshold" | "floyd-steinberg" | "grayscale";

export interface DitherRegion {
	x: number;
	y: number;
	width: number;
	height: number;
	ditherMode: DitherMode;
}

export function downsampleRgbaToGrayscale(
	raw: Uint8Array,
	width: number,
	height: number,
	scale: number,
) {
	if (!Number.isInteger(scale) || scale < 1) {
		throw new Error(`Invalid render scale: ${scale}`);
	}
	const sourceWidth = width * scale;
	const sourceHeight = height * scale;
	const expectedBytes = sourceWidth * sourceHeight * 4;
	if (raw.length !== expectedBytes) {
		throw new Error(
			`Unexpected supersampled render size: got ${raw.length}, expected ${expectedBytes}`,
		);
	}

	const output = new Uint8Array(width * height);
	const samples = scale * scale;
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			let sum = 0;
			for (let sampleY = 0; sampleY < scale; sampleY += 1) {
				for (let sampleX = 0; sampleX < scale; sampleX += 1) {
					const sourceX = x * scale + sampleX;
					const sourceY = y * scale + sampleY;
					const offset = (sourceY * sourceWidth + sourceX) * 4;
					const red = raw[offset] ?? 255;
					const green = raw[offset + 1] ?? red;
					const blue = raw[offset + 2] ?? red;
					const alpha = raw[offset + 3] ?? 255;
					const gray = (red * 299 + green * 587 + blue * 114) / 1000;
					sum += (gray * alpha + 255 * (255 - alpha)) / 255;
				}
			}
			output[y * width + x] = Math.round(sum / samples);
		}
	}
	return output;
}

function pixelLuminance(raw: Uint8Array, pixelIndex: number, channels: number) {
	const offset = pixelIndex * channels;
	if (channels === 1) return raw[offset];
	const red = raw[offset] ?? 255;
	const green = raw[offset + 1] ?? red;
	const blue = raw[offset + 2] ?? red;
	const alpha = channels >= 4 ? (raw[offset + 3] ?? 255) : 255;
	const gray = (red * 299 + green * 587 + blue * 114) / 1000;
	return (gray * alpha + 255 * (255 - alpha)) / 255;
}

function luminanceBuffer(
	raw: Uint8Array,
	width: number,
	height: number,
	channels: number,
) {
	const values = new Float32Array(width * height);
	for (let index = 0; index < values.length; index += 1) {
		values[index] = pixelLuminance(raw, index, channels);
	}
	return values;
}

function thresholdPixels(values: Float32Array, threshold: number) {
	const output = new Uint8Array(values.length);
	for (let index = 0; index < values.length; index += 1) {
		output[index] = values[index] >= threshold ? 1 : 0;
	}
	return output;
}

function floydSteinbergPixels(
	values: Float32Array,
	width: number,
	height: number,
	threshold: number,
) {
	const work = new Float32Array(values);
	for (let index = 0; index < work.length; index += 1) {
		if (work[index] > 200) work[index] = 255;
		else if (work[index] < 55) work[index] = 0;
	}
	const output = new Uint8Array(values.length);
	const diffuse = (x: number, y: number, error: number, factor: number) => {
		if (x < 0 || y < 0 || x >= width || y >= height) return;
		work[y * width + x] += error * factor;
	};
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const index = y * width + x;
			const next = work[index] >= threshold ? 255 : 0;
			output[index] = next === 255 ? 1 : 0;
			const error = work[index] - next;
			diffuse(x + 1, y, error, 7 / 16);
			diffuse(x - 1, y + 1, error, 3 / 16);
			diffuse(x, y + 1, error, 5 / 16);
			diffuse(x + 1, y + 1, error, 1 / 16);
		}
	}
	return output;
}

export function monochromePixels(
	raw: Uint8Array,
	width: number,
	height: number,
	channels: number,
	threshold: number,
	mode: DitherMode,
) {
	const values = luminanceBuffer(raw, width, height, channels);
	if (mode === "floyd-steinberg") {
		return floydSteinbergPixels(values, width, height, threshold);
	}
	return thresholdPixels(values, mode === "grayscale" ? 128 : threshold);
}

export function monochromePixelsWithRegions(
	raw: Uint8Array,
	width: number,
	height: number,
	channels: number,
	threshold: number,
	mode: DitherMode,
	regions: DitherRegion[] = [],
) {
	const output = monochromePixels(
		raw,
		width,
		height,
		channels,
		threshold,
		mode,
	);
	for (const region of regions) {
		const left = Math.max(0, Math.round(region.x));
		const top = Math.max(0, Math.round(region.y));
		const right = Math.min(width, Math.round(region.x + region.width));
		const bottom = Math.min(height, Math.round(region.y + region.height));
		const regionWidth = right - left;
		const regionHeight = bottom - top;
		if (regionWidth < 1 || regionHeight < 1) continue;

		const cropped = new Uint8Array(regionWidth * regionHeight * channels);
		for (let y = 0; y < regionHeight; y += 1) {
			const sourceOffset = ((top + y) * width + left) * channels;
			const targetOffset = y * regionWidth * channels;
			cropped.set(
				raw.subarray(sourceOffset, sourceOffset + regionWidth * channels),
				targetOffset,
			);
		}
		const regionPixels = monochromePixels(
			cropped,
			regionWidth,
			regionHeight,
			channels,
			threshold,
			region.ditherMode,
		);
		for (let y = 0; y < regionHeight; y += 1) {
			output.set(
				regionPixels.subarray(y * regionWidth, (y + 1) * regionWidth),
				(top + y) * width + left,
			);
		}
	}
	return output;
}

export function monochromePixelsWithThresholdedText(
	raw: Uint8Array,
	textlessRaw: Uint8Array,
	width: number,
	height: number,
	channels: number,
	threshold: number,
	mode: DitherMode,
	regions: DitherRegion[] = [],
) {
	if (textlessRaw.length !== raw.length) {
		throw new Error(
			`Unexpected textless render size: got ${textlessRaw.length}, expected ${raw.length}`,
		);
	}

	const output = monochromePixelsWithRegions(
		textlessRaw,
		width,
		height,
		channels,
		threshold,
		mode,
		regions,
	);
	const thresholded = monochromePixels(
		raw,
		width,
		height,
		channels,
		threshold,
		"threshold",
	);
	const rendered = luminanceBuffer(raw, width, height, channels);
	const withoutText = luminanceBuffer(textlessRaw, width, height, channels);
	for (let index = 0; index < output.length; index += 1) {
		if (Math.abs(rendered[index] - withoutText[index]) > 0.5) {
			output[index] = thresholded[index];
		}
	}
	return output;
}
