import { afterEach, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as nodePath from "node:path";
import { DatabaseService } from "../src/db";

const children: Array<ReturnType<typeof Bun.spawn>> = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
	for (const child of children.splice(0)) {
		child.kill();
		await child.exited;
	}
	for (const directory of temporaryDirectories.splice(0)) {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});

async function waitForHttp(url: string) {
	for (let attempt = 0; attempt < 80; attempt += 1) {
		try {
			const response = await fetch(url);
			if (response.ok) return;
		} catch {
			// Server is still starting.
		}
		await Bun.sleep(25);
	}
	throw new Error(`Server did not become ready: ${url}`);
}

test("main Bun server exposes an authenticated Streamable HTTP MCP route", async () => {
	const directory = fs.mkdtempSync(
		nodePath.join(os.tmpdir(), "tiding-mcp-http-"),
	);
	temporaryDirectories.push(directory);
	const dbPath = nodePath.join(directory, "tiding.db");
	const cachePath = nodePath.join(directory, "cache");
	const db = new DatabaseService(dbPath, { bootstrap: true });
	await db.screens.create("HTTP MCP screen");
	db.close();

	const reservation = Bun.serve({
		port: 0,
		fetch: () => new Response("reserved"),
	});
	const port = reservation.port;
	reservation.stop(true);
	const child = Bun.spawn(["bun", "run", "src/index.ts"], {
		cwd: process.cwd(),
		env: {
			...process.env,
			PORT: String(port),
			DB_PATH: dbPath,
			CACHE_PATH: cachePath,
			TIDING_ADMIN_PIN: "2468",
		},
		stdout: "pipe",
		stderr: "pipe",
	});
	children.push(child);
	const baseUrl = `http://127.0.0.1:${port}`;
	await waitForHttp(`${baseUrl}/api/health`);

	const unauthorized = await fetch(`${baseUrl}/mcp`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method: "initialize",
			params: {},
		}),
	});
	expect(unauthorized.status).toBe(401);
	expect(unauthorized.headers.get("www-authenticate")).toBe("Bearer");

	const headers = {
		Authorization: "Bearer 2468",
		"Content-Type": "application/json",
		Accept: "application/json, text/event-stream",
	};
	const initialized = await fetch(`${baseUrl}/mcp`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 2,
			method: "initialize",
			params: { protocolVersion: "2025-03-26" },
		}),
	});
	expect(initialized.status).toBe(200);
	expect(initialized.headers.get("content-type")).toContain("application/json");
	const initializeBody = await initialized.json();
	expect(initializeBody.result).toMatchObject({
		protocolVersion: "2025-03-26",
		serverInfo: { name: "tiding" },
		capabilities: { tools: {} },
	});

	const listed = await fetch(`${baseUrl}/mcp`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 3,
			method: "tools/call",
			params: { name: "screen_designs.list", arguments: {} },
		}),
	});
	const listBody = await listed.json();
	const screens = JSON.parse(listBody.result.content[0].text);
	expect(screens).toEqual([
		expect.objectContaining({
			name: "HTTP MCP screen",
			width: 800,
			height: 480,
		}),
	]);

	const notification = await fetch(`${baseUrl}/mcp`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			jsonrpc: "2.0",
			method: "notifications/initialized",
			params: {},
		}),
	});
	expect(notification.status).toBe(202);

	const unsupportedGet = await fetch(`${baseUrl}/mcp`, { headers });
	expect(unsupportedGet.status).toBe(405);
});
