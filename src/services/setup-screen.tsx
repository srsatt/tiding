import renderToString from "preact-render-to-string";
import { t } from "ttag";
import { encodeRawTo1BitBmp } from "../rendering/bmp/mono-bmp";
import { takumiRenderer } from "../rendering/takumi/renderer";

const SETUP_WIDTH = 800;
const SETUP_HEIGHT = 480;

let cachedSetupScreen: Promise<Buffer> | null = null;

function setupScreenHtml() {
	return renderToString(
		<html lang="en" style={{ background: "#ffffff" }}>
			<body
				style={{
					margin: "0",
					width: `${SETUP_WIDTH}px`,
					height: `${SETUP_HEIGHT}px`,
					background: "#ffffff",
					color: "#000000",
					fontFamily: "Arial, sans-serif",
				}}
			>
				<div
					style={{
						boxSizing: "border-box",
						width: "100%",
						height: "100%",
						padding: "44px",
						border: "10px solid #000000",
					}}
				>
					<div
						style={{
							fontSize: "48px",
							fontWeight: "700",
							lineHeight: "1.1",
						}}
					>
						{t`Tiding setup`}
					</div>
					<div
						style={{
							marginTop: "28px",
							fontSize: "28px",
							lineHeight: "1.35",
						}}
					>
						{t`Open the admin UI and add this device.`}
					</div>
					<div
						style={{
							marginTop: "24px",
							fontSize: "24px",
							lineHeight: "1.35",
						}}
					>
						{t`The device is connected, but it is not assigned to an active screen yet.`}
					</div>
					<div
						style={{
							position: "absolute",
							left: "44px",
							bottom: "44px",
							fontSize: "22px",
						}}
					>
						{SETUP_WIDTH} x {SETUP_HEIGHT} {t`1-bit BMP`}
					</div>
				</div>
			</body>
		</html>,
	);
}

async function renderSetupScreen() {
	const raw = await takumiRenderer.renderHtmlToRaw(setupScreenHtml(), {
		width: SETUP_WIDTH,
		height: SETUP_HEIGHT,
	});
	return encodeRawTo1BitBmp(raw, {
		width: SETUP_WIDTH,
		height: SETUP_HEIGHT,
		topDown: false,
	});
}

export async function renderSetupScreenBmp() {
	cachedSetupScreen ??= renderSetupScreen();
	return cachedSetupScreen;
}
