import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
	attributeNamePrefix: "@_",
	ignoreAttributes: false,
	parseTagValue: true,
	removeNSPrefix: true,
	trimValues: true,
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

function record(value: unknown): Record<string, unknown> {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: {};
}

function text(value: unknown): string {
	if (value === undefined || value === null) return "";
	if (typeof value === "string" || typeof value === "number")
		return String(value);
	const valueRecord = record(value);
	return text(valueRecord["#text"] ?? valueRecord.text);
}

function firstText(...values: unknown[]) {
	for (const value of values) {
		const parsed = text(value);
		if (parsed) return parsed;
	}
	return "";
}

function linkValue(value: unknown): string {
	if (typeof value === "string") return value;
	for (const candidate of asArray(value)) {
		const item = record(candidate);
		const rel = text(item["@_rel"]);
		const href = text(item["@_href"]);
		if (href && (!rel || rel === "alternate")) return href;
	}
	return "";
}

function rssFeed(root: Record<string, unknown>) {
	const channel = record(record(root.rss).channel);
	const items = asArray(channel.item).map((item) => {
		const entry = record(item);
		return {
			title: firstText(entry.title),
			link: firstText(entry.link),
			summary: firstText(entry.description, entry.summary),
			publishedAt: firstText(entry.pubDate, entry.published, entry.updated),
			author: firstText(entry.author, entry.creator),
		};
	});
	return {
		feed: {
			title: firstText(channel.title),
			link: firstText(channel.link),
			description: firstText(channel.description),
		},
		items,
	};
}

function atomFeed(root: Record<string, unknown>) {
	const feed = record(root.feed);
	const items = asArray(feed.entry).map((item) => {
		const entry = record(item);
		return {
			title: firstText(entry.title),
			link: linkValue(entry.link),
			summary: firstText(entry.summary, entry.content),
			publishedAt: firstText(entry.published, entry.updated),
			author: firstText(record(entry.author).name, entry.author),
		};
	});
	return {
		feed: {
			title: firstText(feed.title),
			link: linkValue(feed.link),
			description: firstText(feed.subtitle),
		},
		items,
	};
}

export function parseFeedXml(xml: string) {
	const root = record(parser.parse(xml));
	if (root.rss) return JSON.stringify(rssFeed(root));
	if (root.feed) return JSON.stringify(atomFeed(root));
	throw new Error("Unsupported RSS/Atom feed");
}
