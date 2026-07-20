# Architecture

`tiding` is a Bun-native web application for managing and rendering TRMNL e-ink
screens. It replaces the prior Inker-style backend while preserving database and
device compatibility.

## Goals

- Apache-2.0-compatible implementation.
- Bun-native server with as few dependencies as practical.
- SQLite persistence with backward-compatible access to the current database.
- Takumi-only screen rendering.
- Lightweight frontend using prerendered pages plus Preact islands, with Ark UI
  primitives and Park UI design-system components where appropriate.
- MCP support for agent-driven screen/widget/data-source management.
- Raspberry Pi friendly runtime and packaging.

## High-Level Shape

```text
src/
  app.ts                  # Bun server bootstrap
  config/                 # env and runtime config
  http/                   # router, request parsing, response helpers
  db/                     # SQLite connection, repositories, schema checks
  domain/                 # screen, widget, data source, render models
  services/               # application workflows
  rendering/takumi/       # dirty-room renderer boundary
  frontend/               # prerender templates and islands
  mcp/                    # dirty-room MCP boundary
  device/                 # TRMNL-compatible device endpoints
tests/
  unit/
  integration/
  fixtures/
docs/
  provenance/
  decisions.md
```

## Runtime Principles

- One Bun process serves API, frontend, device endpoints, and MCP when enabled.
- SQLite uses Bun's native SQLite support if available and stable; otherwise use
  the smallest compatible SQLite package after license check.
- Rendering is synchronous or queued in-process initially; add a queue only if
  tests show render latency blocks device endpoints.
- Device screen images are rendered through Takumi only.
- No Prisma, no libSQL, no browser renderer fallback, and no template renderer
  besides Takumi unless explicitly added later.

## HTTP Surface

Implement a tiny local router instead of pulling a framework by default. The
router must support:

- Method/path matching.
- JSON request and response helpers.
- Form handling for prerendered frontend actions if needed.
- Static asset serving with immutable cache headers.
- Centralized error handling.

## Data Model

Core concepts:

- Screen design: named canvas or layout target.
- Screen widget: positioned widget instance on a design.
- Widget template: reusable widget definition.
- Custom widget: user-authored renderable widget.
- Data source: configured external data fetch source with cached data and error
  state.
- Render artifact: generated screen image and metadata.

Use repository functions that map directly to current DB tables. Avoid hiding
compatibility decisions behind a large ORM.

Framework widgets are the first-class widget implementation model. The
predefined widget templates exposed in the admin palette must be generated from
the Framework widget registry so metadata, defaults, sizing, and renderer JSX
cannot drift into a second styling system. User-authored custom JS widgets are
also represented by an explicit Framework template, with legacy `customWidgetId`
configs supported only as compatibility input.

## Frontend Rendering

Pages should be mostly prerendered HTML. Use Preact islands only where user
interaction needs client-side state, such as:

- Ark/Park-powered controls such as collapsibles, menus, selects, tabs,
  dialogs, tooltips, toggles, and designer toolbars.
- Widget editor controls.
- Data source test/fetch actions.
- Screen preview refresh.

Ark UI is the required primitive library for interactive controls, not just
collapsibles. Park UI should be used or explicitly rejected after review as the
design-system layer. The frontend should be layered into shared design-system
components, feature modules, thin route composition, focused islands, and shared
helpers. Keep styling readable on desktop and tablet, suitable for repeated
admin use, and strong enough that the screen designer and operational pages do
not feel like temporary scaffolding. Theme state must be server-visible or
bootstrapped before paint so navigation never flashes the default theme.

## Configuration

Minimum environment variables:

- `TIDING_HOST`, default `0.0.0.0`
- `TIDING_PORT`, default `43337`
- `TIDING_DB_PATH`, default `data/inker.db`
- `TIDING_DATA_DIR`, default `data`
- `TIDING_ENABLE_MCP`, default `false`
- `TIDING_RENDER_CACHE_DIR`, default `data/render-cache`
- `TIDING_TIME_ZONE`, default `Europe/Berlin`

Do not rename the old database file by default. The app should open it in place
after backing up only when a migration is required.
