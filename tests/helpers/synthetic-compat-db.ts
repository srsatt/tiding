import { Database } from "bun:sqlite";
import { bootstrapObservedSchema } from "../../src/db/schema";

const UPDATED_AT = "2026-01-01T00:00:00.000Z";

export function createSyntheticCompatibilityDatabase(path: string) {
	const db = new Database(path);

	try {
		bootstrapObservedSchema(db);
		db.transaction(() => {
			db.query(
				"INSERT INTO screen_designs (id, name, description, width, height, background, is_template, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				1,
				"Sample Design",
				"Synthetic compatibility screen",
				800,
				480,
				"#ffffff",
				false,
				UPDATED_AT,
			);
			db.query(
				"INSERT INTO screen_designs (id, name, description, width, height, background, is_template, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				2,
				"Weather Design",
				"Synthetic context-aware screen",
				800,
				480,
				"#ffffff",
				false,
				UPDATED_AT,
			);

			for (const source of [
				{
					id: 1,
					name: "Sample posts",
					url: "https://example.com/posts.json",
					lastData: JSON.stringify({ posts: [{ title: "Hello e-ink" }] }),
				},
				{
					id: 3,
					name: "Sample news",
					url: "https://example.com/news.json",
					lastData: JSON.stringify([
						{ title: "A small server sends a crisp update", section: "Lab" },
					]),
				},
				{
					id: 5,
					name: "weather",
					url: "https://api.open-meteo.com/v1/forecast?latitude={ctx.lat}&longitude={ctx.lon}&current=temperature_2m,wind_speed_10m",
					lastData: JSON.stringify({
						current: { temperature_2m: 18, wind_speed_10m: 7 },
						current_units: { temperature_2m: "C", wind_speed_10m: "km/h" },
					}),
				},
			]) {
				db.query(
					"INSERT INTO data_sources (id, name, description, type, url, method, refresh_interval, is_active, last_data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				).run(
					source.id,
					source.name,
					"Synthetic test data",
					"json",
					source.url,
					"GET",
					300,
					true,
					source.lastData,
					UPDATED_AT,
				);
			}

			for (const widget of [
				{
					id: 2,
					name: "News Today",
					dataSourceId: 3,
					template:
						'const item = Array.isArray($) ? $[0] : $; return <div><strong>News today</strong><div>Latest</div><div>Section</div><span>{item?.title || "No headline"}</span></div>',
				},
				{
					id: 4,
					name: "ctx",
					dataSourceId: 1,
					template: "return <div>{ctx.id}</div>",
				},
				{
					id: 5,
					name: "Weather Widget",
					dataSourceId: 5,
					template:
						'return <div>weather in {ctx.city}: {$.current?.temperature_2m} {$.current_units?.temperature_2m || "C"}</div>',
				},
			]) {
				db.query(
					"INSERT INTO custom_widgets (id, name, description, data_source_id, displayType, template, config, min_width, min_height, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				).run(
					widget.id,
					widget.name,
					"Synthetic Framework widget",
					widget.dataSourceId,
					"framework",
					widget.template,
					'{"templateMode":"jsx","fontSize":16}',
					150,
					80,
					UPDATED_AT,
				);
			}

			db.query(
				"INSERT INTO screen_widgets (id, screen_design_id, template_id, x, y, width, height, rotation, config, z_index, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				65,
				1,
				15,
				0,
				100,
				400,
				320,
				0,
				'{"customWidgetId":2,"displayType":"framework","templateMode":"jsx"}',
				1,
				UPDATED_AT,
			);
			db.query(
				"INSERT INTO screen_widgets (id, screen_design_id, template_id, x, y, width, height, rotation, config, z_index, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				69,
				2,
				15,
				0,
				0,
				400,
				240,
				0,
				'{"customWidgetId":5,"displayType":"framework","templateMode":"jsx"}',
				1,
				UPDATED_AT,
			);
			db.query(
				"INSERT INTO screen_widgets (id, screen_design_id, template_id, x, y, width, height, rotation, config, z_index, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				66,
				1,
				1,
				0,
				0,
				240,
				80,
				0,
				'{"timezone":"Europe/Berlin","format":"24h","showSeconds":false,"showDate":true}',
				2,
				UPDATED_AT,
			);

			db.query(
				"INSERT INTO playlists (id, name, description, is_active, updated_at) VALUES (?, ?, ?, ?, ?)",
			).run(1, "Sample playlist", "Synthetic playlist", true, UPDATED_AT);
			db.query(
				'INSERT INTO playlist_items (id, playlist_id, screen_design_id, kind, "order", duration) VALUES (?, ?, ?, ?, ?, ?)',
			).run(2, 1, 1, "screen", 0, 60);

			db.query(
				"INSERT INTO devices (id, label, friendly_id, mac_address, api_key, firmware_version, playlist_id, is_active, wifi, battery, refresh_rate, image_timeout, width, height, firmware_update, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				3,
				"Sample TRMNL",
				"sample-device",
				"AA:BB:CC:DD:EE:03",
				"synthetic-api-key",
				"1.0.0",
				1,
				true,
				-54,
				34,
				60,
				22,
				800,
				480,
				false,
				UPDATED_AT,
			);

			db.query(
				"INSERT INTO firmware (id, version, download_url, release_notes, is_stable, created_at) VALUES (?, ?, ?, ?, ?, ?)",
			).run(
				1,
				"1.0.0",
				"https://example.com/firmware/v1.0.0.bin",
				"Initial stable release",
				false,
				"2026-05-12T11:03:41.814Z",
			);
		})();
	} finally {
		db.close();
	}

	return path;
}
