# Tiding

Tiding is an experimental, self-hosted [TRMNL BYOS (Build Your Own Server)](https://docs.trmnl.com/go/diy/byos) implementation designed for small, low-power computers.

The project has three main goals:

- run comfortably on devices such as a Raspberry Pi, targeting roughly 200 MB RSS;
- ship as a single primary server executable with a small runtime asset bundle;
- make e-ink screen creation approachable through TRMNL Framework-compatible primitives and an MCP server for AI-assisted widget generation.

The name is a small piece of the project itself. A *tiding* is news, and a tiding is also a name for a flock of magpies: clever black-and-white birds that make a fitting mascot for a black-and-white TRMNL display. I also simply like birds.

> [!WARNING]
> Tiding is still experimental. Expect rough edges, incomplete compatibility, and changes to configuration or storage. Back up your database before trying it with an existing installation. Feedback and bug reports are very welcome.

## What it provides

- TRMNL-compatible setup, display, log, and firmware endpoints.
- A server-rendered admin interface for devices, screens, playlists, data sources, custom widgets, and settings.
- A visual screen designer with reusable widget primitives.
- Takumi-based rendering to firmware-compatible 1-bit BMP images.
- Support for [TRMNL Framework](https://trmnl.com/framework) concepts, CSS, typography, layouts, and e-ink-ready primitives.
- JSON and feed data sources with caching, refresh scheduling, context fields, and redacted secrets.
- An MCP endpoint that lets AI tools inspect screens and create or update data sources, widgets, playlists, and device assignments.
- SQLite storage, Bun-native HTTP serving, and Raspberry Pi ARM64 packaging.

Tiding is an independent community project. It is not an official TRMNL product.

## Requirements

- [Bun](https://bun.sh/) for development and source-based operation.
- A Linux ARM64 system for the packaged Raspberry Pi build, or any Bun-supported system for development.
- A TRMNL device or compatible client if you want to exercise the physical-device API.

## Quick start

Install dependencies and start Tiding with a new database:

```bash
bun install
TIDING_BOOTSTRAP_DB=1 TIDING_ADMIN_PIN=change-me bun run start
```

Open `http://localhost:43337`, sign in with the PIN, create a screen or playlist, and register a device. The bootstrap flag is required only when creating a new database; later starts can omit it.

For development with automatic restarts:

```bash
TIDING_BOOTSTRAP_DB=1 bun run dev
```

Do not expose an unprotected instance to an untrusted network. Set `TIDING_ADMIN_PIN` for the admin UI and `TIDING_MCP_TOKEN` for remote MCP access.

## Connect a TRMNL device

Point the device's BYOS base URL at the machine running Tiding, for example:

```text
http://192.0.2.10:43337
```

Tiding implements the core BYOS device routes:

```text
GET/POST /api/setup
GET      /api/display
POST     /api/log
GET      /api/firmware
```

The public device routes remain available when admin PIN protection is enabled. Admin and non-device API routes require an authenticated admin session.

You can validate the device-facing contract without a physical display:

```bash
bun run verify:device-http -- \
  --base-url http://127.0.0.1:43337 \
  --http-id AA:BB:CC:DD:EE:FF
```

The verifier exercises setup and display requests, downloads the returned images, validates their 1-bit BMP headers and dimensions, and writes an `evidence.json` report.

## AI-assisted widgets through MCP

The HTTP MCP endpoint is available at `/mcp`. Protect it with a dedicated bearer token:

```bash
TIDING_BOOTSTRAP_DB=1 \
TIDING_ADMIN_PIN=change-me \
TIDING_MCP_TOKEN=change-this-token \
bun run start
```

For an MCP client that accepts Codex-style TOML configuration:

```toml
[mcp_servers.tiding]
url = "http://127.0.0.1:43337/mcp"
bearer_token_env_var = "TIDING_MCP_TOKEN"
```

The MCP tools cover screen designs, widgets, data sources, custom widgets, playlists, devices, and render previews. They reuse the same validation and services as the HTTP application, so an AI-generated widget follows the same path as one created in the admin interface.

A standalone stdio server is also available:

```bash
bun run mcp
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `43337` | HTTP port. |
| `DB_PATH` | `data/tiding.db` | SQLite database path. |
| `CACHE_PATH` | `data/cache` | Rendered BMP cache directory. |
| `TIDING_BOOTSTRAP_DB` | unset | Set to `1` once to initialize an empty database. |
| `TIDING_ADMIN_PIN` | unset | Protects the admin UI and non-device APIs. |
| `TIDING_MCP_TOKEN` | admin PIN | Bearer token accepted by the HTTP MCP endpoint. |
| `TIDING_TIME_ZONE` | `Europe/Berlin` | Time zone used by server-rendered dates and time widgets. |
| `TIDING_FETCH_TIMEOUT_MS` | persisted setting | Overrides the data-source fetch timeout. |
| `TIDING_HTTP_IDLE_TIMEOUT_SECONDS` | `10` | Bun HTTP idle timeout. |

Existing compatible databases are opened in place. Tiding fails closed when the schema is unsupported and only performs explicitly requested, backup-first additive migrations.

## Build and package

Build the frontend and Bun server bundle:

```bash
bun run build
```

Compile the server for the current platform:

```bash
bun run compile:server
```

Create the Linux ARM64 Raspberry Pi release under `dist/rpi-release`:

```bash
bun run package:rpi
```

The ARM64 release includes the server executable, MCP executable, frontend assets, fonts, schema input, and the Takumi native binding required on the target system.

## Development

Run the project checks before submitting a change:

```bash
bun run typecheck
bun run lint
bun test
bun run build
```

The implementation is licensed under Apache-2.0. Compatibility work is developed under a documented clean-room boundary; see `docs/provenance/` and `docs/compat/schema-observations/` for the project records.

## Feedback

Tiding is an experiment that has reached the useful-but-you-can-still-find-sharp-edges stage. If you try it on another small computer, connect a different TRMNL-compatible device, build a widget through MCP, or find a place where the Framework output is wrong, please open an issue with enough detail to reproduce it.

## Support

If Tiding is useful to you and you would like to show your appreciation, you can [buy me a coffee](https://buymeacoffee.com/srsatt).

## License

[Apache License 2.0](LICENSE)
