import { t } from "ttag";
import type { DataSource } from "../../../db/repositories/data-source.repository";
import { formatTimestamp } from "../../format";
import { Button, ButtonLink, cx } from "../../ui";

function isActive(value: unknown) {
	return value === true || value === 1 || value === "1";
}

function redactedHeaders(headers?: string | null) {
	if (!headers) return t`No headers`;
	try {
		const parsed = JSON.parse(headers) as Record<string, unknown>;
		const keys = Object.keys(parsed);
		if (keys.length === 0) return t`No headers`;
		return keys.map((key) => `${key}: ******`).join(", ");
	} catch {
		return t`Headers configured`;
	}
}

function typeLabel(source: DataSource) {
	const type = source.type || "http";
	if (type === "rss" || type === "atom") return "RSS/Atom";
	return type.toUpperCase();
}

export function DataSourceRow({
	source,
	usageCount,
}: {
	source: DataSource;
	usageCount: number;
}) {
	const active = isActive(source.is_active);
	return (
		<tr>
			<td>
				<a href={`/data-sources/${source.id}`}>{source.name}</a>
				<div className={"mutedText"}>{redactedHeaders(source.headers)}</div>
			</td>
			<td>
				<code>{typeLabel(source)}</code>
				<div>
					<code>{source.method}</code>
				</div>
			</td>
			<td className={"truncate"} title={source.url}>
				<span>{source.url}</span>
			</td>
			<td>{usageCount}</td>
			<td>
				<form
					action={`/api/data-sources/${source.id}/toggle`}
					method="POST"
					className={"inlineForm"}
				>
					<input type="hidden" name="is_active" value={active ? "0" : "1"} />
					<Button
						type="submit"
						tone="secondary"
						size="sm"
						className={cx("status", active ? "ok" : "muted")}
						aria-pressed={active}
					>
						{active ? t`active` : t`inactive`}
					</Button>
				</form>
			</td>
			<td>
				<span className={cx("status", source.last_error ? "errorText" : "ok")}>
					{source.last_error ? t`error` : t`ready`}
				</span>
			</td>
			<td>{formatTimestamp(source.last_fetched_at)}</td>
			<td className={"actions"}>
				<form
					action={`/api/data-sources/${source.id}/fetch`}
					method="POST"
					className={"inlineForm"}
				>
					<Button type="submit" size="sm">
						{t`Test URL`}
					</Button>
				</form>
				<ButtonLink
					href={`/data-sources/${source.id}`}
					variant="smallSecondary"
				>
					{t`Edit`}
				</ButtonLink>
			</td>
		</tr>
	);
}
