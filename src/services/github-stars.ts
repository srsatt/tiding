import type { DatabaseService } from "../db";
import type { WidgetConfig } from "../rendering/composer/framework-widgets";
import { githubHeaders } from "./data-source-security";

function repoPath(repo: unknown) {
	const [owner, name] = String(repo || "")
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean);
	return owner && name
		? `${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
		: null;
}

export async function enrichGithubStarsConfig(
	db: DatabaseService,
	config: WidgetConfig,
	fetcher: typeof fetch = globalThis.fetch,
): Promise<WidgetConfig> {
	if (config.live !== true) return config;
	const path = repoPath(config.repo);
	if (!path) return { ...config, githubError: "Repository must be owner/name" };

	try {
		const url = `https://api.github.com/repos/${path}`;
		const response = await fetcher(url, {
			headers: await githubHeaders(
				url,
				{ Accept: "application/vnd.github+json" },
				db,
			),
		});
		if (!response.ok) {
			return { ...config, githubError: `GitHub ${response.status}` };
		}
		const data = (await response.json()) as { stargazers_count?: unknown };
		const stars = Number(data.stargazers_count);
		if (!Number.isFinite(stars)) return { ...config, githubError: "No stars" };
		return { ...config, stars: Math.max(0, Math.round(stars)) };
	} catch (error) {
		return { ...config, githubError: (error as Error).message };
	}
}
