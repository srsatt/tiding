import { t } from "ttag";
import { Button } from "../../design-system/buttons";
import { TextField } from "../../design-system/native-controls";
import { FormActions } from "../../ui";

export function LoginPage({ error = false }: { error?: boolean }) {
	return (
		<main className={"loginLayout"}>
			<section className={"loginPanel"}>
				<h1>{t`Welcome to Tiding`}</h1>
				<p>{t`Enter your PIN to access the dashboard.`}</p>
				{error ? <p className={"errorText"}>{t`Invalid PIN.`}</p> : null}
				<form action="/login" method="POST" className={"formGrid"}>
					<TextField
						className="wide"
						label={t`PIN`}
						name="pin"
						type="password"
						inputMode="numeric"
						autoComplete="current-password"
						required
					/>
					<FormActions>
						<Button type="submit">{t`Sign in`}</Button>
					</FormActions>
				</form>
			</section>
		</main>
	);
}
