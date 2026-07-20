# Product Stories

This document is the product-level source of truth for Tiding. Completion is not
measured by API coverage alone: every story below must be reproducible from the
admin UI, API/device surface, tests, or MCP tools, with evidence recorded in
`docs/completion-report.md`.

## Source Notes

- User-provided stories from the July 7, 2026 planning turn are authoritative:
  custom widgets from scratch, framework-layout widgets, context-aware
  data/widget flows, drag-and-drop screen configuration, predefined widgets, and
  playlists.
- Authenticated black-box inspection of `http://localhost:3337` was performed
  on July 7, 2026 through the PIN login. The inspected reference routes were
  `/dashboard`, `/screens`, `/screens/designer`, `/screens/designer/1`,
  `/devices`, `/devices/new`, `/devices/3`, `/playlists`, `/playlists/new`,
  `/playlists/1`, `/playlists/1/edit`, `/plugins`, `/extensions`,
  `/data-sources/new`, `/data-sources/5/edit`, `/custom-widgets/new`, and
  `/settings`.
- Factual compatibility inventory came from the copied SQLite fixture, not GPL
  source. It showed predefined templates, custom widgets, data sources,
  screen-widget placements, devices, and playlist items.
- Product-level black-box observations may define workflows and UX quality.
  They must not be used to copy source code, templates, CSS, exact layout, or
  implementation details.

## Reference Inventory

The authenticated designer exposes these predefined widget templates as
draggable palette items and they must all be usable admin choices:

| Name | Label | Category |
| --- | --- | --- |
| `github` | GitHub Stars | Content |
| `image` | Static Image | Content |
| `qrcode` | QR Code | Content |
| `text` | Text Block | Content |
| `divider` | Divider Line | Layout |
| `rectangle` | Rectangle | Layout |
| `plugin` | Plugin Widget | Plugins |
| `battery` | Battery Status | System |
| `deviceinfo` | Device Info | System |
| `wifi` | WiFi Status | System |
| `clock` | Live Clock | Time & Date |
| `countdown` | Countdown Timer | Time & Date |
| `date` | Date Display | Time & Date |
| `daysuntil` | Days Until | Time & Date |
| `weather` | Weather | Weather |

The designer also exposes custom widgets as draggable palette items. In the
reference fixture these were `test`, `News Today`, `Tasks Today`, `ctx`, and
`weatcher`.

## Story Catalog

### ST-01 Login, Shell, Dashboard, And Navigation

As an operator, I can authenticate with the configured PIN and use a consistent
admin shell to reach every product area.

Observed reference behavior:

- Login page asks for a PIN.
- Authenticated shell has sidebar navigation for Dashboard, Devices, Screens,
  Playlists, Plugins, Extensions, and Settings.
- Dashboard shows online/offline device counts, total screens, total playlists,
  recent devices, recent screens, quick actions, update status, user/admin
  identity, date, and logout.

Definition of done:

- Browser automation logs in to Tiding with a configured test PIN.
- Top-level navigation and dashboard cards/quick actions are present.
- Unauthenticated admin routes/API calls fail clearly.
- Desktop and mobile navigation screenshots show no clipped or overlapping UI.

### ST-02 Screen Inventory, Create, Import, Export, And Delete

As an operator, I can manage screen designs from a visual screen inventory.

Observed reference behavior:

- `/screens` shows thumbnail previews of each design, status, edit affordance,
  delete button, Import, and Design Screen.
- Design Screen opens a resolution picker with TRMNL Standard 800x480, TRMNL
  Portrait 480x800, and custom width/height.
- Import opens a modal that accepts a screen code.
- Designer Copy Code opens an export modal containing a portable screen package
  with screen, widgets, custom widgets, and data sources.

Definition of done:

- Screen list shows rendered thumbnails, status, edit/delete actions, import,
  and create.
- Create supports landscape, portrait, and custom resolution choices.
- Export/import round-trips a screen design including custom widgets and data
  sources, without leaking secrets in logs or UI.
- Delete is confirmed and cannot be triggered accidentally in tests.

### ST-03 Drag-And-Drop Screen Designer

As an operator, I can compose an e-ink screen through a canvas designer rather
than only CRUD forms.

Observed reference behavior:

- `/screens/designer/:id` has a left widget palette, central 800x480 canvas,
  and right properties panel.
- Palette groups include Content, Layout, Plugins, System, Time & Date, Weather,
  and Custom. Palette items are draggable.
- Canvas toolbar includes Grid/Snap, Draw, zoom out/percentage/zoom in,
  resolution, widget count, and ready status.
- Active widget list mirrors widgets on the canvas.
- Selecting a widget exposes position, size, rotation, typography, alignment,
  layer/z-index, opacity, and delete controls.
- Save and Back are top-level actions.

Definition of done:

- Widgets can be dragged from predefined and custom palette sections onto the
  canvas.
- Placed widgets can be selected, moved, resized, rotated, layered, configured,
  deleted, saved, reloaded, and rendered.
- Canvas shows bounds, resolution, widget count, zoom, snap/grid state, selected
  state, active widget list, and save/render status.
- Designer UX is comparable in density and ergonomics to the reference without
  copying its implementation.

### ST-04 Predefined Widget Coverage

As an operator, I can add and configure every predefined widget that appears in
the reference designer.

Definition of done:

- All predefined templates in Reference Inventory are present in the palette.
- Predefined templates are seeded from the first-class Framework widget
  registry, so metadata, default config, sizing, and render styling have one
  source of truth.
- Runtime/designer code resolves placed widgets into a typed Framework widget
  instance first. Compatibility fields such as `template_id` may remain in the
  database/API, but UI and renderer decisions must not branch into a separate
  predefined-widget subsystem.
- Each predefined widget has a usable config UI or clear structured editor.
- Each template can be placed, configured, saved, reloaded, previewed, and
  rendered to a 1-bit BMP.
- Plugin Widget is implemented or shown as an explicit future/unsupported state
  consistent with the Plugins page.

### ST-05 Data Source Management

As an operator, I can create, test, edit, toggle, and delete external data
sources for widgets.

Observed reference behavior:

- Extensions page has Data Sources and Custom Widgets tabs.
- Data Sources tab shows New Data Source, Test All, active toggles, type, status,
  widget usage count, edit, and delete.
- Data source form supports name, description, JSON API or RSS/Atom type, URL,
  Test URL, HTTP method GET/POST, custom headers, refresh interval, context JSON
  schema, and test context.
- Context schema values can be used in URLs as `{ctx.field}`.
- Available fields are discovered from test data and displayed with paths and
  types.

Definition of done:

- UI supports the observed create/edit/test/list/toggle/delete flow.
- GET and POST JSON sources work; RSS/Atom is implemented or explicitly marked
  unsupported in UI and docs.
- Test URL resolves test context placeholders and displays available fields.
- Fetch errors are visible and do not silently replace the last good cache.
- Headers and secrets are redacted in UI, logs, exports, and test output.

### ST-06 Custom Widget Wizard From Data Source

As an operator, I can create a custom widget from scratch by selecting a data
source, choosing a display mode, configuring context, and writing the widget.

Observed reference behavior:

- New Custom Widget is a four-step wizard.
- Step 1 selects a data source and shows live preview, data source info, refresh,
  and available fields.
- Step 2 chooses display type: Single Value, List, JavaScript, Grid, or
  Framework.
- Step 3 defines optional widget context JSON Schema.
- Step 4 configures widget name and display-specific template/source.
- Live Preview and Refresh remain visible through the wizard.

Definition of done:

- Full browser story creates a data source, creates a custom widget from it,
  previews it, saves it, and sees it in the Custom Widgets tab.
- Wizard preserves data source selection, display type, context schema, source,
  and preview state across steps/back navigation.
- Available fields help the operator build the widget without reading raw JSON
  manually.
- Saved widget becomes a draggable item in the designer Custom palette.

### ST-07 Framework Layout Custom Widgets

As an operator, I can build custom widgets with the Framework display type and
JSX-like TRMNL layout source.

Observed reference behavior:

- Framework mode is one of the wizard display types.
- Final step shows a TRMNL Framework Template editor.
- Guidance says JSX templates are rendered by the backend and multi-child divs
  need explicit display semantics.
- Existing framework widgets can render live custom layouts such as News Today
  and Tasks Today.

Definition of done:

- `displayType=framework` and JSX/template mode can be created, edited,
  previewed, persisted, exported, imported, and rendered.
- Framework source receives `$` data and `ctx` context.
- Syntax/runtime errors appear in preview and do not crash the app.
- Tests cover framework widgets created fresh and loaded from the compatibility
  DB fixture.

### ST-08 Context For Data Sources, Widgets, And Placements

As an operator, I can reuse data sources and widgets with per-use context.

Observed reference behavior:

- Data source form has Context JSON Schema and Test Context.
- Data source URLs can include `{ctx.lat}`, `{ctx.lon}`, `{ctx.city}`, and
  similar placeholders.
- Custom widget wizard has a separate Widget Context JSON Schema step.
- Context-aware custom widgets appear in the designer Custom palette.

Definition of done:

- Data source context schema and widget context schema can be edited and
  validated.
- Screen-widget placement exposes context values for context-aware widgets.
- Test fetch uses test context; render uses placement context.
- Browser evidence covers a context-aware data source feeding a context-aware
  widget placed on a screen.

### ST-09 Playlist Creation, Editing, Composer, And Device Assignment

As an operator, I can arrange screens into playlists and assign playlists to
devices.

Observed reference behavior:

- Playlist list shows active state, description, screen count, delete, and
  Create Playlist.
- Playlist detail shows screens in playlist, Add Screens, playlist details, and
  connected devices.
- Playlist create/edit supports name, description, select screen, duration,
  preview, and resolution filtering.
- Playlist editor includes Screen Composer with 2x2, 2x1, and 1x2 layouts, add
  slot, add grid, and current screen previews.
- Playlist detail supports assign device, unassign, view connected device, edit,
  and delete.

Definition of done:

- Browser evidence covers creating a playlist, adding screens with durations,
  using composer/grid flows, editing order/content, and assigning to a device.
- Playlist item duration/order/composition persists and affects `/api/display`.
- Devices without a direct assignment use playlist fallback correctly.
- Resolution mismatch is prevented or clearly explained.

### ST-10 Device Onboarding And Manual Registration

As an operator, I can connect a TRMNL device through Wi-Fi setup or register a
compatible device manually.

Observed reference behavior:

- Add Device page explains TRMNL setup steps: power on, connect to TRMNL Wi-Fi,
  open captive portal, enter Wi-Fi credentials, set API Server URL, and wait for
  registration.
- The page shows a server URL with Copy.
- Alternative Connection supports manual Device Name, MAC Address, and screen
  resolution width/height.
- Next step tells the operator to assign the device to a playlist.

Definition of done:

- UI documents the full Wi-Fi setup flow and shows the effective device server
  URL with copy and QR affordances.
- Manual registration creates a device with name, MAC, and resolution.
- Setup API returns compatible setup data and setup BMP.
- New devices can be assigned to welcome/default playlist behavior when enabled.

### ST-11 Device Inventory, Detail, Telemetry, Logs, And Assignment

As an operator, I can inspect and operate registered devices.

Observed reference behavior:

- Device list has total/online/offline counts, search, all/online/offline
  filters, grid/list view toggle, firmware, battery, friendly ID, playlist, and
  last-seen state.
- Device detail has breadcrumb, status, battery, Wi-Fi signal, device info, MAC,
  friendly ID, last seen, firmware version, created date, screen size, current
  screen preview, current playlist, view playlist, unassign, edit, logs, and
  delete.
- Edit Device lets name change while MAC is immutable.
- Logs dialog shows severity, message, and timestamp.

Definition of done:

- Browser evidence covers list search/filter/view modes, detail, edit, logs,
  preview refresh, playlist assignment/unassignment, and delete confirmation.
- Secrets/API keys are redacted.
- Unknown, inactive, blocked, and offline devices have explicit UI/API states.
- Assignment changes affect `/api/display`.

### ST-12 Device Display Images And 1-Bit BMP Contract

As a TRMNL-compatible device, I receive setup/display images as monochrome BMPs
that work for partial e-ink updates.

Definition of done:

- Setup and display flows serve BMP, not PNG.
- BMPs are 1-bit monochrome with expected dimensions.
- Display responses include cache-busting and telemetry query parameters where
  reference behavior requires them.
- Automated checks verify BMP headers, bit depth, dimensions, and non-empty
  image data.
- Physical-device verification is recorded before final completion.

### ST-13 Settings: Welcome Screen Automation

As an operator, I can configure what new devices display before I build custom
content for them.

Observed reference behavior:

- Settings has Welcome Screen Configuration.
- Toggles cover auto-create welcome screen and auto-assign playlist to new
  devices.
- Title/subtitle fields update a live monochrome preview.
- Standard 800x480 and Compact 640x384 templates exist, with current default
  and Set as Default.
- Bulk action regenerates welcome screens.
- Page explains how welcome screens are created, added to a default playlist,
  and assigned to devices.

Definition of done:

- Welcome settings can be edited, reset, previewed, persisted, and applied to
  newly registered devices.
- Template default selection works.
- Bulk regenerate is confirmed and covered by tests.

### ST-14 Settings: API Tokens And Network Security

As an operator, I can configure external API access without weakening security
silently.

Observed reference behavior:

- GitHub API token setting explains rate limits, token creation steps, Test, and
  Save Token.
- Network Security has an Allow local network data sources switch for private
  IPs while internal service hostnames remain blocked.

Definition of done:

- GitHub token can be saved, tested, redacted, and used by GitHub Stars.
- Local-network data source policy is configurable and enforced by fetch code.
- Security-sensitive values never appear in logs, exports, screenshots, or
  completion evidence.

### ST-15 Settings: E-Ink Rendering And Troubleshooting

As an operator, I can tune rendering and diagnose server/device connectivity.

Observed reference behavior:

- E-ink Rendering has dithering mode: Floyd-Steinberg, Threshold, Grayscale.
- Threshold is numeric, with Default and Non-white to black quick actions.
- Server Status shows online state, server IP, device URL, last checked, and
  Refresh.
- Troubleshooting has expandable entries for device connection, loading screen,
  offline dashboard, screen not updating, and re-setup.

Definition of done:

- Rendering settings persist and are used by BMP rendering.
- Server status refresh reflects current runtime config.
- Troubleshooting entries provide operator-actionable guidance.

### ST-16 Firmware And Update Flow

As an operator/device, firmware metadata and update signaling are available
without forcing incorrect updates.

Definition of done:

- Firmware inventory endpoints expose available firmware records.
- `/api/display` only signals firmware updates when matching valid firmware is
  available.
- Device firmware state is persisted from polling metadata.
- UI exposes current firmware on device list/detail and update state where
  applicable.
- Tests cover no-update, update-available, and invalid firmware cases.

### ST-17 Plugins Future State

As an operator, I can see that plugins are a planned integration surface without
mistaking it for a finished feature.

Observed reference behavior:

- Plugins page is a Coming Soon page describing homelab integrations, server
  monitoring, smart home dashboards, and network stats.
- Designer still has a Plugin Widget palette item.

Definition of done:

- Plugins page exists with explicit future/unsupported messaging.
- Plugin Widget either works with implemented plugin instances or renders an
  explicit unsupported/future state.
- Completion report does not mark plugin workflows complete unless real plugin
  management exists.

### ST-18 MCP Automation

As an automation client, I can list, create, update, render, and inspect screens,
widgets, and data sources without duplicating business logic.

Definition of done:

- MCP is disabled by default and enabled by config.
- MCP tools reuse the same repositories/services as HTTP/admin flows.
- MCP covers screen, widget, data source, render preview, and health workflows.
- MCP validation and errors match HTTP behavior.
- MCP evidence maps back to the story IDs it can reproduce.

### ST-19 Existing Database Compatibility

As an existing Inker operator, I can point Tiding at a copied Inker SQLite
database and keep screens, widgets, data sources, devices, and playlists usable.

Definition of done:

- Compatibility fixture opens without destructive migration.
- Unknown columns and JSON config fields are preserved.
- Existing screen thumbnails, designer widgets, data sources, custom widgets,
  devices, playlists, and settings are visible in admin pages.
- Existing predefined/custom widgets render or show explicit unsupported states.
- Schema report identifies supported and unsupported parts clearly.

### ST-20 Production UX Quality Across Main Pages

As a repeated admin user, the interface is efficient, coherent, and comparable
in quality to the reference product rather than a temporary scaffold.

Definition of done:

- Ark UI is used as the project-wide primitive library for standard interactive
  controls; Park UI is used or explicitly rejected with rationale.
- Main pages use JSX and CSS modules, with visible strings wrapped for i18n.
- The UI is dense but readable, avoids nested-card clutter, and avoids a
  one-note palette.
- Browser automation checks login, dashboard, screens, designer, data sources,
  custom widgets, devices, playlists, plugins, extensions, and settings at
  desktop and mobile widths.
- Completion report records per-page screenshots or observations and any
  remaining UX gaps.

## Completion Evidence Matrix

Before final completion, `docs/completion-report.md` must include a table with
one row per story:

| Story | Evidence required |
| --- | --- |
| ST-01 | Authenticated desktop and mobile login/navigation/dashboard run |
| ST-02 | Browser screen create/import/export/delete-confirmation run |
| ST-03 | Designer drag/select/move/resize/rotate/layer/save/reload run |
| ST-04 | Template inventory assertion and render coverage for all templates |
| ST-05 | Data-source create/test/edit/toggle/delete/error/security run |
| ST-06 | Custom-widget wizard from new data source through draggable palette |
| ST-07 | Framework widget create/edit/preview/export/import/render tests |
| ST-08 | Context schema/test-context/placement-context browser run |
| ST-09 | Playlist create/edit/composer/assign browser run and display fallback tests |
| ST-10 | Device onboarding/manual-registration browser run and setup API tests |
| ST-11 | Device list/detail/edit/logs/assignment browser run and API tests |
| ST-12 | BMP header/depth checks plus physical TRMNL verification |
| ST-13 | Welcome-screen settings/default/bulk-regenerate evidence |
| ST-14 | GitHub-token and local-network-security tests with redaction evidence |
| ST-15 | E-ink rendering settings/server-status/troubleshooting evidence |
| ST-16 | Firmware update/no-update UI and API tests |
| ST-17 | Plugins future state or implemented plugin-management evidence |
| ST-18 | MCP tool tests mapped to story workflows |
| ST-19 | Compatibility fixture browser/API/render run |
| ST-20 | Desktop/mobile screenshots and UX gap review |
