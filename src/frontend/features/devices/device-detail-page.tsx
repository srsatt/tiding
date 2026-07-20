import { t } from "ttag";
import type {
	Device,
	DeviceLog,
	DeviceScreenAssignment,
	FirmwareArtifact,
} from "../../../db/repositories/device.repository";
import type { Playlist } from "../../../db/repositories/playlist.repository";
import type { DeviceScreenSelection } from "../../../services/device-screen-selection";
import { enabledLabel, formatTimestamp } from "../../format";
import { ButtonLink, EmptyRow } from "../../ui";
import { DeviceCurrentScreen } from "./device-current-screen";
import { DeviceEditControls } from "./device-edit-controls";
import { DeviceFacts } from "./device-facts";
import { DeviceFirmwarePanel } from "./device-firmware";
import { DevicePlaylistAssignment } from "./device-playlist-assignment";

export function DeviceDetailPage({
	assignments,
	currentScreen,
	device,
	latestFirmware,
	logs,
	playlists,
}: {
	assignments: DeviceScreenAssignment[];
	currentScreen: DeviceScreenSelection;
	device: Device;
	latestFirmware: FirmwareArtifact | null;
	logs: DeviceLog[];
	playlists: Playlist[];
}) {
	return (
		<>
			<header className={"pageHeader"}>
				<div>
					<h1>{device.label}</h1>
					<p>{t`Read-only device state used by setup, display, and log endpoints.`}</p>
				</div>
				<ButtonLink href="/devices" variant="secondary">
					{t`Back`}
				</ButtonLink>
			</header>
			<section className={"panel"}>
				<h2>{t`Device State`}</h2>
				<DeviceFacts device={device} />
			</section>
			<DeviceEditControls device={device} />
			<DeviceFirmwarePanel device={device} latestFirmware={latestFirmware} />
			<DeviceCurrentScreen deviceId={device.id} selection={currentScreen} />
			<section className={"panel"}>
				<h2>{t`Playlist Assignment`}</h2>
				<DevicePlaylistAssignment device={device} playlists={playlists} />
			</section>
			<DeviceAssignmentsTable assignments={assignments} />
			<DeviceLogsTable logs={logs} />
		</>
	);
}

function DeviceAssignmentsTable({
	assignments,
}: {
	assignments: DeviceScreenAssignment[];
}) {
	return (
		<section className={"panel"}>
			<h2>{t`Screen Assignments`}</h2>
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>{t`Screen`}</th>
						<th>{t`Active`}</th>
						<th>{t`Created`}</th>
					</tr>
				</thead>
				<tbody>
					{assignments.length === 0 ? (
						<EmptyRow colSpan={4}>{t`No screen assignments.`}</EmptyRow>
					) : (
						assignments.map((assignment) => (
							<tr key={assignment.id}>
								<td>{assignment.id}</td>
								<td>
									<a href={`/screens/${assignment.screen_design_id}`}>
										{assignment.screen_design_id}
									</a>
								</td>
								<td>{enabledLabel(assignment.is_active)}</td>
								<td>{formatTimestamp(assignment.created_at)}</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</section>
	);
}

function DeviceLogsTable({ logs }: { logs: DeviceLog[] }) {
	return (
		<section className={"panel"}>
			<h2>{t`Recent Logs`}</h2>
			<table>
				<thead>
					<tr>
						<th>{t`Created`}</th>
						<th>{t`Level`}</th>
						<th>{t`Message`}</th>
						<th>{t`Metadata`}</th>
					</tr>
				</thead>
				<tbody>
					{logs.length === 0 ? (
						<EmptyRow colSpan={4}>{t`No device logs.`}</EmptyRow>
					) : (
						logs.map((log) => (
							<tr key={log.id}>
								<td>{formatTimestamp(log.created_at)}</td>
								<td>{log.level}</td>
								<td>{log.message}</td>
								<td>
									<code>{log.metadata || ""}</code>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</section>
	);
}
