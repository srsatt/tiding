import type { DatabaseService } from "../db";
import {
	WELCOME_DEFAULTS,
	WELCOME_TEMPLATES,
	welcomeSettingsFromRows,
} from "./welcome-settings";

export async function resetWelcomeSettings(db: DatabaseService) {
	const entries = {
		welcome_auto_create_screen: WELCOME_DEFAULTS.autoCreateScreen,
		welcome_auto_assign_playlist: WELCOME_DEFAULTS.autoAssignPlaylist,
		welcome_title: WELCOME_DEFAULTS.title,
		welcome_subtitle: WELCOME_DEFAULTS.subtitle,
		welcome_template: WELCOME_DEFAULTS.template,
	};
	for (const [key, value] of Object.entries(entries)) {
		await db.settings.set(key, value);
	}
}

async function textTemplateId(db: DatabaseService) {
	const template = (await db.templates.findAll()).find(
		(candidate) => candidate.name === "text",
	);
	if (!template) throw new Error("Welcome screen requires the text widget");
	return template.id;
}

function isActive(value: unknown) {
	return value === true || value === 1 || value === "1";
}

async function assignWelcomePlaylistToUnassignedDevices(
	db: DatabaseService,
	playlistId: number,
) {
	const assignedDeviceIds: number[] = [];
	for (const device of await db.devices.findAll()) {
		if (!isActive(device.is_active) || device.playlist_id) continue;
		await db.devices.updatePlaylist(device.id, playlistId);
		assignedDeviceIds.push(device.id);
	}
	return assignedDeviceIds;
}

export async function regenerateWelcomeScreen(db: DatabaseService) {
	const settings = welcomeSettingsFromRows(await db.settings.findAll());
	const template = WELCOME_TEMPLATES[settings.template];
	if (settings.autoCreateScreen !== "true") return null;

	const existingScreenId = Number(await db.settings.get("welcome_screen_id"));
	const existingScreen = Number.isInteger(existingScreenId)
		? await db.screens.findById(existingScreenId)
		: null;
	const screenId =
		existingScreen?.id ??
		(await db.screens.create("Welcome Screen", "Generated welcome screen", {
			width: template.width,
			height: template.height,
		}));
	await db.screens.update(
		screenId,
		"Welcome Screen",
		"Generated welcome screen",
		"#FFFFFF",
		template.width,
		template.height,
	);

	for (const widget of await db.widgets.findByScreenDesign(screenId)) {
		await db.widgets.delete(widget.id);
	}
	const titleHeight = Math.round(template.height * 0.28);
	const textTemplate = await textTemplateId(db);
	await db.widgets.create({
		screen_design_id: screenId,
		template_id: textTemplate,
		x: 60,
		y: Math.round(template.height * 0.24),
		width: template.width - 120,
		height: titleHeight,
		config: JSON.stringify({ text: settings.title, fontSize: 34 }),
		z_index: 0,
	});
	await db.widgets.create({
		screen_design_id: screenId,
		template_id: textTemplate,
		x: 80,
		y: Math.round(template.height * 0.52),
		width: template.width - 160,
		height: Math.round(template.height * 0.2),
		config: JSON.stringify({ text: settings.subtitle, fontSize: 18 }),
		z_index: 1,
	});

	const existingPlaylistId = Number(
		await db.settings.get("welcome_playlist_id"),
	);
	const existingPlaylist = Number.isInteger(existingPlaylistId)
		? await db.playlists.findById(existingPlaylistId)
		: null;
	const playlistId =
		existingPlaylist?.id ??
		(await db.playlists.create({
			name: "Welcome Playlist",
			description: "Generated playlist for newly registered devices",
			is_active: true,
		}));
	for (const item of await db.playlists.findItems(playlistId)) {
		await db.playlists.deleteItem(item.id);
	}
	await db.playlists.addItem({
		playlist_id: playlistId,
		screen_design_id: screenId,
		order: 0,
		duration: 900,
	});

	await db.settings.set("welcome_screen_id", String(screenId));
	await db.settings.set("welcome_playlist_id", String(playlistId));
	const assignedDeviceIds =
		settings.autoAssignPlaylist === "true"
			? await assignWelcomePlaylistToUnassignedDevices(db, playlistId)
			: [];
	return { screenId, playlistId, assignedDeviceIds };
}

export async function applyWelcomePlaylistToDevice(
	db: DatabaseService,
	deviceId: number,
) {
	const autoAssign = await db.settings.get("welcome_auto_assign_playlist");
	if ((autoAssign ?? WELCOME_DEFAULTS.autoAssignPlaylist) !== "true") return;
	const generated = await regenerateWelcomeScreen(db);
	if (generated)
		await db.devices.updatePlaylist(deviceId, generated.playlistId);
}
