import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const packageName = "@takumi-rs/core-linux-arm64-gnu";
const corePackage = JSON.parse(
	fs.readFileSync("node_modules/@takumi-rs/core/package.json", "utf8"),
) as { optionalDependencies?: Record<string, string> };
const version = corePackage.optionalDependencies?.[packageName];
if (!version) throw new Error(`Missing ${packageName} version`);

const releaseDir = path.resolve("dist/rpi-release");
const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "tiding-rpi-"));
fs.rmSync(releaseDir, { recursive: true, force: true });
fs.mkdirSync(releaseDir, { recursive: true });

fs.copyFileSync("dist/tiding-linux-arm64", path.join(releaseDir, "inker"));
fs.chmodSync(path.join(releaseDir, "inker"), 0o755);
fs.copyFileSync(
	"dist/tiding-mcp-linux-arm64",
	path.join(releaseDir, "tiding-mcp"),
);
fs.chmodSync(path.join(releaseDir, "tiding-mcp"), 0o755);
fs.cpSync("public", path.join(releaseDir, "public"), { recursive: true });
fs.cpSync("assets", path.join(releaseDir, "assets"), { recursive: true });

const packed = Bun.spawnSync({
	cmd: [
		"npm",
		"pack",
		`${packageName}@${version}`,
		"--pack-destination",
		temporaryDir,
	],
	stdout: "pipe",
	stderr: "inherit",
});
if (packed.exitCode !== 0) throw new Error(`Could not download ${packageName}`);
const archive = fs
	.readdirSync(temporaryDir)
	.find((entry) => entry.endsWith(".tgz"));
if (!archive) throw new Error(`npm pack did not produce ${packageName}`);

const extracted = Bun.spawnSync({
	cmd: ["tar", "-xzf", path.join(temporaryDir, archive), "-C", temporaryDir],
	stderr: "inherit",
});
if (extracted.exitCode !== 0) throw new Error(`Could not extract ${archive}`);
fs.copyFileSync(
	path.join(temporaryDir, "package/core.linux-arm64-gnu.node"),
	path.join(releaseDir, "core.linux-arm64-gnu.node"),
);

fs.writeFileSync(
	path.join(releaseDir, ".env.tiding.example"),
	[
		"PORT=43337",
		"DB_PATH=data/inker.db",
		"CACHE_PATH=data/cache",
		"TIDING_ADMIN_PIN=1111",
		"TIDING_TIME_ZONE=Europe/Berlin",
		"TAKUMI_CORE_TARGET=./core.linux-arm64-gnu.node",
		"",
	].join("\n"),
);

console.log(`Raspberry Pi release assembled at ${releaseDir}`);
