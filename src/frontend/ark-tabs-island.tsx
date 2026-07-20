/** @jsxImportSource react */
import { Tabs } from "@ark-ui/react/tabs";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

type TabIslandItem = {
	value: string;
	label: string;
	contentElement: HTMLElement;
};

function TabContentSlot({ item }: { item: TabIslandItem }) {
	const contentRef = React.useRef<HTMLDivElement | null>(null);

	React.useLayoutEffect(() => {
		contentRef.current?.replaceChildren(item.contentElement);
	}, [item.contentElement]);

	return (
		<Tabs.Content className="parkTabsContent" value={item.value}>
			<div ref={contentRef} />
		</Tabs.Content>
	);
}

function ArkTabsIsland({
	defaultValue,
	items,
}: {
	defaultValue: string;
	items: TabIslandItem[];
}) {
	return (
		<Tabs.Root defaultValue={defaultValue} className="parkTabs">
			<Tabs.List className="parkTabsList">
				{items.map((item) => (
					<Tabs.Trigger
						key={item.value}
						className="parkTabTrigger"
						value={item.value}
					>
						{item.label}
					</Tabs.Trigger>
				))}
			</Tabs.List>
			{items.map((item) => (
				<TabContentSlot key={item.value} item={item} />
			))}
		</Tabs.Root>
	);
}

export function hydrateArkTabs() {
	document
		.querySelectorAll<HTMLElement>('[data-island="ark-tabs"]')
		.forEach((root) => {
			if (root.dataset.hydrated === "true") return;
			root.dataset.hydrated = "true";
			const props = JSON.parse(root.getAttribute("data-props") || "{}") as {
				defaultValue?: string;
			};
			const items = Array.from(
				root.querySelectorAll<HTMLElement>("[data-tab-content]"),
			).map((contentElement) => ({
				value: contentElement.dataset.tabValue || contentElement.id,
				label: contentElement.dataset.tabLabel || contentElement.id,
				contentElement,
			}));
			for (const item of items) item.contentElement.hidden = false;
			const defaultValue = props.defaultValue || items[0]?.value || "tab";
			flushSync(() =>
				createRoot(root).render(
					<ArkTabsIsland defaultValue={defaultValue} items={items} />,
				),
			);
		});
}
