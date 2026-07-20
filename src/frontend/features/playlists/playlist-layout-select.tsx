import { SelectControl } from "../../design-system/native-controls";

const layouts = ["1x1", "2x2", "2x1", "1x2"];

export function PlaylistLayoutSelect({
	id,
	selected,
	form,
}: {
	id: string;
	selected: string;
	form?: string;
}) {
	return (
		<SelectControl id={id} name="layout" form={form}>
			{layouts.map((layout) => (
				<option key={layout} value={layout} selected={selected === layout}>
					{layout}
				</option>
			))}
		</SelectControl>
	);
}
