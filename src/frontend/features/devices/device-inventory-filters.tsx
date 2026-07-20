import { t } from "ttag";
import { SelectControl, TextField } from "../../design-system/native-controls";
import {
	SegmentedControl,
	SegmentedItem,
} from "../../design-system/segmented-control";
import { Button, ButtonLink } from "../../ui";
import type { DeviceFilters, DeviceStatusFilter } from "./device-inventory";

const statusOptions: Array<{ value: DeviceStatusFilter; label: string }> = [
	{ value: "all", label: t`All devices` },
	{ value: "active", label: t`Active` },
	{ value: "inactive", label: t`Inactive` },
	{ value: "update", label: t`Update available` },
	{ value: "updates-disabled", label: t`Updates disabled` },
];

export function DeviceInventoryFilters({
	filters,
	total,
	shown,
}: {
	filters: DeviceFilters;
	total: number;
	shown: number;
}) {
	return (
		<form action="/devices" method="GET" className={"formGrid"}>
			<TextField
				label={t`Search`}
				type="search"
				name="q"
				value={filters.query}
				placeholder={t`Label, ID, MAC, firmware`}
			/>
			<label htmlFor="device-status-filter">
				{t`Status`}
				<SelectControl id="device-status-filter" name="status">
					{statusOptions.map((option) => (
						<option
							key={option.value}
							value={option.value}
							selected={filters.status === option.value}
						>
							{option.label}
						</option>
					))}
				</SelectControl>
			</label>
			<SegmentedControl className={"wide deviceViewToggle"} label={t`View`}>
				<SegmentedItem
					type="submit"
					name="view"
					value="grid"
					checked={filters.view === "grid"}
				>
					{t`Grid`}
				</SegmentedItem>
				<SegmentedItem
					type="submit"
					name="view"
					value="list"
					checked={filters.view === "list"}
				>
					{t`List`}
				</SegmentedItem>
			</SegmentedControl>
			<div className={"formActions"}>
				<Button type="submit">{t`Apply`}</Button>
				<ButtonLink href="/devices" variant="secondary">
					{t`Reset`}
				</ButtonLink>
				<span className={"mutedText"}>
					{shown} / {total} {t`devices`}
				</span>
			</div>
		</form>
	);
}
