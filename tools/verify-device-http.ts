import * as fs from "node:fs";
import * as path from "node:path";

type JsonObject = Record<string, unknown>;

interface Options {
	baseUrl: string;
	httpId: string;
	outDir: string;
	allowEmptyDisplay: boolean;
}

interface BmpInfo {
	file: string;
	bytes: number;
	width: number;
	height: number;
	bitDepth: number;
	colors: number;
	pixelOffset: number;
	nonEmpty: boolean;
	contentType: string | null;
}

function usage() {
	return [
		"Usage: bun run verify:device-http -- --base-url http://host:43337 --http-id AA:BB:CC:DD:EE:FF [--out-dir /tmp/tiding-device] [--allow-empty-display]",
		"",
		"Calls /api/setup, /api/setup-screen.bmp, /api/display, and the returned display image URL.",
		"Writes downloaded BMPs plus evidence.json to the output directory.",
	].join("\n");
}

function readOption(args: string[], name: string) {
	const index = args.indexOf(name);
	if (index === -1) return undefined;
	return args[index + 1];
}

function parseOptions(args: string[]): Options {
	if (args.includes("--help") || args.includes("-h")) {
		console.log(usage());
		process.exit(0);
	}
	const baseUrl = readOption(args, "--base-url") ?? readOption(args, "--base");
	const httpId = readOption(args, "--http-id") ?? readOption(args, "--id");
	if (!baseUrl || !httpId) throw new Error(usage());
	return {
		baseUrl: baseUrl.replace(/\/+$/, ""),
		httpId,
		outDir:
			readOption(args, "--out-dir") ??
			path.join("/tmp", `tiding-device-${Date.now()}`),
		allowEmptyDisplay: args.includes("--allow-empty-display"),
	};
}

async function fetchJson(url: string, httpId: string) {
	const response = await fetch(url, {
		headers: {
			HTTP_ID: httpId,
			ID: httpId,
			battery: "88",
			wifi: "-55",
			"firmware-version": "0.0.0-verifier",
			"device-name": "Tiding verifier",
		},
	});
	const text = await response.text();
	let body: JsonObject;
	try {
		body = JSON.parse(text) as JsonObject;
	} catch {
		throw new Error(
			`${url} returned non-JSON ${response.status}: ${text.slice(0, 200)}`,
		);
	}
	if (!response.ok) {
		throw new Error(
			`${url} returned ${response.status}: ${JSON.stringify(body)}`,
		);
	}
	return { status: response.status, body };
}

async function fetchBmp(url: string, file: string): Promise<BmpInfo> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url} returned ${response.status}`);
	const contentType = response.headers.get("content-type");
	if (!contentType?.includes("image/bmp")) {
		throw new Error(`${url} returned ${contentType ?? "no content type"}`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	fs.writeFileSync(file, buffer);
	return validateBmp(buffer, file, contentType);
}

function validateBmp(
	buffer: Buffer,
	file: string,
	contentType: string | null,
): BmpInfo {
	if (buffer.length < 62) throw new Error(`${file} is too small for a BMP`);
	if (buffer.subarray(0, 2).toString("ascii") !== "BM") {
		throw new Error(`${file} is not a BMP`);
	}
	const pixelOffset = buffer.readUInt32LE(10);
	const width = buffer.readInt32LE(18);
	const signedHeight = buffer.readInt32LE(22);
	const height = Math.abs(signedHeight);
	const bitDepth = buffer.readUInt16LE(28);
	const colors = buffer.readUInt32LE(46);
	const pixelData = buffer.subarray(pixelOffset);
	const nonEmpty = pixelData.some((byte) => byte !== 0);
	if (bitDepth !== 1) throw new Error(`${file} is ${bitDepth}-bit, not 1-bit`);
	if (colors !== 2) throw new Error(`${file} has ${colors} colors, not 2`);
	if (signedHeight < 0) {
		throw new Error(
			`${file} is a top-down BMP unsupported by TRMNL firmware v1.6.10`,
		);
	}
	if (!nonEmpty) throw new Error(`${file} has no non-empty pixel data`);
	return {
		file,
		bytes: buffer.length,
		width,
		height,
		bitDepth,
		colors,
		pixelOffset,
		nonEmpty,
		contentType,
	};
}

function asString(value: unknown) {
	return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function redactJson(body: JsonObject) {
	return Object.fromEntries(
		Object.entries(body).map(([key, value]) => [
			key,
			key.toLowerCase().includes("key") ? "[redacted]" : value,
		]),
	);
}

function requireBmpSize(
	bmp: BmpInfo,
	expected: { width: number; height: number },
) {
	if (bmp.width !== expected.width || bmp.height !== expected.height) {
		throw new Error(
			`${bmp.file} is ${bmp.width}x${bmp.height}, expected ${expected.width}x${expected.height}`,
		);
	}
}

function requireDisplayMetadata(
	display: JsonObject,
	imageUrl: string,
	bmp: BmpInfo,
) {
	const width = asNumber(display.width);
	const height = asNumber(display.height);
	if (width !== null && height !== null) requireBmpSize(bmp, { width, height });
	const parsed = new URL(imageUrl);
	for (const key of ["t", "battery", "wifi", "deviceName", "macAddress"]) {
		if (!parsed.searchParams.get(key)) {
			throw new Error(`/api/display image_url is missing ${key}`);
		}
	}
	if (parsed.searchParams.get("format") !== "bmp") {
		throw new Error("/api/display image_url does not request format=bmp");
	}
}

async function main() {
	const options = parseOptions(process.argv.slice(2));
	fs.mkdirSync(options.outDir, { recursive: true });

	const setup = await fetchJson(`${options.baseUrl}/api/setup`, options.httpId);
	const setupImageUrl = asString(setup.body.image_url);
	if (!setupImageUrl) throw new Error("/api/setup did not return image_url");
	const setupBmp = await fetchBmp(
		setupImageUrl,
		path.join(options.outDir, "setup-screen.bmp"),
	);
	requireBmpSize(setupBmp, { width: 800, height: 480 });

	const display = await fetchJson(
		`${options.baseUrl}/api/display`,
		options.httpId,
	);
	const displayImageUrl = asString(display.body.image_url);
	if (!displayImageUrl && !options.allowEmptyDisplay) {
		throw new Error("/api/display did not return image_url");
	}
	const displayBmp = displayImageUrl
		? await fetchBmp(
				displayImageUrl,
				path.join(options.outDir, "display-screen.bmp"),
			)
		: null;
	if (displayBmp)
		requireDisplayMetadata(display.body, displayImageUrl, displayBmp);

	const evidence = {
		verifiedAt: new Date().toISOString(),
		baseUrl: options.baseUrl,
		httpId: options.httpId,
		setup: {
			status: setup.status,
			body: redactJson(setup.body),
			bmp: setupBmp,
		},
		display: {
			status: display.status,
			body: display.body,
			bmp: displayBmp,
		},
	};
	const evidenceFile = path.join(options.outDir, "evidence.json");
	fs.writeFileSync(evidenceFile, `${JSON.stringify(evidence, null, 2)}\n`);
	console.log(`Device HTTP evidence written to ${evidenceFile}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
