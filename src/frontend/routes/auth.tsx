import renderToString from "preact-render-to-string";
import { t } from "ttag";
import { LoginPage } from "../features/auth/login-page";

export function renderLoginPage(error = false) {
	const html = renderToString(
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<title>
					{t`Sign in`} | {t`Tiding`}
				</title>
				<link rel="stylesheet" href="/static/admin.css" />
			</head>
			<body>
				<LoginPage error={error} />
			</body>
		</html>,
	);
	return `<!DOCTYPE html>${html}`;
}
