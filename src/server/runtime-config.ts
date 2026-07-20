export interface RuntimeServerConfig {
	port: number;
	idleTimeout: number;
	development: boolean;
}

function integerFromEnv(env: NodeJS.ProcessEnv, key: string, fallback: number) {
	const raw = env[key];
	if (!raw) return fallback;
	const parsed = Number(raw);
	return Number.isInteger(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function runtimeServerConfig(
	env: NodeJS.ProcessEnv = process.env,
): RuntimeServerConfig {
	return {
		port: clamp(integerFromEnv(env, "PORT", 43337), 1, 65535),
		idleTimeout: clamp(
			integerFromEnv(env, "TIDING_HTTP_IDLE_TIMEOUT_SECONDS", 10),
			1,
			255,
		),
		development: env.TIDING_DEV_SERVER === "1",
	};
}
