export interface SampleSummary {
	count: number;
	minMs: number;
	maxMs: number;
	avgMs: number;
	p50Ms: number;
	p95Ms: number;
}

export interface EndpointBenchmark {
	name: string;
	url: string;
	summary: SampleSummary;
	statusCounts: Record<string, number>;
}

function round(value: number) {
	return Math.round(value * 100) / 100;
}

export function summarizeSamples(samples: number[]): SampleSummary {
	if (samples.length === 0) {
		return { count: 0, minMs: 0, maxMs: 0, avgMs: 0, p50Ms: 0, p95Ms: 0 };
	}

	const sorted = [...samples].sort((a, b) => a - b);
	const percentile = (p: number) => {
		const index = Math.min(
			sorted.length - 1,
			Math.ceil((p / 100) * sorted.length) - 1,
		);
		return sorted[index];
	};
	const total = sorted.reduce((sum, value) => sum + value, 0);

	return {
		count: sorted.length,
		minMs: round(sorted[0]),
		maxMs: round(sorted[sorted.length - 1]),
		avgMs: round(total / sorted.length),
		p50Ms: round(percentile(50)),
		p95Ms: round(percentile(95)),
	};
}

function envInt(name: string, fallback: number) {
	const parsed = Number(process.env[name]);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function benchmarkPaths() {
	return (process.env.TIDING_BENCHMARK_PATHS || "/api/health,/api/version")
		.split(",")
		.map((path) => path.trim())
		.filter(Boolean);
}

function benchmarkHeaders() {
	const headers: Record<string, string> = {};
	if (process.env.TIDING_BENCHMARK_HTTP_ID) {
		headers.HTTP_ID = process.env.TIDING_BENCHMARK_HTTP_ID;
	}
	return headers;
}

async function measureEndpoint(
	baseUrl: string,
	path: string,
	iterations: number,
	headers: Record<string, string>,
): Promise<EndpointBenchmark> {
	const url = new URL(path, baseUrl).toString();
	const samples: number[] = [];
	const statusCounts: Record<string, number> = {};

	for (let i = 0; i < iterations; i += 1) {
		const started = performance.now();
		const response = await fetch(url, { headers });
		await response.arrayBuffer();
		samples.push(performance.now() - started);
		const status = String(response.status);
		statusCounts[status] = (statusCounts[status] ?? 0) + 1;
	}

	return {
		name: path,
		url,
		summary: summarizeSamples(samples),
		statusCounts,
	};
}

async function runBenchmark(baseUrl: string) {
	const iterations = envInt("TIDING_BENCHMARK_ITERATIONS", 25);
	const headers = benchmarkHeaders();
	const endpoints = [];
	for (const path of benchmarkPaths()) {
		endpoints.push(await measureEndpoint(baseUrl, path, iterations, headers));
	}
	return { baseUrl, iterations, endpoints };
}

if (import.meta.main) {
	const baseUrl =
		process.env.TIDING_BENCHMARK_BASE_URL || "http://127.0.0.1:43337";
	const compareUrl = process.env.TIDING_BENCHMARK_COMPARE_URL;
	const result = {
		tiding: await runBenchmark(baseUrl),
		compare: compareUrl ? await runBenchmark(compareUrl) : null,
	};
	console.log(JSON.stringify(result, null, 2));
}
