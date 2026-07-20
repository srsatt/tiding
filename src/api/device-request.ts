const DEVICE_ID_HEADERS = [
	"HTTP_ID",
	"ID",
	"x-device-id",
	"device-id",
	"access-token",
] as const;

export function deviceIdHeader(req: Request) {
	for (const name of DEVICE_ID_HEADERS) {
		const value = req.headers.get(name)?.trim();
		if (value) return value;
	}
	return undefined;
}
