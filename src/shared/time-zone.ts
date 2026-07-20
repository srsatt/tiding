export const DEFAULT_TIME_ZONE = "Europe/Berlin";

export function configuredTimeZone(value?: unknown) {
	const requested =
		typeof value === "string" && value.trim()
			? value.trim()
			: process.env.TIDING_TIME_ZONE?.trim() || DEFAULT_TIME_ZONE;
	try {
		new Intl.DateTimeFormat("en", { timeZone: requested }).format(0);
		return requested;
	} catch {
		return DEFAULT_TIME_ZONE;
	}
}
