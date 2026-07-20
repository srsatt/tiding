import { configuredTimeZone } from "../../shared/time-zone";
import type { FrameworkWidgetDefinition } from "./framework-widget-kit";
import { Panel, value } from "./framework-widget-kit";

function widgetTimeZone(config: Record<string, unknown>) {
	return configuredTimeZone(config.timezone ?? config.timeZone);
}

function liveTime(config: Record<string, unknown>, now: Date) {
	const format = String(config.format ?? "24h").toLowerCase();
	return new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		second: config.showSeconds ? "2-digit" : undefined,
		hour12: format === "12h",
		timeZone: widgetTimeZone(config),
	}).format(now);
}

function liveDate(config: Record<string, unknown>, now: Date) {
	const format = String(config.dateFormat ?? config.format ?? "YYYY-MM-DD");
	const timeZone = widgetTimeZone(config);
	if (format === "YYYY-MM-DD") {
		const parts = new Intl.DateTimeFormat("en-CA", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			timeZone,
		}).formatToParts(now);
		const part = (type: Intl.DateTimeFormatPartTypes) =>
			parts.find((candidate) => candidate.type === type)?.value ?? "";
		return `${part("year")}-${part("month")}-${part("day")}`;
	}
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: format.includes("MMMM") ? "long" : "short",
		day: "numeric",
		weekday: format.includes("dddd") ? "long" : undefined,
		timeZone,
	}).format(now);
}

export const TIME_WIDGETS: FrameworkWidgetDefinition[] = [
	{
		name: "clock",
		label: "Live Clock",
		description: "Current time display",
		category: "Time & Date",
		defaultConfig: { time: "12:00" },
		minWidth: 180,
		minHeight: 80,
		render: (config, context) => <Panel>{liveTime(config, context.now)}</Panel>,
	},
	{
		name: "countdown",
		label: "Countdown Timer",
		description: "Countdown date display",
		category: "Time & Date",
		defaultConfig: { label: "Launch", target: "2026-12-31" },
		minWidth: 220,
		minHeight: 80,
		render: (config) => (
			<Panel>
				<strong>{value(config, "label", "Countdown")}</strong>
				<span>{value(config, "target", "2026-12-31")}</span>
			</Panel>
		),
	},
	{
		name: "date",
		label: "Date Display",
		description: "Current date display",
		category: "Time & Date",
		defaultConfig: { date: "2026-07-07" },
		minWidth: 180,
		minHeight: 70,
		render: (config, context) => <Panel>{liveDate(config, context.now)}</Panel>,
	},
	{
		name: "daysuntil",
		label: "Days Until",
		description: "Days until date",
		category: "Time & Date",
		defaultConfig: { label: "Launch", days: 42 },
		minWidth: 220,
		minHeight: 80,
		render: (config) => (
			<Panel>
				<strong>{value(config, "days", "0")} days</strong>
				<span>{value(config, "label", "Event")}</span>
			</Panel>
		),
	},
];
