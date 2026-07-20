import type { DatabaseService } from "../db";
import {
	adminSessionCookie,
	clearAdminSessionCookie,
	isAdminAuthenticated,
} from "../server/admin-auth";
import { renderAdminRoute } from "./admin-routes";
import { renderLoginPage } from "./routes/auth";
import type { AdminPageOptions } from "./types";

export type { AdminPageOptions } from "./types";

export async function handleAdminPage(
	req: Request,
	db: DatabaseService,
	options: AdminPageOptions,
) {
	const url = new URL(req.url);
	const path = url.pathname;

	if (path === "/login") {
		if (!options.adminPin || isAdminAuthenticated(req, options.adminPin)) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/dashboard" },
			});
		}
		if (req.method === "POST") {
			const formData = await req.formData();
			const pin = String(formData.get("pin") ?? "");
			if (pin === options.adminPin) {
				return new Response(null, {
					status: 303,
					headers: {
						Location: "/dashboard",
						"Set-Cookie": adminSessionCookie(options.adminPin),
					},
				});
			}
			return new Response(renderLoginPage(true), {
				status: 401,
				headers: { "Content-Type": "text/html" },
			});
		}
		return new Response(renderLoginPage(), {
			headers: { "Content-Type": "text/html" },
		});
	}

	if (path === "/logout") {
		return new Response(null, {
			status: 303,
			headers: {
				Location: "/login",
				"Set-Cookie": clearAdminSessionCookie(),
			},
		});
	}

	if (!isAdminAuthenticated(req, options.adminPin)) {
		return new Response(null, {
			status: 302,
			headers: { Location: "/login" },
		});
	}

	if (path === "/" || path === "") {
		return new Response(null, {
			status: 302,
			headers: { Location: "/dashboard" },
		});
	}

	const html = await renderAdminRoute(url, db, options);
	if (html instanceof Response) return html;
	if (html === null) return null;
	return new Response(html, { headers: { "Content-Type": "text/html" } });
}
