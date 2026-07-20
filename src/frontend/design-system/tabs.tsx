import type { ComponentChildren } from "preact";

export type TabItem = {
	value: string;
	label: string;
	children: ComponentChildren;
};

export function TabsShell({
	defaultValue,
	items,
}: {
	defaultValue: string;
	items: TabItem[];
}) {
	return (
		<section
			className="parkTabs"
			data-island="ark-tabs"
			data-props={JSON.stringify({ defaultValue })}
		>
			<nav className="parkTabsList" data-scope="tabs" data-part="list">
				{items.map((item) => (
					<a
						key={item.value}
						href={`#tab-${item.value}`}
						className="parkTabTrigger"
						data-part="trigger"
						data-tab-label={item.label}
						data-tab-value={item.value}
						data-selected={item.value === defaultValue ? "" : undefined}
					>
						{item.label}
					</a>
				))}
			</nav>
			{items.map((item) => (
				<div
					key={item.value}
					id={`tab-${item.value}`}
					className="parkTabsContent"
					data-part="content"
					data-tab-content
					data-tab-label={item.label}
					data-tab-value={item.value}
					hidden={item.value !== defaultValue}
				>
					{item.children}
				</div>
			))}
		</section>
	);
}
