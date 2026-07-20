import type { DatabaseService } from "../db";

const INTERNAL_HOSTS = new Set([
	"metadata.google.internal",
	"metadata",
	"169.254.169.254",
]);

function isPrivateIpv4(host: string) {
	const parts = host.split(".").map((part) => Number.parseInt(part, 10));
	if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
		return false;
	}
	const [a, b] = parts;
	return (
		a === 10 ||
		a === 127 ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 169 && b === 254)
	);
}

function isLocalHost(host: string) {
	const normalized = host.toLowerCase();
	return (
		normalized === "localhost" ||
		normalized.endsWith(".localhost") ||
		normalized === "::1" ||
		isPrivateIpv4(normalized)
	);
}

export async function assertNetworkAllowed(url: string, db?: DatabaseService) {
	const parsed = new URL(url);
	const host = parsed.hostname.toLowerCase();
	if (INTERNAL_HOSTS.has(host)) {
		throw new Error("Internal service hostnames are blocked");
	}
	const allowLocal =
		(await db?.settings.get("data_source_allow_local_network")) ?? "true";
	if (allowLocal !== "true" && isLocalHost(host)) {
		throw new Error("Local network data sources are disabled");
	}
}

export async function githubHeaders(
	url: string,
	headers: Record<string, string>,
	db?: DatabaseService,
) {
	const parsed = new URL(url);
	if (parsed.hostname.toLowerCase() !== "api.github.com") return headers;
	const hasAuth = Object.keys(headers).some(
		(key) => key.toLowerCase() === "authorization",
	);
	const token = await db?.settings.get("github_api_token");
	if (!token || hasAuth) return headers;
	return { ...headers, Authorization: `Bearer ${token}` };
}
