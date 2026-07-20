import { t } from "ttag";
import type { Device } from "../../../db/repositories/device.repository";
import { TextField } from "../../design-system/native-controls";
import { Button, DeleteButton, FormActions } from "../../ui";

export function DeviceEditControls({ device }: { device: Device }) {
	return (
		<section className={"panel"}>
			<h2>{t`Edit Device`}</h2>
			<form
				action={`/api/devices/${device.id}`}
				method="POST"
				className={"formGrid"}
			>
				<input type="hidden" name="_method" value="PATCH" />
				<TextField
					label={t`Device Name`}
					name="label"
					value={device.label}
					required
				/>
				<TextField label={t`MAC Address`} value={device.mac_address} disabled />
				<FormActions>
					<Button type="submit">{t`Save Device`}</Button>
					<DeleteButton action={`/api/devices/${device.id}`} />
				</FormActions>
			</form>
		</section>
	);
}
