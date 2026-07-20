/** @jsxImportSource react */
import { Dialog } from "@ark-ui/react/dialog";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { t } from "ttag";

function ArkDialogIsland({
	title,
	trigger,
	contentElement,
	variant,
}: {
	title: string;
	trigger: string;
	contentElement: HTMLElement;
	variant: string;
}) {
	const contentRef = React.useRef<HTMLDivElement | null>(null);
	React.useLayoutEffect(() => {
		contentElement.hidden = false;
		contentRef.current?.replaceChildren(contentElement);
	}, [contentElement]);
	return (
		<Dialog.Root>
			<Dialog.Trigger className={`button ${variant}`.trim()} type="button">
				{trigger}
			</Dialog.Trigger>
			<Dialog.Backdrop className="dialogBackdrop" />
			<Dialog.Positioner className="dialogPositioner">
				<Dialog.Content className="dialogContent">
					<div className="dialogHeader">
						<Dialog.Title>{title}</Dialog.Title>
						<Dialog.CloseTrigger
							className="button secondary small"
							type="button"
						>
							{t`Close`}
						</Dialog.CloseTrigger>
					</div>
					<div className="dialogBody" ref={contentRef} />
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}

export function hydrateArkDialogs() {
	document
		.querySelectorAll<HTMLElement>('[data-island="ark-dialog"]')
		.forEach((root) => {
			if (root.dataset.hydrated === "true") return;
			root.dataset.hydrated = "true";
			const props = JSON.parse(root.getAttribute("data-props") || "{}") as {
				title?: string;
				trigger?: string;
				variant?: string;
			};
			const contentElement =
				root.querySelector<HTMLElement>("[data-dialog-content]") ||
				document.createElement("div");
			flushSync(() =>
				createRoot(root).render(
					<ArkDialogIsland
						title={props.title || t`Dialog`}
						trigger={props.trigger || t`Open`}
						variant={props.variant || ""}
						contentElement={contentElement}
					/>,
				),
			);
		});
}
