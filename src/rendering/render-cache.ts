import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as nodePath from "node:path";

export class RenderCache {
	constructor(private cacheDir: string) {
		fs.mkdirSync(cacheDir, { recursive: true });
	}

	private artifactName(screenId: number, variant?: string) {
		const safeVariant = variant?.replace(/[^a-zA-Z0-9_-]/g, "-");
		return `screen-${screenId}${safeVariant ? `-${safeVariant}` : ""}.bmp`;
	}

	artifactPath(screenId: number, variant?: string) {
		return nodePath.join(this.cacheDir, this.artifactName(screenId, variant));
	}

	artifactUrl(screenId: number, variant?: string) {
		return `/cache/${this.artifactName(screenId, variant)}`;
	}

	deviceArtifactUrl(screenId: number, variant?: string) {
		const artifact = this.read(screenId, variant);
		if (!artifact) return this.artifactUrl(screenId, variant);
		const revision = createHash("sha256")
			.update(artifact)
			.digest("hex")
			.slice(0, 12);
		return `${this.artifactUrl(screenId, variant)}?v=${revision}`;
	}

	write(screenId: number, artifact: Buffer, variant?: string) {
		const target = this.artifactPath(screenId, variant);
		const temporary = `${target}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
		try {
			fs.writeFileSync(temporary, artifact);
			fs.renameSync(temporary, target);
		} finally {
			if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
		}
	}

	read(screenId: number, variant?: string) {
		const file = this.artifactPath(screenId, variant);
		if (!fs.existsSync(file)) return null;
		const artifact = fs.readFileSync(file);
		if (
			artifact.length >= 26 &&
			artifact.toString("ascii", 0, 2) === "BM" &&
			artifact.readInt32LE(22) < 0
		) {
			fs.unlinkSync(file);
			return null;
		}
		return artifact;
	}

	invalidate(screenId: number) {
		const prefix = `screen-${screenId}`;
		for (const name of fs.readdirSync(this.cacheDir)) {
			if (
				(name === `${prefix}.bmp` || name.startsWith(`${prefix}-`)) &&
				name.endsWith(".bmp")
			) {
				fs.unlinkSync(nodePath.join(this.cacheDir, name));
			}
		}
	}
}
