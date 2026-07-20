import { t } from "ttag";
import type { Widget } from "../../../db/repositories/widget.repository";
import { ButtonLink, DeleteForm, EmptyRow } from "../../ui";

function WidgetRows({ widgets }: { widgets: Widget[] }) {
	if (widgets.length === 0)
		return <EmptyRow colSpan={5}>{t`No widgets on this screen.`}</EmptyRow>;
	return (
		<>
			{widgets.map((widget) => (
				<tr key={widget.id}>
					<td>{widget.id}</td>
					<td>
						{widget.x}, {widget.y}
					</td>
					<td>
						{widget.width}x{widget.height}
					</td>
					<td>{widget.z_index}</td>
					<td className={"actions"}>
						<ButtonLink href={`/screens/widgets/${widget.id}`} variant="small">
							{t`Edit`}
						</ButtonLink>
						<DeleteForm action={`/api/widgets/${widget.id}`} />
					</td>
				</tr>
			))}
		</>
	);
}

export function ScreenWidgetsTable({ widgets }: { widgets: Widget[] }) {
	return (
		<table className="compactTable">
			<thead>
				<tr>
					<th>ID</th>
					<th>{t`Position`}</th>
					<th>{t`Size`}</th>
					<th>Z</th>
					<th>{t`Actions`}</th>
				</tr>
			</thead>
			<tbody>
				<WidgetRows widgets={widgets} />
			</tbody>
		</table>
	);
}
