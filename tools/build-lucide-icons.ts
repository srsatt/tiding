import * as fs from "node:fs";
import * as path from "node:path";
import { gzipSync } from "node:zlib";
import {
	LUCIDE_ICON_NAMES,
	LUCIDE_ICON_VERSION,
} from "../src/frontend/design-system/lucide-icons";

type IconNode = Array<[string, Record<string, string>]>;

function escapeAttribute(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function attributeName(name: string) {
	return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function renderNode([tag, attributes]: IconNode[number]) {
	const serialized = Object.entries(attributes)
		.filter(([name]) => name !== "key")
		.map(([name, value]) => {
			const normalized = value === "currentColor" ? "#000" : value;
			return `${attributeName(name)}="${escapeAttribute(normalized)}"`;
		})
		.join(" ");
	return `<${tag}${serialized ? ` ${serialized}` : ""}/>`;
}

const outputDir = path.join(
	process.cwd(),
	"public",
	"static",
	"icons",
	`lucide-${LUCIDE_ICON_VERSION}`,
);
fs.rmSync(outputDir, { force: true, recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const name of LUCIDE_ICON_NAMES) {
	const module = (await import(`lucide-react/dist/esm/icons/${name}.mjs`)) as {
		__iconNode: IconNode;
	};
	const body = module.__iconNode.map(renderNode).join("");
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>\n`;
	const target = path.join(outputDir, `${name}.svg`);
	fs.writeFileSync(target, svg);
	fs.writeFileSync(`${target}.gz`, gzipSync(svg, { level: 9 }));
}
