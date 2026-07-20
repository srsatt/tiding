import { create } from "qrcode";

export function QrCodeSvg({
	value,
	label = "QR code",
	quietZone = 2,
}: {
	value: string;
	label?: string;
	quietZone?: number;
}) {
	const qr = create(value || " ", { errorCorrectionLevel: "M" });
	const matrixSize = qr.modules.size;
	const viewSize = matrixSize + quietZone * 2;
	const cells = [];

	for (let row = 0; row < matrixSize; row += 1) {
		for (let col = 0; col < matrixSize; col += 1) {
			if (!qr.modules.get(row, col)) continue;
			cells.push(
				<rect
					key={`${row}-${col}`}
					x={col + quietZone}
					y={row + quietZone}
					width="1"
					height="1"
				/>,
			);
		}
	}

	return (
		<svg
			role="img"
			aria-label={label}
			data-qr-code
			viewBox={`0 0 ${viewSize} ${viewSize}`}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>{label}</title>
			<rect width={viewSize} height={viewSize} fill="#fff" />
			<g fill="#000">{cells}</g>
		</svg>
	);
}
