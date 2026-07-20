/** @jsxImportSource react */
import { Accordion } from "@ark-ui/react/accordion";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { t } from "ttag";
import { hydrateArkDialogs } from "../ark-dialog-island";
import { hydrateArkTabs } from "../ark-tabs-island";

function ArkCollapsibleIsland({
	title,
	value,
	defaultOpen,
	contentElement,
}: {
	title: string;
	value: string;
	defaultOpen: boolean;
	contentElement: HTMLElement;
}) {
	const contentRef = React.useRef<HTMLDivElement | null>(null);

	React.useLayoutEffect(() => {
		contentRef.current?.replaceChildren(contentElement);
	}, [contentElement]);

	return (
		<Accordion.Root
			collapsible
			defaultValue={defaultOpen ? [value] : []}
			className="arkCollapsible"
		>
			<Accordion.Item value={value} className="arkCollapsibleItem">
				<Accordion.ItemTrigger className="arkCollapsibleTrigger">
					<span>{title}</span>
					<Accordion.ItemIndicator className="arkCollapsibleIndicator">
						+
					</Accordion.ItemIndicator>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent
					className="arkCollapsibleContent"
					ref={contentRef}
				/>
			</Accordion.Item>
		</Accordion.Root>
	);
}

function hydrateArkCollapsibles() {
	document
		.querySelectorAll<HTMLElement>('[data-island="ark-collapsible"]')
		.forEach((root) => {
			if (root.dataset.hydrated === "true") return;
			root.dataset.hydrated = "true";
			const props = JSON.parse(root.getAttribute("data-props") || "{}") as {
				title?: string;
				value?: string;
				defaultOpen?: boolean;
			};
			const value = props.value || root.id || "section";
			const title = props.title || t`Section`;
			const contentElement =
				root.querySelector<HTMLElement>("[data-collapsible-content]") ||
				document.createElement("div");

			flushSync(() =>
				createRoot(root).render(
					<ArkCollapsibleIsland
						title={title}
						value={value}
						defaultOpen={Boolean(props.defaultOpen)}
						contentElement={contentElement}
					/>,
				),
			);
		});
}

export function hydrateArkPage() {
	hydrateArkCollapsibles();
	hydrateArkDialogs();
	hydrateArkTabs();
}
