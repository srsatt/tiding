import * as fs from "node:fs";
import * as nodePath from "node:path";

function contentType(filePath: string) {
	if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
	if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
	if (filePath.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
	return "application/octet-stream";
}

function acceptsGzip(req: Request) {
	return (req.headers.get("accept-encoding") || "")
		.split(",")
		.some((value) => value.trim().startsWith("gzip"));
}

export function staticAssetResponse(req: Request, root = "public") {
	const urlPath = new URL(req.url).pathname;
	if (!urlPath.startsWith("/static/")) return null;
	const publicRoot = nodePath.resolve(root);
	const filePath = nodePath.resolve(publicRoot, `.${urlPath}`);
	if (!filePath.startsWith(`${publicRoot}${nodePath.sep}`)) {
		return new Response("Not Found", { status: 404 });
	}

	try {
		const gzipPath = `${filePath}.gz`;
		const gzip = acceptsGzip(req) && fs.existsSync(gzipPath);
		const servedPath = gzip ? gzipPath : filePath;
		const stat = fs.statSync(servedPath);
		const etag = `W/"${stat.size}-${Math.trunc(stat.mtimeMs)}"`;
		const immutableAsset =
			urlPath.startsWith("/static/icons/lucide-") ||
			urlPath.startsWith("/static/js/chunks/");
		const headers = new Headers({
			"Cache-Control": immutableAsset
				? "public, max-age=31536000, immutable"
				: "public, max-age=0, must-revalidate",
			"Content-Type": contentType(filePath),
			ETag: etag,
			Vary: "Accept-Encoding",
		});
		if (gzip) headers.set("Content-Encoding", "gzip");
		if (req.headers.get("if-none-match") === etag) {
			return new Response(null, { headers, status: 304 });
		}
		return new Response(fs.readFileSync(servedPath), { headers });
	} catch {
		return new Response("Not Found", { status: 404 });
	}
}
