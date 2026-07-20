import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "tiding_session";

export function adminSessionToken(pin: string) {
	return createHash("sha256").update(`tiding-admin:${pin}`).digest("hex");
}

function cookieValue(req: Request, name: string) {
	const cookieHeader = req.headers.get("cookie") ?? "";
	for (const cookie of cookieHeader.split(";")) {
		const [key, ...valueParts] = cookie.trim().split("=");
		if (key === name) return valueParts.join("=");
	}
	return undefined;
}

function secureCompare(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	return (
		leftBuffer.length === rightBuffer.length &&
		timingSafeEqual(leftBuffer, rightBuffer)
	);
}

export function isAdminAuthenticated(req: Request, adminPin?: string) {
	if (!adminPin) return true;
	const token = cookieValue(req, ADMIN_SESSION_COOKIE);
	return Boolean(token && secureCompare(token, adminSessionToken(adminPin)));
}

export function isAdminOrBearerAuthenticated(
	req: Request,
	adminPin?: string,
	bearerToken?: string,
) {
	if (!adminPin && !bearerToken) return true;
	if (adminPin && isAdminAuthenticated(req, adminPin)) return true;
	if (!bearerToken) return false;
	const authorization = req.headers.get("authorization") ?? "";
	const prefix = "Bearer ";
	if (!authorization.startsWith(prefix)) return false;
	return secureCompare(authorization.slice(prefix.length), bearerToken);
}

export function adminSessionCookie(adminPin: string) {
	return `${ADMIN_SESSION_COOKIE}=${adminSessionToken(adminPin)}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearAdminSessionCookie() {
	return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
