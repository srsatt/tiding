# Clean-Room Log

Record all clean-room implementation inputs and outputs here.

## Template

### YYYY-MM-DD HH:MM Agent

- Allowed inputs:
- Files produced:
- Verification:
- Notes:


### 2026-06-24 Agent

- Allowed inputs: `docs/agent-loop/overnight-agent-prompt.md`, `docs/agent-loop/protocol.md`, `docs/agent-loop/frontend.md`
- Files produced: `LICENSE`, `package.json`, `tsconfig.json`, `.gitignore`, `src/` directory structure.
- Verification: File existence and content check.
- Notes: Initial project scaffold. Clean-room compliant as no GPL source was read.

### 2026-07-07 Agent

- Allowed inputs: clean-room docs under `docs/agent-loop/`, factual SQLite schema
  observations under `docs/compat/schema-observations/`, black-box HTTP behavior
  from `localhost:3337`, and copied SQLite database data from
  `../inker/backend/data/inker.db`. Public TRMNL BYOS/API documentation was used
  to verify the setup/display/log device protocol surface. Public Ark UI and
  Park UI documentation was used to correct the frontend prompt/spec direction.
- Files produced: Bun/TypeScript backend, SQLite repositories, Takumi-to-1-bit
  BMP rendering path, API handlers, server-rendered JSX admin pages, frontend
  CSS module source, frontend island bundle, settings repository/API,
  backup-first additive migration helper, compatibility schema report, admin
  request-body controls for POST data sources, read-only playlist inventory
  endpoints, read-only device inventory endpoints, read-only admin pages for
  devices and playlists, runtime HTTP server config helper, repeatable HTTP
  benchmark helper, production build/compile package scripts, optional MCP stdio
  tooling, focused tests, and a synthetic compatibility database generated at
  test time.
- Verification: `rtk bun test`, `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, `rtk bun run compile:server`, `rtk bun run
  compile:server:rpi`, smoke HTTP checks, BMP header checks, black-box
  `/api/display` comparisons, and copied real DB startup/preview checks.
- Notes: No GPL source, migrations, frontend source, or tests were read. The
  compatibility tests use synthetic rows against the observed schema.

### 2026-07-07 Frontend Quality Gate Update

- Allowed inputs: authenticated black-box UI observations from
  `localhost:3337`, user feedback on frontend maintainability, and public Preact
  `preact-iso` documentation at `https://preactjs.com/guide/v10/preact-iso/`.
- Files produced: updated frontend quality gates and prompt/dependency-policy
  docs.
- Notes: No GPL source, templates, CSS, or implementation were read.

### 2026-07-07 Screen Package Import/Export

- Allowed inputs: clean-room product stories, existing Tiding repositories/API
  handlers, and compatibility schema observations.
- Files produced: `src/services/screen-package.ts`, screen-design API
  import/export wiring, admin import/export controls, and focused regression
  tests.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  and `rtk bun run build`.
- Notes: Export intentionally omits data-source headers, request bodies, and
  cache payloads to avoid leaking credentials or private sample data.

### 2026-07-08 Framework Widget Package Roundtrip

- Allowed inputs: clean-room product stories, existing Tiding screen package
  service, Framework custom-widget runtime, and tests/specs.
- Files produced: screen package context-schema preservation for custom widgets,
  Framework custom-widget export/import/render regression coverage, and
  completion notes.
- Verification: focused screen package test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Keeps Framework widget package portability without exporting request
  headers, request bodies, cached source payloads, or secrets. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-07 Park UI Theme Slice

- Allowed inputs: public Park UI docs at `https://park-ui.com/docs`, existing
  Tiding frontend source, and clean-room frontend quality gates.
- Files produced: local Park-compatible control styles, theme token styles,
  persisted theme picker hydration, admin shell theme control, tests, and
  dependency updates for Lucide icon parity with Park UI guidance.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  and `rtk bun run build`.
- Notes: Park UI docs describe source distribution on top of Ark UI and Panda
  CSS. This slice adopts Park-compatible semantics/tokens without enabling full
  Panda codegen yet.

### 2026-07-07 Screen Management Presets

- Allowed inputs: clean-room product stories and existing Tiding frontend/API
  handlers.
- Files produced: screen resolution preset UI, preset hydration, screen-list
  delete action, submitter-level delete confirmation, CSS, tests, and completion
  notes.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  `rtk bun run build`, and browser smoke against local Tiding.
- Notes: Implements ST-02 landscape/portrait/custom resolution choice and
  accidental-delete guard without using GPL UI source.

### 2026-07-07 Screen Inventory Thumbnails

- Allowed inputs: clean-room product stories and existing Tiding preview/render
  APIs.
- Files produced: screen-list BMP thumbnail markup/styles, build wiring, tests,
  and completion-report evidence.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  `rtk bun run build`, curl preview BMP check, and browser smoke against local
  Tiding.
- Notes: Thumbnails reuse Tiding's 1-bit BMP preview route; no reference UI
  source was inspected.

### 2026-07-07 Screen Package Dialogs

- Allowed inputs: public Ark UI Dialog documentation, clean-room product
  stories, and existing Tiding screen-package service.
- Files produced: Ark Dialog hydration island, import/export screen package
  dialogs, dialog styles, copy-to-clipboard hydration, tests, and completion
  evidence.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  `rtk bun run build`, and browser smoke against local Tiding.
- Notes: Dialog implementation follows Ark component anatomy and uses Tiding
  package JSON; no GPL source, templates, or CSS were used.

### 2026-07-07 Framework Predefined Widgets

- Allowed inputs: clean-room product-story Reference Inventory, existing Tiding
  composer, and Tiding database schema.
- Files produced: predefined widget-template seed registry, framework-widget JSX
  registry, composer routing through that registry, tests, and completion
  evidence.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  `rtk bun run build`, and browser smoke against local Tiding.
- Notes: Predefined widgets are clean-room JSX framework widgets. No GPL source,
  templates, CSS, or exact reference layout were used.

### 2026-07-07 Data Source Context Fetch

- Allowed inputs: clean-room product stories, existing Tiding data-source API,
  repository, and frontend form code.
- Files produced: context placeholder resolver, data-source fetch/test context
  support, JSON field discovery, admin context-schema/test-context controls, and
  focused regression tests.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  and `rtk bun run build`.
- Notes: Implements clean-room `{ctx.*}` placeholder behavior and field
  discovery for Tiding; no GPL source, templates, CSS, or migrations were read.

### 2026-07-07 Data Source List Controls

- Allowed inputs: clean-room product stories and existing Tiding data-source
  repositories, handlers, and admin routes.
- Files produced: active toggle endpoint, Test All endpoint, data-source usage
  count query, redacted header list preview, active/type form controls, RSS/Atom
  unsupported fetch state, CSS, and focused regression tests.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`,
  and `rtk bun run build`.
- Notes: RSS/Atom is explicitly marked unsupported instead of pretending parity;
  header values are redacted in the list UI. No GPL source, templates, CSS, or
  migrations were read.

### 2026-07-07 Custom Widget Wizard Slice

- Allowed inputs: clean-room product stories, existing Tiding custom-widget
  repositories, handlers, renderer, and admin routes.
- Files produced: four-section custom-widget create wizard, display mode
  choices including Framework/JavaScript/Grid, field discovery from cached data,
  widget context-schema persistence, CSS, and focused regression tests.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, focused
  custom-widget tests, full `rtk bun test`, `rtk bun run build`, and local
  wizard smoke.
- Notes: This is a clean-room wizard surface. It does not copy reference source,
  templates, CSS, or exact layout; unsaved live BMP preview remains a known gap.

### 2026-07-07 Playlist Write Workflow Slice

- Allowed inputs: clean-room product stories, existing Tiding playlist
  repository/API/admin routes, and observed compatibility schema.
- Files produced: playlist create/update/delete repository methods, playlist
  item add/remove methods, admin/API write handlers, playlist create/edit/add
  screen UI, composer affordance placeholders, CSS, tests, and completion notes.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, focused playlist
  tests, full `rtk bun test`, `rtk bun run build`, and local playlist smoke.
- Notes: Adds clean-room writable playlist workflow. Device assignment and full
  grid composer persistence remain known gaps; no GPL source, templates, or CSS
  were read.

### 2026-07-07 Device Playlist Assignment

- Allowed inputs: clean-room product stories, existing Tiding device/playlist
  repositories, handlers, admin pages, and compatibility schema.
- Files produced: device playlist update repository method, assignment API
  handler, device detail assignment form, playlist connected-device panel, tests,
  and completion evidence.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, focused
  device/playlist tests, full `rtk bun test`, `rtk bun run build`, and local
  assignment smoke.
- Notes: Adds clean-room assign/unassign playlist workflow; no GPL source,
  templates, or CSS were read.

### 2026-07-07 Framework-First Composer And Routing Cleanup

- Allowed inputs: clean-room product stories, user architecture feedback,
  existing Tiding frontend/composer code, and existing tests/specs.
- Files produced: route-definition admin dispatcher, split composer document
  components, grouped Framework widget registry, predefined-template seed
  derivation from that registry, typed designer canvas styles, manual-device
  registration test coverage, and spec/completion updates.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`, focused
  composer/manual-device tests, full `rtk bun test`, and `rtk bun run build`.
- Notes: Framework widgets are now the first-class source for predefined
  metadata/defaults/sizing/rendering. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Frontend Routing And Framework Naming Cleanup

- Allowed inputs: existing Tiding frontend/composer code, clean-room specs, and
  user feedback about avoiding spaghetti composer/routing code.
- Files produced: path-template admin router helper, JSX Ark island render
  trees, Framework-named widget seed constant, docs, and focused type/lint
  verification.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun run lint`,
  `rtk bun test`, and `rtk bun run build`.
- Notes: This keeps the Framework registry as the single source for predefined
  widget inventory while moving frontend control rendering toward JSX and route
  definitions. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-08 Designer Payload Contract Cleanup

- Allowed inputs: existing Tiding designer palette/island code, clean-room
  Framework-first decisions, and user feedback about keeping the screen
  composer clean.
- Files produced: shared validated designer widget placement payload,
  Framework/custom palette metadata, source-quality tests, and completion notes.
- Verification: focused frontend source-quality tests plus full type, lint,
  test, and build gates before commit.
- Notes: This keeps predefined Framework widgets and user-authored custom JS
  widgets on one designer placement path. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Designer Inspector UX Cleanup

- Allowed inputs: existing Tiding designer JSX/CSS/island code, clean-room
  product stories, and user feedback about raising designer UX quality.
- Files produced: card-based active widget inspector, compact Park-style action
  buttons, state sync updates, source-quality tests, and completion notes.
- Verification: focused admin page tests plus full type, lint, test, build, and
  diff checks before commit; local agent-browser snapshot confirmed the updated
  inspector controls after PIN login.
- Notes: This improves scan density without copying reference source, templates,
  CSS, or exact layout.

### 2026-07-08 Designer Framework Config Panels

- Allowed inputs: existing Tiding Framework widget registry, designer JSX/island
  code, clean-room product stories, and widget form config helpers.
- Files produced: shared Framework config-field model, selected-widget designer
  config panels, config merge support in Apply, live label sync, tests, and
  completion notes.
- Verification: focused admin page/source tests plus full type, lint, test,
  build, and diff checks before commit; local agent-browser smoke changed a
  selected Text Block quick-config field and verified persisted widget JSON.
- Notes: Designer config fields now use the same clean-room Framework metadata
  as widget forms. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-08 Framework Palette Unification

- Allowed inputs: existing Tiding designer/frontend code, clean-room Framework
  widget registry, user architecture feedback, and specs/tests.
- Files produced: Framework palette item model, unified JSX palette rendering
  for predefined and user-authored widgets, widget-form Framework naming,
  architecture decision update, and regression assertions.
- Verification: focused admin shell tests, frontend file-size gate, typecheck,
  lint, full test/build gates.
- Notes: User-authored widgets now enter designer composition through the same
  Framework palette item shape as bundled widgets. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Designer Save And Render Toolbar

- Allowed inputs: existing Tiding designer/frontend code, clean-room product
  stories, and tests/specs.
- Files produced: designer status helper, toolbar Save Layout/Render BMP/Back
  actions, autosave status updates for move/resize/layer/rotate/property/delete
  operations, status-state styling, completion report updates, and regression
  assertions.
- Verification: focused admin shell tests, frontend file-size gate, typecheck,
  lint, full test/build gates.
- Notes: The designer now makes autosave/render/back workflows explicit without
  copying GPL source, templates, CSS, or exact reference layout.

### 2026-07-07 Park-Style Shell And Dashboard Slice

- Allowed inputs: clean-room product stories, existing Tiding shell/dashboard
  code, existing tests/specs, and user feedback prioritizing Park UI.
- Files produced: Park-style shell navigation/theme controls, active-route and
  segmented-theme hydration, dashboard quick-action/status improvements, CSS,
  tests, and completion evidence.
- Verification: focused admin frontend/page tests plus full project gates.
- Notes: This is clean-room UI implementation using existing Tiding tokens and
  Park-style data attributes. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-07 Structured Framework Widget Config

- Allowed inputs: clean-room product stories, existing Tiding Framework widget
  registry, widget form/API code, and tests/specs.
- Files produced: registry-derived widget config controls, hydration that syncs
  those controls into existing JSON config, CSS, tests, and completion evidence.
- Verification: focused admin frontend/page tests plus full project gates.
- Notes: This improves predefined-widget configuration without changing the
  backend JSON contract. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-07 Placement Context Widget Controls

- Allowed inputs: clean-room product stories, existing Tiding custom-widget
  context schema support, widget form/API code, renderer contract, and tests.
- Files produced: placement context controls for context-aware custom widgets,
  hydration that syncs values into `config.ctx`, CSS reuse, tests, and
  completion evidence.
- Verification: focused admin page tests plus full project gates.
- Notes: Uses existing Tiding `context_schema` and `ctx` contracts. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Welcome Screen Settings Slice

- Allowed inputs: clean-room product stories, existing Tiding settings,
  screen/widget/playlist/device repositories, and tests/specs.
- Files produced: welcome settings defaults/parser, welcome screen generation
  service, settings UI with preview/reset/regenerate controls, new-device
  playlist assignment hooks, CSS, tests, and completion evidence.
- Verification: focused welcome settings test plus full project gates.
- Notes: Implements clean-room welcome automation through existing Tiding
  screen/playlist/widget contracts. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Welcome Draft BMP Preview

- Allowed inputs: clean-room product stories, existing Tiding welcome settings
  UI/service, Takumi renderer, settings handler, and tests/specs.
- Files produced: draft welcome BMP renderer, `/api/settings/welcome/preview`,
  settings preview iframe/control, welcome CSS, regression assertions, and
  completion notes.
- Verification: focused welcome settings test, frontend file-size gate,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Operators can preview a 1-bit BMP before saving/regenerating welcome
  artifacts. No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 API Token And Network Security Slice

- Allowed inputs: clean-room product stories, existing Tiding settings,
  data-source fetch code, settings UI/API code, and tests/specs.
- Files produced: GitHub token save/test/redaction handling, GitHub API
  authorization injection for data-source fetches, local-network blocking
  policy, settings UI, tests, and completion evidence.
- Verification: focused security settings test plus full project gates.
- Notes: Sensitive values are redacted in settings API/UI evidence. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 GitHub Stars Token Rendering

- Allowed inputs: clean-room product stories, existing Tiding Framework widget
  registry, settings repository, GitHub header helper, composer, and tests.
- Files produced: GitHub Stars live config enrichment, token-backed GitHub API
  request path, visible fallback errors, focused token/redaction render test,
  and completion notes.
- Verification: focused GitHub/security/predefined-widget tests plus full type,
  lint, test, build, and diff checks before commit.
- Notes: Test uses a mocked GitHub API response to prove token use without
  exposing secrets or depending on public-network availability. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 E-Ink Rendering Settings Slice

- Allowed inputs: clean-room product stories, existing Tiding settings,
  Takumi/BMP rendering code, settings UI/API code, and tests/specs.
- Files produced: render settings parser, threshold/Floyd-Steinberg/grayscale
  BMP conversion support, settings-backed preview/runtime rendering, server
  status and troubleshooting UI, tests, and completion evidence.
- Verification: focused render/settings tests plus full project gates.
- Notes: Uses clean-room monochrome conversion logic and existing Tiding
  runtime configuration. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-08 Render Settings Draft BMP Preview

- Allowed inputs: clean-room product stories, existing Tiding render settings
  UI/API, Takumi renderer, and tests/specs.
- Files produced: draft render-settings BMP renderer,
  `/api/settings/render-preview`, settings preview iframe/control, CSS, tests,
  and completion notes.
- Verification: focused settings/render preview tests, frontend file-size gate,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Operators can inspect 1-bit rendering settings before saving them. No
  GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Firmware Operator State UI

- Allowed inputs: clean-room product stories, existing Tiding firmware/display
  handlers, device repository fields, admin routes, and tests/specs.
- Files produced: device list firmware/update status columns, device-detail
  firmware state panel with latest stable artifact information, shared firmware
  status helper, admin page regression assertions, and completion notes.
- Verification: focused admin page shell test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Exposes existing firmware signaling state without adding a second
  update policy. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-08 Device Inventory Filters

- Allowed inputs: clean-room product stories, existing Tiding device admin UI,
  firmware status helper, admin routing, and tests/specs.
- Files produced: server-rendered device search/status/update filters, split
  device inventory table/filter helpers, route query-param wiring, admin page
  regression assertions, and completion notes.
- Verification: focused admin page shell test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Adds operator filtering without exposing secret API keys or adding a
  client-side framework path. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-08 Device Grid/List Inventory

- Allowed inputs: clean-room product stories, existing Tiding device admin UI,
  firmware status helper, and tests/specs.
- Files produced: device grid cards with firmware/battery/Wi-Fi/playlist/last
  seen state, grid/list view query state, device-specific CSS, build inclusion,
  admin page regression assertions, and completion notes.
- Verification: focused admin page shell test, frontend file-size gate,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Adds the missing device inventory view-mode workflow without exposing
  secret API keys or copying GPL source, templates, CSS, or exact reference
  layout.

### 2026-07-08 Playlist Composer Slots

- Allowed inputs: clean-room product stories, existing Tiding playlist
  repository/API/admin UI, screen repository data, and tests/specs.
- Files produced: data-backed playlist composer slots with screen names,
  resolution and duration metadata, split composer component, CSS, admin page
  regression assertions, and completion notes.
- Verification: focused admin page shell test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Replaces static composer labels with read-side playlist state without
  claiming full grid-layout persistence. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Plugins Future State

- Allowed inputs: clean-room product stories, existing Tiding plugins page,
  Framework widget registry, designer palette, and tests/specs.
- Files produced: explicit plugins future/not-implemented status panel,
  admin page assertions for unsupported plugin state, designer palette
  assertion for Plugin Widget, and completion notes.
- Verification: focused admin page shell test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: This satisfies the future-state story without claiming plugin
  management exists. No GPL source, templates, CSS, or exact reference layout
  were read.

### 2026-07-08 MCP Lifecycle And Story Map

- Allowed inputs: clean-room product stories, existing Tiding MCP tools,
  repositories, render/data-source services, and tests/specs.
- Files produced: MCP screen create/update tools, data-source create/update
  tools, health.status tool, storyIds metadata on each MCP tool, lifecycle and
  validation regression tests, and completion notes.
- Verification: focused MCP tests, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Extends automation coverage through existing repositories/services
  rather than duplicating HTTP business logic. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Compatibility Admin Visibility

- Allowed inputs: clean-room product stories, copied SQLite compatibility
  fixture, existing Tiding admin routes/repositories, schema report code, and
  tests/specs.
- Files produced: Settings compatibility schema report panel, admin route wiring
  for schemaReport, copied-fixture admin visibility regression test, and
  completion notes.
- Verification: focused copied-fixture admin test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Verifies existing rows are visible through admin pages without reading
  GPL source or mutating the original fixture. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Device Setup Copy UX

- Allowed inputs: clean-room product stories, existing Tiding device setup UI,
  copy-button island, device API handlers, and tests/specs.
- Files produced: expanded Wi-Fi setup instructions, copyable server URL and
  setup BMP URL controls, manual-device regression assertions, and completion
  notes.
- Verification: focused manual-device test, `rtk bun x tsc --noEmit`,
  `rtk bun run lint`, `rtk bun test`, and `rtk bun run build`.
- Notes: Improves operator setup ergonomics while leaving physical
  captive-portal verification and QR UX as explicit gaps. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Device Edit And Delete Workflow

- Allowed inputs: clean-room product stories, existing Tiding device repository,
  admin/API handlers, detail page, and tests/specs.
- Files produced: device label update repository/API path, device delete path,
  detail-page edit controls with immutable MAC display and delete confirmation,
  API/admin regression assertions, and completion notes.
- Verification: focused device endpoint and admin shell tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Adds operator edit/delete workflow without exposing raw API keys. No
  GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Framework-First Custom Widget Template

- Allowed inputs: clean-room product stories, existing Tiding Framework widget
  registry, designer palette, widget form/islands, composer code, and
  tests/specs.
- Files produced: explicit `custom-js` Framework widget definition, palette and
  form targeting for custom widgets, composer boundary split, regression
  assertions, and architecture/completion notes.
- Verification: focused template/custom-widget/designer tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Removes seed-order fallback behavior for user-authored widgets. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Device Current Screen Preview

- Allowed inputs: clean-room product stories, existing Tiding display handler,
  device/playlist/screen repositories, device detail page, and tests/specs.
- Files produced: shared device screen-selection service, display handler reuse,
  device-detail current-screen preview panel, admin/API regression assertions,
  and completion notes.
- Verification: focused display fallback and admin shell tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Reuses the display endpoint selection contract for the admin preview
  instead of copying reference implementation details. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Toolbar Zoom Controls

- Allowed inputs: clean-room product stories, existing Tiding designer route,
  designer island code, CSS, and tests/specs.
- Files produced: split JSX designer toolbar, zoom viewport CSS, client zoom
  and status hydration, admin shell/source assertions, and completion notes.
- Verification: focused frontend architecture and admin shell tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Adds real toolbar behavior for a previously static zoom metric without
  copying reference implementation details. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Custom Widget Draft Preview

- Allowed inputs: clean-room product stories, existing Tiding custom-widget
  wizard, custom-widget runtime, preview service, API handler, and tests/specs.
- Files produced: unsaved draft preview renderer, `POST
  /api/custom-widgets/preview`, wizard preview iframe controls, regression
  assertions, and completion notes.
- Verification: focused custom-widget draft preview and wizard tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Uses the existing clean-room/Takumi preview path for unsaved form data
  without persisting a custom widget. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Custom Widget Wizard State Navigation

- Allowed inputs: clean-room product stories, existing Tiding custom-widget
  wizard, CSS/build path, and tests/specs.
- Files produced: state-preserving wizard step navigation, source reload action,
  wizard-specific CSS, build inclusion, regression assertions, and completion
  notes.
- Verification: focused custom-widget wizard test, frontend file-size gate,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Wizard steps remain one server-rendered form so draft state survives
  moving between steps and previewing. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Playlist Composer Placement Persistence

- Allowed inputs: clean-room product stories, existing Tiding playlist
  repository/API/admin UI, playlist item `config` field, and tests/specs.
- Files produced: layout/slot config persistence for added playlist screens,
  composer-slot rendering of persisted layout/slot metadata, regression
  assertions, and completion notes.
- Verification: focused playlist API/admin/frontend line-gate tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Uses existing compatibility `playlist_items.config` rather than adding
  destructive schema changes. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-08 Playlist Composer Presets

- Allowed inputs: clean-room product stories, existing Tiding playlist composer
  UI/API, playlist item config support, and tests/specs.
- Files produced: query-driven composer layout/slot presets, real Add slot/Add
  grid links, add-screen anchor wiring, CSS updates, regression assertions, and
  completion notes.
- Verification: focused playlist workflow test, frontend file-size gate,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Removes disabled composer placeholder controls and routes presets into
  the existing persisted add-screen flow. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Playlist Item Inline Editing

- Allowed inputs: clean-room product stories, existing Tiding playlist
  repository/API/admin UI, playlist item config support, and tests/specs.
- Files produced: playlist item update repository/API path, editable item table
  rows, frontend route splits to preserve file-size gates, regression
  assertions, and completion notes.
- Verification: focused playlist workflow and frontend line-gate tests plus
  full type, lint, test, build, and diff checks before commit; local
  agent-browser smoke edited a playlist item and verified the item API output.
- Notes: Keeps layout/slot metadata in existing `playlist_items.config`; no GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Playlist Resolution Warning

- Allowed inputs: clean-room product stories, existing Tiding playlist detail
  page, screen repository data, and tests/specs.
- Files produced: mixed-resolution playlist notice component, route extraction
  to preserve frontend line limits, admin regression assertion, and completion
  notes.
- Verification: focused playlist warning, admin shell, frontend line-gate
  tests, `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Clearly explains resolution mismatches without preventing existing
  compatibility data from loading. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Refreshable Server Status

- Allowed inputs: clean-room product stories, existing Tiding settings page,
  settings API handler, runtime options, and tests/specs.
- Files produced: server-status JSON endpoint, refreshable settings panel
  hydration, admin/API assertions, and completion notes.
- Verification: focused settings endpoint/admin shell/frontend line-gate tests,
  `rtk bun x tsc --noEmit`, `rtk bun run lint`, `rtk bun test`, and
  `rtk bun run build`.
- Notes: Makes the server status panel reflect current request/runtime data
  without copying reference implementation details. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Framework Widget Instance Boundary

- Allowed inputs: clean-room product stories, existing Tiding designer,
  Framework registry/composer code, and current user feedback about avoiding
  template-first spaghetti.
- Files produced: shared Framework widget instance model, composer/designer
  wiring, palette metadata, regression assertions, and spec/completion notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Preserves compatibility `template_id` storage while making
  predefined and custom JS widgets resolve through one Framework-first app
  model. No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Park Token Polish

- Allowed inputs: clean-room product stories, existing Tiding designer route,
  Park/theme token layer, and current user feedback about production-level UI.
- Files produced: Park-compatible designer toolbar metadata, tokenized
  palette/canvas/panel styles, split designer toolbar stylesheet, regression
  assertions, and completion notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Improves the scaffold-level designer without copying reference CSS or
  exact layouts. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-08 Device Setup QR Codes

- Allowed inputs: clean-room product stories, existing Tiding device setup
  page, Framework QR widget definition, public `qrcode` package docs/types, and
  tests/specs.
- Files produced: shared SVG QR component, setup-page QR affordance, real QR
  Framework widget rendering, dependency log, regression assertions, and
  completion notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Uses local MIT-licensed QR generation rather than an external service
  or copied reference implementation. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Display BMP Contract Evidence

- Allowed inputs: clean-room product stories, existing Tiding display/setup
  HTTP routes, render cache code, and tests/specs.
- Files produced: shared BMP assertion helper, stronger HTTP compatibility
  checks for display image artifact, preview BMP, setup BMP, and completion
  notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Strengthens ST-12 evidence without changing device payload behavior.
  No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 RSS Atom Data Sources

- Allowed inputs: clean-room product stories, existing Tiding data-source
  fetch/form/list code, public `fast-xml-parser` package docs/types, and
  tests/specs.
- Files produced: feed XML parser service, RSS/Atom fetch integration,
  UI label cleanup, dependency log, regression assertions, and completion
  notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Uses MIT-licensed XML parsing and clean-room normalized feed JSON.
  No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 MCP Playlist Workflow

- Allowed inputs: clean-room product stories, existing Tiding MCP tool router,
  playlist repository/API behavior, and tests/specs.
- Files produced: playlist MCP tool definitions and handlers for list/get/
  create/update/add-item/update-item/delete-item, regression assertions, and
  completion notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Reuses existing playlist repository validation and screen existence
  checks instead of duplicating a separate automation model. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 MCP Custom Widget Workflow

- Allowed inputs: clean-room product stories, existing Tiding MCP tool router,
  custom-widget repository/API behavior, preview service, and tests/specs.
- Files produced: custom-widget MCP tool definitions and handlers for
  list/get/create/update/delete/render-preview, regression assertions, and
  completion notes.
- Verification: `rtk bun run lint`, `rtk bun x tsc --noEmit`,
  `rtk bun test`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Reuses data-source existence checks, dependent-screen invalidation,
  and the same custom-widget BMP preview service as HTTP/admin flows. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Preact-Iso Route Matching And Framework Palette Cleanup

- Allowed inputs: existing Tiding frontend route/designer code, user feedback
  about avoiding custom route glue and string/spaghetti composition,
  `preact-iso` documentation at `https://preactjs.com/guide/v10/preact-iso/`.
- Files produced: `preact-iso` dependency entry, route matcher wiring, grouped
  Framework palette model, frontend quality guards, and updated agent-loop
  frontend criteria.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun test`,
  `rtk bun run lint`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Keeps server-rendered JSX pages while replacing local path-regex
  matching with the Preact router matcher. Bundled/predefined and custom JS
  widgets remain one Framework palette model. No GPL source, templates, CSS, or
  screenshots were copied.

### 2026-07-08 MCP Device Workflow

- Allowed inputs: clean-room product stories, existing Tiding MCP tool router,
  device repository/API behavior, welcome-screen assignment service, and
  tests/specs.
- Files produced: device MCP tool definitions and handlers for
  list/get/create-manual/update-label/assign-playlist/logs/assignments/delete,
  regression assertions, and completion notes.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun test`,
  `rtk bun run lint`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Reuses existing device repository behavior and playlist existence
  checks instead of creating a separate automation model. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Firmware Update Version Guard

- Allowed inputs: clean-room product stories, existing Tiding display handler,
  firmware/device repository behavior, and tests/specs.
- Files produced: numeric firmware version comparison for display update
  signaling, regression coverage for newer/equal/newer-device/invalid stable
  firmware cases, and completion notes.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun test`,
  `rtk bun run lint`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Keeps update signaling tied to valid newer stable firmware artifacts
  instead of any version mismatch. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Existing Compatibility Row Edit Coverage

- Allowed inputs: clean-room product stories, copied factual compatibility DB
  fixture, existing Tiding HTTP handlers/repositories, and tests/specs.
- Files produced: copied-DB regression test that edits existing
  screen/widget/data-source/custom-widget/device/playlist-item rows through HTTP
  handlers while checking preserved compatibility fields, plus completion notes.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun test`,
  `rtk bun run lint`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Uses a temp copy of the factual SQLite fixture only; no GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Welcome Bulk Assignment

- Allowed inputs: clean-room product stories, existing Tiding welcome settings
  service, device repository behavior, frontend route, and tests/specs.
- Files produced: regenerate-time assignment of the generated welcome playlist
  to active devices with no playlist, updated settings copy, regression
  assertions, and completion notes.
- Verification: `rtk bun x tsc --noEmit`, `rtk bun test`,
  `rtk bun run lint`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Existing explicit device playlist assignments are preserved. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Frontend Quality And Pace Guidelines

- Allowed inputs: user feedback about frontend design-system quality, theme
  persistence, icons, architecture, and verification pace; existing Tiding
  agent-loop docs.
- Files produced: updated frontend spec, role prompts, completion criteria,
  protocol dependency policy, architecture notes, and overnight prompt.
- Verification: docs-only diff review and `rtk git diff --check`.
- Notes: Raises Ark/Park, flash-free theme persistence, SVG icon budget,
  styled controls, frontend layering, and batched verification to explicit
  guidelines before further implementation. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Backlog Governance Guidelines

- Allowed inputs: user feedback about backlog tracking, prompt behavior,
  definition of done, and existing Tiding agent-loop docs.
- Files produced: project backlog plus updates to role prompts, overnight
  prompt, completion criteria, and provenance notes.
- Verification: docs-only diff review and `rtk git diff --check`.
- Notes: Requires future user feedback to be captured in the backlog and final
  completion to clear Open and In Progress backlog items. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Theme First Paint Persistence

- Allowed inputs: user feedback about flash-free theme persistence, existing
  Tiding shell/theme island code, and backlog guidelines.
- Files produced: first-paint theme bootstrap before the admin stylesheet,
  cookie-backed theme persistence, regression assertions, and backlog status
  update.
- Verification: focused frontend shell/theme tests, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, browser reload/navigation checks on local port `43339`,
  and `rtk git diff --check`.
- Notes: Keeps the existing theme picker but applies a stored theme before CSS
  loads so server-rendered navigation does not briefly show the default theme.
  No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Lightweight SVG Icon Controls

- Allowed inputs: user feedback about SVG icon usage, existing Tiding
  frontend/designer controls, Lucide package metadata, and agent-loop frontend
  guidelines.
- Files produced: Preact SVG icon adapter for individual Lucide icon-node
  imports, designer toolbar/inspector icon controls, regression assertions, and
  backlog update.
- Verification: focused frontend architecture/page-shell tests,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Avoids rendering React Lucide components inside server-rendered Preact
  pages; only per-icon SVG node data is imported. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Frontend Routing And Size Backlog Closeout

- Allowed inputs: user feedback about `pages.tsx`, admin module removal,
  routing, file-size gates, existing Tiding frontend source, tests, and backlog.
- Files produced: backlog and completion-report evidence updates only.
- Verification: focused frontend architecture/readability tests,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Closes already-proven backlog items for 150-line frontend files,
  `preact-iso` route matching, and absence of hand-written admin CSS class-map
  modules. No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 BMP Rendering Backlog Closeout

- Allowed inputs: user feedback about 1-bit BMP partial-update artifacts,
  existing Tiding rendering code, tests, completion report, and copied
  compatibility DB fixture.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused BMP/render tests, live local HTTP artifact check on
  port `43340`, direct BMP header inspection, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: Live artifacts were written to `/tmp/tiding-b001-screen1.bmp`,
  `/tmp/tiding-b001-setup.bmp`, and `/tmp/tiding-b001-cache/screen-1.bmp`.
  No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Framework Widget Backlog Closeout

- Allowed inputs: user feedback about first-class Framework widgets, existing
  Tiding Framework registry, seed data, palette model, composer, tests,
  backlog, and completion report.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused Framework/predefined widget tests, frontend architecture
  test, `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: Closes Framework-first and predefined-widget coverage at the
  implementation/test-evidence level while leaving broader designer UX browser
  parity tracked separately. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-08 Context Flow Backlog Closeout

- Allowed inputs: user/product-story feedback about datasource and widget
  context, existing Tiding code/tests, a local temporary HTTP upstream, and a
  temporary bootstrap database.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused datasource/custom-widget tests; live local smoke on
  port `43341`; browser check for `/screens/widgets/1` Placement Context with
  `city=Paris`; direct composer check for `Paris: Berlin / ctx-ok`; direct BMP
  header check for `/tmp/tiding-b017-context-screen.bmp`; screenshot
  `/tmp/tiding-b017-placement-context.png`; `rtk bun x tsc --noEmit`;
  `rtk bun run build`; and `rtk git diff --check`.
- Notes: Closes the end-to-end context story using clean-room Tiding behavior.
  No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Custom Widget And Framework Flow Closeout

- Allowed inputs: user/product-story feedback about custom widgets from
  datasources and Framework-layout widgets, existing Tiding code/tests, a local
  temporary JSON upstream, and a temporary bootstrap database.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused custom-widget preview/wizard/render tests; live local
  smoke on port `43342`; browser checks for `/custom-widgets/new`,
  `/custom-widgets/1`, and `/screens/designer/1`; direct composer check for
  `<strong>Paris</strong>: ok / First item`; direct BMP header checks for
  `/tmp/tiding-b015-b016-widget.bmp` and
  `/tmp/tiding-b015-b016-screen.bmp`; screenshots
  `/tmp/tiding-b015-b016-custom-widget.png` and
  `/tmp/tiding-b015-b016-designer.png`; `rtk bun x tsc --noEmit`;
  `rtk bun run build`; and `rtk git diff --check`.
- Notes: Closes the custom-widget datasource flow and Framework-layout widget
  flow. Broader designer and visual polish remain in the open UX backlog. No
  GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Playlist Flow Backlog Closeout

- Allowed inputs: user/product-story feedback about playlists, existing Tiding
  code/tests, and a temporary bootstrap database.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused playlist inventory/admin/display/device-assignment
  tests; live local smoke on port `43343`; browser checks for `/playlists/1`
  and `/devices/1`; direct `/api/display` check for playlist-selected screen
  metadata; direct BMP header check for
  `/tmp/tiding-b019-playlist-display.bmp`; screenshots
  `/tmp/tiding-b019-playlist.png` and `/tmp/tiding-b019-device.png`;
  `rtk bun x tsc --noEmit`; `rtk bun run build`; and
  `rtk git diff --check`.
- Notes: Closes the playlist creation/editing/composer/device-assignment story.
  Broader designer and visual polish remain in the open UX backlog. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Frontend JSX And I18n Closeout

- Allowed inputs: user feedback about replacing string-built frontend HTML and
  preparing i18n, existing Tiding frontend/rendering source, tests, dependency
  log, and backlog.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused frontend architecture test, dependency manifest check
  for `preact`, `preact-render-to-string`, and `ttag`, source search for
  JSX/render-to-string boundaries and old string-composition patterns,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: Closes the JSX runtime and i18n-marker backlog items. CSS Modules and
  design-system depth remain open separately as B-003/B-005/B-007/B-009. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer DnD Backlog Closeout

- Allowed inputs: user feedback about using a mature DnD library, existing
  Tiding designer code/tests/specs, and a temporary bootstrap database.
- Files produced: backlog, completion-report, and provenance evidence updates
  only.
- Verification: focused frontend architecture test proving `interactjs`
  dependency/import/spec wiring; live local smoke on port `43344`; browser
  drag, resize, Snap toggle, and snapped drag checks; persisted widget state
  verification through `/api/screen-designs/1/widgets`; screenshot
  `/tmp/tiding-b013-dnd.png`; `rtk bun x tsc --noEmit`; `rtk bun run build`;
  and `rtk git diff --check`.
- Notes: Closes the DnD implementation/library backlog item. Broader designer
  UX parity remains open as B-012. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Designer Feature Module Extraction

- Allowed inputs: user feedback about frontend architecture, existing Tiding
  designer island code, tests, and frontend specs.
- Files produced: moved designer island helpers from root `src/frontend/` into
  `src/frontend/features/designer/`, updated route/island imports, updated
  architecture tests, and recorded progress in the completion report.
- Verification: focused frontend architecture test, designer payload test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: This is progress toward B-009, not closure. Route TSX/domain UI still
  needs broader feature-module extraction before the frontend architecture
  backlog item is complete. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-08 Form Controls Design-System Extraction

- Allowed inputs: user feedback about frontend architecture/design-system
  layering, existing Tiding shared form control code, tests, and frontend specs.
- Files produced: moved shared select controls from root `src/frontend/forms.tsx`
  into `src/frontend/design-system/form-controls.tsx`, updated route imports,
  updated architecture tests, and recorded progress in the completion report.
- Verification: focused frontend architecture test, custom-widget wizard test,
  data-source form test, `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: This is progress toward B-009 and B-007, not closure. The project still
  needs broader Ark/Park-backed control coverage and feature-module extraction.
  No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Styled Native Form Controls Closeout

- Allowed inputs: user feedback about raw native form controls, existing Tiding
  frontend source/tests/specs, and backlog requirements.
- Files produced: Park-shaped select/checkbox/radio wrappers in the
  design-system layer, form-control CSS bundled by the island build, migrated
  route/shell form callsites, frontend architecture guard updates, and backlog,
  completion-report, and provenance evidence updates.
- Verification: focused frontend architecture test, custom-widget wizard test,
  data-source form test, `rtk rg` source check for raw form controls,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: Closes B-007 by removing visible system-default select/radio/checkbox
  controls from TSX callsites. Broader Ark/Park adoption and CSS-module/design
  architecture remain open as B-005 and B-003. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Park Button Layer Slice

- Allowed inputs: public Ark UI and Park UI documentation, existing Tiding
  frontend source/tests/specs, and backlog requirements.
- Files produced: reusable Park-shaped button, icon-button, link-button,
  delete-button, and form-action components in the design-system layer; route
  migrations for main edit forms and designer toolbar/action buttons; frontend
  architecture test updates; and completion/dependency/provenance documentation
  updates.
- Verification: focused frontend architecture test, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-009, not closure. Park UI documents
  source-distributed components built on Ark UI; Ark UI currently publishes
  React/Solid/Vue/Svelte packages, and no `@ark-ui/preact` package exists in the
  npm registry, so current Ark islands remain React-hydrated while the rest of
  the admin shell stays Preact/JSX. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Design-System CSS Locality Slice

- Allowed inputs: existing Tiding frontend source/tests/specs, backlog
  requirements, and current design-system component boundaries.
- Files produced: moved button styling to
  `src/frontend/design-system/buttons.css`, native form-control styling to
  `src/frontend/design-system/form-controls.css`, and shared field, icon, and
  surface rules to `src/frontend/design-system/fields.css`,
  `src/frontend/design-system/icon.css`, and
  `src/frontend/design-system/surfaces.css`; removed the old
  `src/frontend/styles/park.css` bucket and duplicate designer icon-button
  styling; updated frontend build wiring, architecture tests, and
  completion/provenance evidence.
- Verification: focused frontend architecture test, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-003, B-005, and B-009, not closure. Broader
  route/page style extraction and Ark/Park adoption remain open. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Feature UI Extraction

- Allowed inputs: existing Tiding frontend source/tests/specs, backlog
  requirements, and current designer route/feature boundaries.
- Files produced: moved designer server-rendered canvas, palette, inspector,
  property, config-panel, toolbar, widget-action, palette-model, and widget view
  model modules from `src/frontend/routes/` into
  `src/frontend/features/designer/`; moved shared Framework widget config
  helpers into `src/frontend/features/widgets/`; updated imports, architecture
  tests, and completion/provenance evidence.
- Verification: focused frontend architecture test, designer payload test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: This is progress toward B-009 and B-012, not closure. The route entry
  still composes the designer page, but feature UI and models no longer live in
  flat route files. No GPL source, templates, CSS, or exact reference layout
  were read.

### 2026-07-08 Screen Package Dialog Feature Extraction

- Allowed inputs: existing Tiding screen import/export source/tests/specs and
  backlog requirements.
- Files produced: moved screen package import/export dialog UI from
  `src/frontend/routes/` to `src/frontend/features/screens/`, switched fallback
  dialog actions to the shared Park-shaped `Button`, updated route imports,
  architecture tests, and completion/provenance evidence.
- Verification: focused frontend architecture test, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-009, not closure. Screens routes
  still own page composition; dialog UI now lives in the screens feature. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Device Feature UI Extraction

- Allowed inputs: existing Tiding device inventory/detail source/tests/specs
  and backlog requirements.
- Files produced: moved device current-screen, edit, facts, firmware, setup
  form, grid, inventory filtering, playlist assignment, and table UI/helpers
  from `src/frontend/routes/` to `src/frontend/features/devices/`; updated
  device and playlist route imports; switched moved device form actions to
  shared Park-shaped `Button`/`ButtonLink`; updated architecture tests and
  completion/provenance evidence.
- Verification: focused frontend architecture test, device inventory/detail
  admin tests, `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-009, not closure. Device route
  entries still own page composition; feature UI and helpers no longer live in
  flat route files. No GPL source, templates, CSS, or exact reference layout
  were read.

### 2026-07-08 Playlist Feature UI Extraction

- Allowed inputs: existing Tiding playlist inventory/detail source/tests/specs
  and backlog requirements.
- Files produced: moved playlist composer, controls, item rows, items table,
  layout selector, and resolution warning UI/helpers from `src/frontend/routes/`
  to `src/frontend/features/playlists/`; updated playlist route imports;
  switched playlist form and row actions to shared Park-shaped `Button`
  controls; updated architecture tests and completion/provenance evidence.
- Verification: focused frontend architecture test, playlist admin/display
  tests, `rtk bun x tsc --noEmit`, `rtk bun run build`, and
  `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-009, not closure. Playlist route
  entries still own page composition; feature UI and helpers no longer live in
  flat route files. No GPL source, templates, CSS, or exact reference layout
  were read.

### 2026-07-08 Data Source And Custom Widget Feature UI Extraction

- Allowed inputs: existing Tiding data-source/custom-widget admin source,
  tests/specs, and backlog requirements.
- Files produced: moved data-source fetch-state, form, and row UI helpers into
  `src/frontend/features/data-sources/`; moved custom-widget form, wizard,
  wizard-stepper, and draft-preview UI helpers into
  `src/frontend/features/custom-widgets/`; updated route imports; switched
  moved data-source and custom-widget actions to shared Park-shaped controls;
  updated architecture tests and completion/provenance evidence.
- Verification: focused frontend architecture test, admin page rendering test,
  custom-widget wizard test, data-source form/list tests,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-009, not closure. Data-source and
  custom-widget route entries still own page composition; feature UI and helpers
  no longer live in flat route files. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Settings Feature UI Extraction

- Allowed inputs: existing Tiding settings admin source, tests/specs, and
  backlog requirements.
- Files produced: moved runtime, rendering, security, welcome, and system
  settings panel UI from `src/frontend/routes/` to
  `src/frontend/features/settings/`; updated settings route imports; switched
  settings panel actions to shared Park-shaped `Button` controls; updated
  architecture tests and completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-009, not closure. Settings route
  entry now composes feature panels without inline sections, and settings UI no
  longer lives in flat route files. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Raw Button Boundary Cleanup

- Allowed inputs: existing Tiding frontend source, tests/specs, and backlog
  requirements.
- Files produced: migrated login submit, shell theme/logout actions, and
  designer property actions to the shared Park-shaped `Button` component; added
  a frontend architecture guard rejecting raw `<button>` usage outside
  `src/frontend/design-system/buttons.tsx`; updated completion/provenance
  evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-005 and B-007. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Dashboard Feature UI Extraction

- Allowed inputs: existing Tiding dashboard route source, tests/specs, and
  backlog requirements.
- Files produced: moved dashboard overview, metrics, system-status, and recent
  device/screen panels from `src/frontend/routes/dashboard.tsx` into
  `src/frontend/features/dashboard/`; updated dashboard route imports; added
  architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, optional PIN login/dashboard test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Dashboard route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Extensions Feature UI Extraction

- Allowed inputs: existing Tiding extensions route source, tests/specs, and
  backlog requirements.
- Files produced: moved extensions overview and stat panels from
  `src/frontend/routes/extensions.tsx` into
  `src/frontend/features/extensions/`; updated extensions route imports; added
  architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, `rtk bun x tsc --noEmit`, `rtk bun run build`,
  and `rtk git diff --check`.
- Notes: This is progress toward B-009. Extensions route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Plugins Feature UI Extraction

- Allowed inputs: existing Tiding plugins route source, tests/specs, and
  backlog requirements.
- Files produced: moved plugin placeholder/status panels from
  `src/frontend/routes/plugins.tsx` into `src/frontend/features/plugins/`;
  updated plugins route imports; added architecture guards for the feature
  boundary and section-free route composition; updated completion/provenance
  evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, `rtk bun x tsc --noEmit`, `rtk bun run build`,
  and `rtk git diff --check`.
- Notes: This is progress toward B-009. Plugins route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Data Source Page UI Extraction

- Allowed inputs: existing Tiding data-source route/feature source,
  tests/specs, and backlog requirements.
- Files produced: moved data-source overview table, create panel, and editor
  panel from `src/frontend/routes/data-sources.tsx` into
  `src/frontend/features/data-sources/`; updated data-source route imports;
  added architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, `rtk bun x tsc --noEmit`, `rtk bun run build`,
  and `rtk git diff --check`.
- Notes: This is progress toward B-009. Data-source route entries now compose
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Custom Widget Page UI Extraction

- Allowed inputs: existing Tiding custom-widget route/feature source,
  tests/specs, and backlog requirements.
- Files produced: moved custom-widget overview table, create panel, editor
  form, and preview panel from `src/frontend/routes/custom-widgets.tsx` into
  `src/frontend/features/custom-widgets/`; updated custom-widget route imports;
  added architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, custom-widget wizard test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Custom-widget route entries now compose
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Device Inventory Page UI Extraction

- Allowed inputs: existing Tiding device route/feature source, tests/specs, and
  backlog requirements.
- Files produced: moved device inventory and add-device page panels from
  `src/frontend/routes/devices.tsx` into `src/frontend/features/devices/`;
  updated devices route imports; added architecture guards for the feature
  boundary and section-free route composition; updated completion/provenance
  evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, `rtk bun x tsc --noEmit`, `rtk bun run build`,
  and `rtk git diff --check`.
- Notes: This is progress toward B-009. Devices route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Device Detail Page UI Extraction

- Allowed inputs: existing Tiding device-detail route/feature source,
  tests/specs, and backlog requirements.
- Files produced: moved device detail state, playlist assignment, screen
  assignment, and log panels from `src/frontend/routes/device-detail.tsx` into
  `src/frontend/features/devices/`; updated device-detail route imports; added
  architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, copied compatibility DB admin page test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Device-detail route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Playlist Page UI Extraction

- Allowed inputs: existing Tiding playlist route/feature source, tests/specs,
  and backlog requirements.
- Files produced: moved playlist overview table, detail form/state/add-screen
  panels, and new-playlist panel from `src/frontend/routes/` into
  `src/frontend/features/playlists/`; updated playlist route imports; added
  architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, playlist test batch, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Playlist route entries now compose
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Screen Overview Page UI Extraction

- Allowed inputs: existing Tiding screens route/feature source, tests/specs,
  and backlog requirements.
- Files produced: moved screen overview table, cache-status rows, import
  action, and new-screen panel from `src/frontend/routes/screens.tsx` into
  `src/frontend/features/screens/`; updated screens route imports; added
  architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, screen test batch, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Screens route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Screen Editor Page UI Extraction

- Allowed inputs: existing Tiding screen-editor route/feature source,
  tests/specs, and backlog requirements.
- Files produced: moved screen editor header, details form panel, preview panel,
  widget table, and inline-add widget panel from
  `src/frontend/routes/screen-editor.tsx` into
  `src/frontend/features/screens/`; updated screen-editor route imports; added
  architecture guards for the feature boundary and section-free route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, screen form action test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Screen-editor route entry now composes
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Auth And Compatibility Panel Extraction

- Allowed inputs: existing Tiding auth/settings route source, tests/specs, and
  backlog requirements.
- Files produced: moved login panel from `src/frontend/routes/auth.tsx` to
  `src/frontend/features/auth/`; moved compatibility schema panel from
  `src/frontend/routes/compatibility-report.tsx` to
  `src/frontend/features/settings/`; updated imports; added architecture guards
  for feature placement and section-free route composition; updated
  completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  optional PIN login test, admin shell rendering test,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Auth/settings route entries now compose
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Widget Page And Field Extraction

- Allowed inputs: existing Tiding widget route/feature source, tests/specs, and
  backlog requirements.
- Files produced: moved widget add/edit page wrappers, Framework config fields,
  and placement context fields from `src/frontend/routes/` into
  `src/frontend/features/widgets/`; updated widget form/page imports; added
  architecture guards for old helper removal and section-free widget route
  composition; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, widget test batch, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Widget route entries now compose
  feature UI without inline sections. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Screen Designer Page UI Extraction

- Allowed inputs: existing Tiding screen-designer route/feature source,
  tests/specs, and backlog requirements.
- Files produced: moved screen-designer page header, actions, island shell,
  stage, palette, canvas, toolbar, and inspector composition from
  `src/frontend/routes/screen-designer.tsx` into
  `src/frontend/features/designer/`; updated route imports; added architecture
  guards for the feature boundary and section-free route composition; updated
  completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  designer payload test, admin shell rendering test, `rtk bun x tsc --noEmit`,
  `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009 and B-012. Screen-designer route entry
  now composes feature UI without inline sections. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Screen And Widget Helper Relocation

- Allowed inputs: existing Tiding screen/widget route/feature source,
  tests/specs, and backlog requirements.
- Files produced: moved reusable screen design form and screen widgets table
  from `src/frontend/routes/` into `src/frontend/features/screens/`; moved
  reusable widget form from `src/frontend/routes/` into
  `src/frontend/features/widgets/`; updated feature imports; added architecture
  guards for route-helper removal; updated completion/provenance evidence.
- Verification: focused frontend architecture test, frontend file-size test,
  admin shell rendering test, screen test batch, widget test batch,
  `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-009. Feature modules no longer import shared
  form/table helpers from `routes/`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Frontend Architecture Backlog Closure

- Allowed inputs: existing Tiding frontend source, tests, backlog, completion
  report, and provenance evidence.
- Files produced: backlog and completion-report evidence updates for B-009.
- Verification: `rtk rg -n "<section|className=\\{\\\"panel\\\"\\}|className=\\{\\\"stat\" src/frontend/routes --glob '*.tsx'` returned no route-owned sections; route file line counts are all below the 150-line guard; focused frontend architecture and file-size tests were already green in the same slice.
- Notes: Closes B-009. Remaining B-003, B-005, and B-012 track styling,
  design-system depth, screen-designer UX parity, and execution pace
  separately. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-08 Feature CSS Colocation And Backlog Gate

- Allowed inputs: existing Tiding frontend CSS/build/tests, backlog,
  completion report, agent-loop prompts, and user feedback about backlog
  governance.
- Files produced: moved feature CSS from `src/frontend/styles/` into focused
  feature folders; updated `build-islands.sh`, frontend architecture guards,
  backlog policy/evidence, prompt backlog instructions, completion criteria,
  completion report, and provenance notes.
- Verification: focused frontend architecture test, frontend file-size test,
  `rtk bun run build`, `rtk git diff --check`, and targeted path checks for old
  feature CSS references.
- Notes: Closes B-003 and hardens B-022. Every user-raised point must be added
  to the backlog unless completed in the same change with evidence, and final
  completion requires a clear backlog. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Ark Tabs Settings Slice

- Allowed inputs: existing Tiding frontend source/tests/specs, dependency log,
  backlog, and completion report.
- Files produced: added a Park-shaped `TabsShell`, `tabs.css`, and an Ark UI
  Tabs hydration island; wired the Settings page through the shared tab
  boundary; bundled tab CSS; updated frontend architecture guards, dependency
  rationale, completion report, and provenance.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run build`,
  `rtk git diff --check`, and agent-browser check on local port `43345`.
- Notes: This is progress toward B-005, not closure. Browser evidence showed
  Runtime selected on load and Rendering selected after a tab click; screenshot
  saved to `/tmp/tiding-b005-settings-tabs.png`. Remaining design-system work
  must continue replacing or validating custom/native primitives where Ark/Park
  applies. No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Selection Summary

- Allowed inputs: existing Tiding designer source/tests/specs, product-story
  requirements, backlog, and completion report.
- Files produced: added a toolbar selection-summary metric, updated designer
  selection hydration to keep it in sync, and added focused architecture/admin
  page assertions.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser check
  on local port `43346`.
- Notes: This is progress toward B-012, not closure. Browser evidence confirmed
  selecting a canvas widget changes the toolbar summary from `No selection` to
  the widget label; screenshot saved to
  `/tmp/tiding-b012-selection-summary.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Designer Empty Canvas State

- Allowed inputs: existing Tiding designer source/tests/specs, product-story
  requirements, backlog, and completion report.
- Files produced: added an empty-canvas state to the designer canvas,
  feature-scoped `designer-canvas.css`, drag-over state wiring, build inclusion,
  focused tests, completion-report evidence, and provenance notes.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser check
  on local port `43347`.
- Notes: This is progress toward B-012, not closure. Browser evidence confirmed
  an empty designer screen shows `Empty screen`, still has the canvas, and has
  zero `.designerWidget` elements; screenshot saved to
  `/tmp/tiding-b012-empty-canvas.png`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Designer Keyboard Nudge

- Allowed inputs: existing Tiding designer source/tests/specs, product-story
  requirements, backlog, and completion report.
- Files produced: added focused keyboard nudge hydration for selected designer
  widgets, made the designer shell focusable after selection, reused the widget
  PATCH path, and updated focused tests plus completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser check
  on local port `43348`.
- Notes: This is progress toward B-012, not closure. Browser evidence confirmed
  ArrowRight changed a selected widget from `x=40` to `x=41` and showed
  `Widget moved`; screenshot saved to
  `/tmp/tiding-b012-keyboard-nudge.png`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Designer Snap State Sync

- Allowed inputs: existing Tiding designer source/tests/specs, product-story
  requirements, backlog, and completion report.
- Files produced: updated designer snap toggle hydration so visual
  `data-state` follows `aria-pressed` and snap behavior; updated focused tests,
  completion-report evidence, and provenance notes.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser check
  on local port `43349`.
- Notes: This is progress toward B-012, not closure. Browser evidence confirmed
  the Snap button changed from unchecked/false to checked/true and status
  `Snap on`; screenshot saved to `/tmp/tiding-b012-snap-state.png`. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Delete Empty-State Sync

- Allowed inputs: existing Tiding designer source/tests/specs, product-story
  requirements, backlog, and completion report.
- Files produced: added a focused widget-count helper, made the designer
  empty-state node persistent for client-side updates, synchronized the toolbar
  count after widget delete, and updated focused admin/source assertions plus
  completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser
  check on local port `43350`.
- Notes: This is progress toward B-012, not closure. Browser evidence confirmed
  deleting the last widget changed the toolbar to `0 widgets`, revealed
  `Empty screen`, removed all canvas widgets and active-widget rows, and set
  status `Widget deleted`; screenshot saved to
  `/tmp/tiding-b012-delete-empty-sync.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Park Segmented Control Slice

- Allowed inputs: existing Tiding frontend source/tests/specs, backlog,
  completion report, and local browser evidence.
- Files produced: added a shared Park-shaped segmented-control component and
  CSS; reused it in the shell theme picker and designer canvas tools; bundled
  the CSS; updated focused frontend/admin assertions and completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser
  check on local port `43351`.
- Notes: This is progress toward B-005, not closure. Browser evidence confirmed
  two segmented controls render, theme items expose checked/unchecked state,
  designer canvas tools expose checked/unchecked/disabled state, and
  `.parkSegmentedControl` CSS is loaded; screenshot saved to
  `/tmp/tiding-b005-segmented-control.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Park Number Field Slice

- Allowed inputs: existing Tiding frontend source/tests/specs, backlog,
  completion report, and local browser evidence.
- Files produced: added a shared Park-shaped `NumberField` wrapper to native
  controls, added design-system field label styling, replaced designer
  property-panel raw number inputs with the wrapper, and updated focused
  frontend/admin assertions plus completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, and agent-browser
  check on local port `43352`.
- Notes: This is progress toward B-005 and B-012, not closure. Browser evidence
  confirmed seven wrapped number fields render in the selected-widget property
  panel; changing X from `40` to `64` and applying updated DOM state, API state,
  and status `Properties saved`; screenshot saved to
  `/tmp/tiding-b005-number-field.png`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Medium-Model Handoff Guidance

- Allowed inputs: user feedback about switching to a medium model for token
  economy, existing agent-loop docs, backlog, completion criteria, and
  provenance policy.
- Files produced: updated overnight prompt, role prompts, completion criteria,
  backlog evidence, and this provenance entry.
- Verification: documentation diff review and `rtk git diff --check`.
- Notes: This is docs-only process hardening. The handoff now assumes
  medium-model execution by default: narrow slices, explicit checklists,
  focused checks, no broad claims from narrow evidence, and escalation for
  clean-room/legal, dependency, architecture, final-audit, or multi-page visual
  design calls. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-08 Designer Default Widget Click Add

- Allowed inputs: existing Tiding frontend/designer source, Framework widget
  registry, tests, backlog, completion report, and local browser evidence.
- Files produced: added a focused designer palette add helper, wired palette
  item clicks to create predefined/custom Framework widgets directly on the
  canvas with default dimensions/config, preserved drag/drop creation, added
  rendered `data-palette-add` markers, and updated focused tests plus
  completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`,
  `rtk bun run build:frontend`, local agent-browser click-add smoke on port
  `43353`, and BMP header/file checks for
  `/tmp/tiding-st04-click-weather.bmp`.
- Notes: This is progress toward ST-04 and B-012, not closure. Browser evidence
  confirmed clicking the default Weather palette item added one widget with the
  expected default config/size/position and rendered a non-empty `800 x 480 x 1`
  BMP; screenshot saved to `/tmp/tiding-st04-click-add-weather.png`. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Medium-Model Handoff Tightening

- Allowed inputs: user feedback about switching to a medium model for token
  economy, existing Tiding agent-loop docs, backlog, and completion criteria.
- Files produced: tightened medium-model operating guidance in the overnight
  prompt, role prompts, completion criteria, backlog evidence, and this
  provenance entry.
- Verification: documentation-only change reviewed by source inspection.
- Notes: Routine implementation, source splitting, focused tests, browser
  story evidence, backlog grooming, and completion-report updates are now
  explicitly medium-model work. Stronger-model use is reserved for documented
  escalation cases. No GPL source, templates, CSS, or exact reference layout
  were read.

### 2026-07-08 Designer Default Widget Cascade

- Allowed inputs: existing Tiding frontend/designer source, tests, completion
  report, and local browser evidence.
- Files produced: default palette click placement now cascades from the
  current canvas widget count and clamps to screen bounds; focused test
  assertions and completion evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, local
  agent-browser click-add smoke on port `43354`, API position check, screenshot
  `/tmp/tiding-st04-cascade-defaults.png`, and BMP header/file check for
  `/tmp/tiding-st04-cascade.bmp`.
- Notes: This is progress toward ST-04 and B-012, not closure. Browser evidence
  confirmed repeated default click-adds persisted distinct positions
  `64,38`, `96,70`, and `128,102` and rendered a non-empty `800 x 480 x 1`
  BMP. No GPL source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Park Settings Field Slice

- Allowed inputs: existing Tiding frontend Settings source, design-system
  source, tests, completion report, and local browser evidence.
- Files produced: added shared Park-shaped `TextField`, reused `TextField` and
  `NumberField` for Settings token, welcome, timeout, and render threshold
  inputs, updated focused tests, and updated completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser Settings smoke on port `43355`.
- Notes: This is progress toward B-005, not closure. Browser evidence confirmed
  Settings renders 3 text fields, 2 number fields, 3 select controls, and the
  GitHub token, timeout, threshold, and welcome title inputs are wrapped by the
  expected Park field scopes. Screenshot saved to
  `/tmp/tiding-b005-settings-fields.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 All Predefined Widgets Browser Evidence

- Allowed inputs: existing Tiding frontend/designer source, Framework widget
  registry, completion report, and local browser/API/render evidence.
- Files produced: completion-report evidence update only.
- Verification: `rtk bun run build:frontend`, local agent-browser designer
  smoke on port `43356`, API widget inventory check, screenshot
  `/tmp/tiding-st04-all-defaults.png`, and BMP header/file check for
  `/tmp/tiding-st04-all-defaults.bmp`.
- Notes: Browser evidence clicked every predefined Framework palette item into
  one screen, including Plugin Widget. API evidence confirmed 15 widgets with
  template IDs `1,2,3,4,6,7,8,9,10,11,12,13,14,15,16`, 15 distinct positions,
  and Plugin Widget persisted as `{"unsupported":true}`. Render evidence
  confirmed a non-empty `800 x 480 x 1` BMP. This satisfies ST-04 coverage;
  broader visual polish remains tracked by ST-20/B-012. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Park Device Field Slice

- Allowed inputs: existing Tiding frontend device source, design-system source,
  tests, completion report, and local browser evidence.
- Files produced: device registration/edit forms now reuse shared Park-shaped
  `TextField` and `NumberField`; focused source/page assertions and completion
  evidence were updated.
- Verification: focused frontend architecture test, manual device registration
  test, admin page shell test, frontend file-size test, `rtk bun x tsc
  --noEmit`, `rtk bun run build:frontend`, `rtk bun run build`, `rtk git diff
  --check`, and local agent-browser device form smoke on port `43357`.
- Notes: This is progress toward B-005 and ST-11 UI consistency, not closure.
  Browser evidence confirmed `/devices/new` renders 2 text fields and 2 number
  fields with label/MAC/width/height wrapped by the expected scopes, and
  `/devices/1` renders editable label plus disabled immutable MAC through
  `TextField`. Screenshots saved to `/tmp/tiding-b005-device-new-fields.png`
  and `/tmp/tiding-b005-device-detail-fields.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Park Screen Field Slice

- Allowed inputs: existing Tiding frontend screen source, design-system source,
  tests, completion report, and local browser evidence.
- Files produced: added shared Park-shaped `TextareaField`, reused
  `TextField`, `TextareaField`, and `NumberField` in screen create/edit forms,
  and updated focused assertions plus completion evidence.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser screen form smoke on port `43358`.
- Notes: This is progress toward B-005 and ST-02 UI consistency, not closure.
  Browser evidence confirmed `/screens/new` renders 2 text fields, 1 textarea
  field, 2 number fields, and 3 radio controls with all screen inputs wrapped
  by expected scopes; `/screens/1` reloads saved screen values through the same
  wrappers. Screenshots saved to `/tmp/tiding-b005-screen-new-fields.png` and
  `/tmp/tiding-b005-screen-edit-fields.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Park Data Source Field Slice

- Allowed inputs: existing Tiding frontend data-source source, design-system
  source, tests, completion report, and local browser evidence.
- Files produced: data-source create/edit and fetch-state forms now reuse
  shared Park-shaped `TextField`, `TextareaField`, `NumberField`,
  `SelectControl`, and `CheckboxField`; focused source/page assertions and
  completion evidence were updated.
- Verification: focused frontend architecture test, data-source POST-body form
  test, frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser data-source form smoke on port `43359`.
- Notes: This is progress toward B-005 and ST-05 UI consistency, not closure.
  Browser evidence confirmed `/data-sources/new` renders 3 text fields, 4
  textarea fields, 1 number field, 3 select controls, and 1 checkbox with key
  inputs wrapped by expected scopes; `/data-sources/1` renders 3 text fields, 5
  textarea fields, 1 number field, and wraps Test context through
  `TextareaField`. Screenshots saved to
  `/tmp/tiding-b005-source-new-fields.png` and
  `/tmp/tiding-b005-source-edit-fields.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Park Playlist Field Slice

- Allowed inputs: existing Tiding frontend playlist source, design-system
  source, tests, completion report, and local browser evidence.
- Files produced: playlist create/edit and add-screen forms now reuse shared
  Park-shaped `TextField`, `TextareaField`, `NumberField`, `SelectControl`, and
  `CheckboxField`; focused source/page assertions and completion evidence were
  updated.
- Verification: focused frontend architecture test, playlist admin workflow
  test, frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser playlist form smoke on port `43360`.
- Notes: This is progress toward B-005 and ST-09 UI consistency, not closure.
  Browser evidence confirmed `/playlists/new` renders 1 text field, 1 textarea
  field, and 1 checkbox with name/description wrapped by expected scopes;
  `/playlists/1` renders 3 number fields and 3 select controls with
  duration/order/slot wrapped by `NumberField`. Screenshots saved to
  `/tmp/tiding-b005-playlist-new-fields.png` and
  `/tmp/tiding-b005-playlist-detail-fields.png`. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Park Custom Widget Field Slice

- Allowed inputs: existing Tiding frontend custom-widget source, design-system
  source, tests, completion report, and local browser evidence.
- Files produced: saved custom-widget editor now reuses shared Park-shaped
  `TextField`, `NumberField`, and `TextareaField`; focused source/page
  assertions and completion evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser custom-widget form smoke on port `43361`.
- Notes: This is progress toward B-005 and ST-06/ST-07 UI consistency, not
  closure. Browser evidence confirmed `/custom-widgets/1` renders 1 text
  field, 2 number fields, and 3 textarea fields with name/min_width/min_height/
  template/context_schema/config wrapped by expected scopes. Screenshot saved
  to `/tmp/tiding-b005-custom-widget-fields.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Park Widget Field Slice

- Allowed inputs: existing Tiding frontend widget form source, design-system
  source, tests, completion report, and local browser evidence.
- Files produced: widget add/edit form now reuses shared Park-shaped
  `NumberField` and `TextareaField`; focused source/page assertions and
  completion evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser widget form smoke on port `43362`.
- Notes: This is progress toward B-005 and ST-03 UI consistency, not closure.
  Browser evidence confirmed `/screens/widgets/1` renders 5 number fields and
  1 textarea field with x/y/width/height/z_index/config wrapped by expected
  scopes. Screenshot saved to `/tmp/tiding-b005-widget-fields.png`. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Park Widget Sync Field Slice

- Allowed inputs: existing Tiding frontend widget Framework/context source,
  design-system source, tests, completion report, and local browser evidence.
- Files produced: Framework quick-field and placement-context panels now reuse
  shared Park-shaped `TextField`, `NumberField`, and `CheckboxField` while
  preserving hydration data attributes; focused source/page assertions and
  completion evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser widget sync-field smoke on port `43363`.
- Notes: This is progress toward B-005 and ST-03/ST-08 UI consistency, not
  closure. Browser evidence confirmed `/screens/widgets/1` keeps 23 Framework
  sync inputs and 3 context inputs, with customWidgetId/city/limit/enabled
  wrapped by text, number, and checkbox scopes as appropriate. Screenshot saved
  to `/tmp/tiding-b005-widget-sync-fields.png`. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Park Custom Widget Wizard Field Slice

- Allowed inputs: existing Tiding frontend custom-widget wizard source,
  design-system source, tests, completion report, and local browser evidence.
- Files produced: custom-widget create wizard now reuses shared Park-shaped
  `TextField` and `TextareaField` for visible authoring fields; focused
  source/page assertions and completion evidence were updated.
- Verification: focused frontend architecture test, custom-widget wizard test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser wizard form smoke on port `43364`.
- Notes: This is progress toward B-005 and ST-06 UI consistency, not closure.
  Browser evidence confirmed `/custom-widgets/new?data_source_id=1` renders 1
  text field and 3 textarea fields with name/context_schema/template/config
  wrapped by expected scopes. Screenshot saved to
  `/tmp/tiding-b005-custom-widget-wizard-fields.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Park Search And Login Field Slice

- Allowed inputs: existing Tiding frontend login, device inventory, designer
  palette, design-system source, tests, completion report, and local browser
  evidence.
- Files produced: `TextField` now supports search inputs; login PIN, device
  inventory search, and designer palette search now reuse the shared
  Park-shaped text-field wrapper while preserving palette hydration
  attributes; focused source/page assertions and completion evidence were
  updated.
- Verification: focused frontend architecture test, admin page shell test,
  optional PIN login test, frontend file-size test, `rtk bun x tsc --noEmit`,
  `rtk bun run build:frontend`, `rtk bun run build`, `rtk git diff --check`,
  and local agent-browser smoke on port `43365`.
- Notes: This is progress toward B-005 and ST-01/ST-03/ST-11 UI consistency,
  not closure. Browser evidence confirmed `/login` wraps `pin` as a password
  text field, `/devices?q=Kitchen` wraps `q` as a search text field, and
  `/screens/designer/1` wraps the palette search as a search text field.
  Screenshots saved to `/tmp/tiding-b005-login-pin-field.png`,
  `/tmp/tiding-b005-device-search-field.png`, and
  `/tmp/tiding-b005-palette-search-field.png`. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Park Designer Config Field Slice

- Allowed inputs: existing Tiding frontend designer config-panel source,
  design-system source, tests, completion report, and local browser evidence.
- Files produced: selected-widget Framework config panels now reuse shared
  Park-shaped `TextField`, `NumberField`, and `CheckboxField` while preserving
  `data-widget-config-field`; focused source/page assertions and completion
  evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser designer config-field smoke on port `43366`.
- Notes: This is progress toward B-005/B-012 and ST-03 UI consistency, not
  closure. Browser evidence confirmed a GitHub Stars widget exposes wrapped
  repo, stars, and live quick fields; selecting the widget revealed the panel
  with `owner/project`, `1234`, and checked live state. Screenshot saved to
  `/tmp/tiding-b012-designer-config-fields.png`. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Park Playlist Item Field Slice

- Allowed inputs: existing Tiding frontend playlist item row source,
  design-system source, tests, completion report, and local browser evidence.
- Files produced: playlist item edit rows now reuse shared Park-shaped
  `NumberField` for order, duration, and composer slot while preserving per-row
  form IDs and layout select; focused source/page assertions and completion
  evidence were updated.
- Verification: focused frontend architecture test, playlist admin workflow
  test, frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser playlist item-row smoke on port `43367`.
- Notes: This is progress toward B-005 and ST-09 UI consistency, not closure.
  Browser evidence confirmed `/playlists/1` row-specific `order`, `duration`,
  and `slot` inputs with `form="playlist-item-1"` are wrapped by number-field
  scopes and preserve values `2`, `45`, and `3`. Screenshot saved to
  `/tmp/tiding-b005-playlist-item-fields.png`. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 Medium Model Handoff Tightening

- Allowed inputs: user feedback about switching to a medium model for token
  economy, existing Tiding agent-loop docs, backlog, and completion criteria.
- Files produced: tightened entry-point, coordinator, reviewer, finalizer, and
  completion-gate guidance so routine work defaults to medium-model slices with
  concrete resume handoffs and stronger-model escalation only for documented
  hard calls.
- Verification: docs-only `rtk git diff --check`.
- Notes: This is process/spec guidance only. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Park Screen Package Field Slice

- Allowed inputs: existing Tiding frontend screen package dialog source,
  design-system source, tests, completion report, and local browser evidence.
- Files produced: screen import/export package dialogs now reuse shared
  Park-shaped `TextareaField` while preserving import package and copy-source
  wiring; focused source/page assertions and completion evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun x tsc --noEmit`, `rtk bun run
  build:frontend`, `rtk bun run build`, `rtk git diff --check`, and local
  agent-browser screen package dialog smoke on port `43368`.
- Notes: This is progress toward B-005 and ST-02 UI consistency, not closure.
  Browser evidence confirmed `/screens` wraps the import package textarea and
  `/screens/designer/1` wraps the export copy textarea. Screenshots saved to
  `/tmp/tiding-b005-screen-import-field.png` and
  `/tmp/tiding-b005-screen-export-field.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Designer Canvas Bounds Slice

- Allowed inputs: existing Tiding frontend designer source, product stories,
  tests, completion report, and local browser evidence.
- Files produced: designer canvas now renders explicit origin, width, height,
  and max-corner bounds markers with feature-scoped CSS; focused assertions and
  completion evidence were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, local agent-browser designer smoke on port `43369`,
  `rtk bun x tsc --noEmit`, `rtk bun run build:frontend`, `rtk bun run build`,
  and `rtk git diff --check`.
- Notes: This is progress toward B-012/ST-03 canvas affordance quality, not
  closure. Browser evidence confirmed labels `0,0`, `800px`, `480px`, and
  `800,480` on `/screens/designer/1`; screenshot saved to
  `/tmp/tiding-b012-canvas-bounds.png`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Designer Save Layout Slice

- Allowed inputs: existing Tiding frontend designer source, product stories,
  tests, completion report, and local browser evidence.
- Files produced: toolbar `Save Layout` now delegates to the selected widget
  property apply action when a widget is selected, and reports an already-saved
  state when nothing is selected; focused assertions and completion evidence
  were updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, local agent-browser
  designer smoke on port `43370`, `rtk bun x tsc --noEmit`, `rtk bun run
  build`, and `rtk git diff --check`.
- Notes: This is progress toward B-012/ST-03 designer save behavior, not
  closure. Browser evidence selected widget `1`, changed property `x` from `40`
  to `96`, clicked `Save Layout`, observed `Properties saved`, and confirmed
  `/api/screen-designs/1/widgets` persisted `x=96`. Screenshot saved to
  `/tmp/tiding-b012-save-layout-apply.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Designer Grid Toggle Slice

- Allowed inputs: existing Tiding frontend designer source, product stories,
  tests, completion report, and local browser evidence.
- Files produced: Grid toolbar item now exposes `data-grid-toggle`, toggles
  designer shell grid state, updates pressed/checked state and status text, and
  hides the canvas grid through feature-scoped CSS.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, local agent-browser
  designer smoke on port `43371`, `rtk bun x tsc --noEmit`, `rtk bun run
  build`, and `rtk git diff --check`.
- Notes: This is progress toward B-012/ST-03 canvas tool affordance quality,
  not closure. Browser evidence confirmed Grid starts checked with grid
  background CSS, then toggles to `data-grid=false`, `data-state=unchecked`,
  `aria-pressed=false`, status `Grid off`, and canvas `background-image: none`.
  Screenshot saved to `/tmp/tiding-b012-grid-toggle.png`. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Mobile Stage Order Slice

- Allowed inputs: existing Tiding frontend designer source, completion
  criteria, tests, completion report, and local mobile browser evidence.
- Files produced: added feature-scoped designer responsive CSS and bundled it
  so narrow screens order the stage before palette and inspector while keeping
  designer CSS files under the 150-line frontend gate.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, local agent-browser
  mobile designer smoke on port `43372` at `390x844`, `rtk bun x tsc
  --noEmit`, `rtk bun run build`, and `rtk git diff --check`.
- Notes: This is progress toward B-012/ST-03/ST-20 mobile designer usability,
  not closure. Browser evidence confirmed no horizontal overflow, grid order
  `designerStage`, `designerPalette`, `designerInspector`, and fitting
  toolbar/canvas viewport widths. Screenshot saved to
  `/tmp/tiding-b012-designer-mobile-stage-first.png`. No GPL source,
  templates, CSS, or exact reference layout were read.

### 2026-07-08 Execution Pace Backlog Closure

- Allowed inputs: existing Tiding backlog, completion report, agent-loop
  prompts, and clean-room provenance entries.
- Files produced: moved B-021 to Done and recorded completion-report evidence
  that current slices use focused tests, batched compatible gates, and
  story/page browser evidence without manual Biome loops.
- Verification: `rtk rg` over backlog, completion report, prompts, and
  provenance for execution-pace evidence; docs-only `rtk git diff --check`.
- Notes: This closes the process backlog item only. It does not close B-005,
  screen-designer UX parity, or final product completion. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 Design System Backlog Closure

- Allowed inputs: existing Tiding frontend design-system/designer source,
  tests, dependency log, backlog, completion report, and local browser
  evidence.
- Files produced: `ButtonLink` now accepts normal anchor attributes, the
  designer Configure action now uses `ButtonLink` instead of route-local button
  classes, B-005 was moved to Done, and completion evidence was updated.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, source audit for raw visible controls, `rtk bun x
  tsc --noEmit`, `rtk bun run build:frontend`, local agent-browser designer
  action smoke on port `43373`, `rtk bun run build`, and `rtk git diff
  --check`.
- Notes: This closes B-005 at the design-system contract level: Ark islands
  cover Accordion, Dialog, and Tabs; visible controls use Park-shaped shared
  primitives; remaining route-level raw inputs are hidden form plumbing.
  Browser evidence confirmed the selected designer Configure action keeps
  `/screens/widgets/1` wiring and carries `data-park-variant="surface"`.
  Screenshot saved to `/tmp/tiding-b005-designer-configure-link.png`. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 Designer Parity Backlog Closure

- Allowed inputs: existing Tiding frontend designer source/tests/specs,
  completion report, backlog, public browser behavior of local reference
  `http://localhost:3337/screens/designer/1` after PIN login, and local Tiding
  browser evidence on port `43374`.
- Files produced: fixed initial designer hydration status so default zoom setup
  keeps status `Ready` until the operator changes zoom; moved B-012 to Done;
  updated ST-03 to Satisfied and recorded fresh desktop/mobile/reference
  screenshots.
- Verification: focused frontend architecture test, admin page shell test,
  frontend file-size test, `rtk bun run build:frontend`, reference browser
  smoke and screenshot on `3337`, local desktop/mobile browser smoke on
  `43374`, `rtk bun x tsc --noEmit`, `rtk bun run build`, and `rtk git diff
  --check`.
- Notes: Closes B-012/ST-03 designer workflow parity. The broader full-product
  and all-page UX audit remains tracked by ST-20 and the overall completion
  criteria. Browser evidence confirmed reference workflow markers and local
  grouped/searchable palette, canvas bounds, Grid/Snap/Draw, zoom, Ready status,
  active widgets, selected-widget editing, Save Layout, Render BMP, desktop
  fit, and mobile no-overflow/stage-first layout. Screenshots saved to
  `/tmp/inker-reference-designer-current.png`,
  `/tmp/tiding-b012-designer-current-desktop.png`, and
  `/tmp/tiding-b012-designer-current-mobile.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 Medium-Model Prompt Hardening

- Allowed inputs: existing Tiding agent-loop docs, backlog, completion criteria,
  and user feedback that the remaining work should run on a medium model for
  token economy.
- Files produced: hardened medium-model operating rules in the README,
  overnight prompt, role prompts, completion criteria, and B-023 backlog
  evidence.
- Verification: docs-only `rtk git diff --check`.
- Notes: This is process documentation only. The update requires broad work to
  be split into story-sized slices, adds an explicit
  Done/Verified/Not verified/Next slice/Escalate-if resume packet, and blocks
  unsupported polish or percentage claims from lower-quality agents. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-08 ST-01 Login Shell Evidence

- Allowed inputs: existing Tiding auth/shell/dashboard source, product stories,
  completion report, and local browser/API evidence.
- Files produced: completion report ST-01 status and evidence update only.
- Verification: configured-PIN smoke on local port `43377`; unauthenticated
  `/dashboard` redirect check; unauthenticated `/api/screen-designs` `401`
  check; desktop browser login/dashboard screenshots; mobile `390x844`
  login/dashboard overflow checks; docs-only `rtk git diff --check`.
- Notes: Closes ST-01 evidence gap. Browser evidence covered `/login`, UI PIN
  login with `1111`, dashboard navigation, quick actions, dashboard cards,
  theme controls, status panel, logout, and mobile no-overflow. Screenshots
  saved to `/tmp/tiding-st01-current-login-desktop.png`,
  `/tmp/tiding-st01-current-dashboard-desktop.png`,
  `/tmp/tiding-st01-current-login-mobile.png`, and
  `/tmp/tiding-st01-current-dashboard-mobile.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 ST-02 Screen Management Evidence

- Allowed inputs: existing Tiding screen-management source, product stories,
  completion report, tests, and local browser/API evidence.
- Files produced: completion report ST-02 status and evidence update only.
- Verification: configured-PIN browser story on local port `43378`; screen
  create form with standard/portrait/custom resolution choices; custom
  `640x384` create and edit reload; `/screens` inventory thumbnail/status/action
  check; authenticated export package fetch; import dialog submission;
  imported designer redirect; delete confirmation marker check; deliberate
  imported-row delete; mobile `390x844` `/screens` no-overflow check;
  docs-only `rtk git diff --check`.
- Notes: Closes ST-02 evidence gap. Screenshots saved to
  `/tmp/tiding-st02-current-edit-desktop.png`,
  `/tmp/tiding-st02-current-inventory-desktop.png`,
  `/tmp/tiding-st02-current-imported-inventory-desktop.png`, and
  `/tmp/tiding-st02-current-inventory-mobile.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 ST-05 Data Source Evidence

- Allowed inputs: existing Tiding data-source source/tests, product stories,
  completion report, and local browser/API evidence.
- Files produced: completion report ST-05 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "data source"`;
  configured-PIN browser story on local port `43379`; create/edit form field
  check; context Test URL fetch; cache preview check; list redaction and
  no-secret check; active toggle off/on; Test All visible-error check; previous
  cache preservation check; delete check; docs-only `rtk git diff --check`.
- Notes: Closes ST-05 evidence gap. Focused tests prove GET, POST, stored POST
  body, context placeholders, RSS/Atom normalization, JSON path extraction,
  missing-path/timeout failure handling, cache preservation, screen invalidation,
  local-network blocking, and MCP data-source fetch reuse. Browser evidence
  covered the operator UI. Screenshots saved to
  `/tmp/tiding-st05-current-editor-before-test.png`,
  `/tmp/tiding-st05-current-editor-after-test.png`,
  `/tmp/tiding-st05-current-overview-desktop.png`,
  `/tmp/tiding-st05-current-error-preserves-cache.png`, and
  `/tmp/tiding-st05-current-empty-after-delete.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 ST-11 Device Inventory Evidence

- Allowed inputs: existing Tiding device source/tests, product stories,
  completion report, and local browser/API evidence.
- Files produced: completion report ST-11 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "device"`;
  configured-PIN browser story on local port `43380`; device grid/list/search
  and inactive-filter checks; detail facts/logs/current-screen/assignment
  checks; authenticated `/api/display` playlist and unassigned checks; label
  edit with disabled MAC check; mobile `390x844` no-overflow check; delete
  confirmation and empty-list check; docs-only `rtk git diff --check`.
- Notes: Closes ST-11 evidence gap. Focused tests prove setup, redacted device
  DTOs, assignments/log endpoints, playlist assignment/unassignment, display
  assigned-screen and playlist fallback, unknown/inactive/blocked device states,
  and MCP device workflow. Screenshots saved to
  `/tmp/tiding-st11-devices-grid.png`, `/tmp/tiding-st11-devices-list.png`,
  `/tmp/tiding-st11-device-detail.png`,
  `/tmp/tiding-st11-device-unassigned.png`,
  `/tmp/tiding-st11-device-renamed.png`,
  `/tmp/tiding-st11-device-mobile.png`, and
  `/tmp/tiding-st11-devices-empty-after-delete.png`. No GPL source, templates,
  CSS, or exact reference layout were read.

### 2026-07-08 ST-15 Rendering Settings Evidence

- Allowed inputs: existing Tiding settings/rendering source/tests, product
  stories, completion report, and local browser/API evidence.
- Files produced: completion report ST-15 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "render|settings|server status|BMP"`;
  configured-PIN browser story on local port `43381`; Rendering tab control
  check; render setting save/reload persistence check; render-preview BMP
  header check; Default action check; server-status refresh check;
  troubleshooting expansion check; mobile `390x844` no-overflow check;
  docs-only `rtk git diff --check`.
- Notes: Closes ST-15 evidence gap. Focused tests prove persisted e-ink
  settings feed BMP rendering, BMP headers are 1-bit, setup/custom/render
  previews are BMP, and settings shell exposes the required rendering/status
  controls. Browser evidence covered the operator UI. Screenshots saved to
  `/tmp/tiding-st15-rendering-tab.png`,
  `/tmp/tiding-st15-rendering-troubleshooting.png`, and
  `/tmp/tiding-st15-rendering-mobile.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 ST-13 Welcome Settings Evidence

- Allowed inputs: existing Tiding welcome settings source/tests, product
  stories, completion report, and local browser/API evidence.
- Files produced: completion report ST-13 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "welcome settings|welcome"`;
  configured-PIN browser story on local port `43382`; Welcome tab control
  check; save/reload persistence check; compact draft BMP header check;
  regenerate confirmation and generated artifact check; new-device
  auto-assignment check; reset confirmation/default restoration check; mobile
  `390x844` no-overflow check; docs-only `rtk git diff --check`.
- Notes: Closes ST-13 evidence gap. Focused tests prove regenerate creates the
  expected compact BMP-backed welcome screen/playlist and assigns only new or
  unassigned devices. Browser evidence covered the operator UI. Screenshots
  saved to `/tmp/tiding-st13-welcome-tab.png`,
  `/tmp/tiding-st13-welcome-persisted.png`,
  `/tmp/tiding-st13-welcome-regenerated.png`,
  `/tmp/tiding-st13-welcome-device.png`, and
  `/tmp/tiding-st13-welcome-mobile.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 ST-14 Security Settings Evidence

- Allowed inputs: existing Tiding security settings/source tests, product
  stories, completion report, and local browser/API evidence.
- Files produced: completion report ST-14 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "security settings|GitHub Stars"`;
  configured-PIN browser story on local port `43383`; Security tab control
  check; token save/redaction check; settings API no-secret check;
  local-network policy toggle check; localhost data-source block check; visible
  error check; mobile `390x844` no-overflow/no-secret check; docs-only
  `rtk git diff --check`.
- Notes: Closes ST-14 evidence gap. Focused tests prove GitHub token test
  redaction, local-network blocking, and GitHub Stars using the saved token
  without rendering it. Browser evidence covered the operator UI and visible
  security states. Screenshots saved to `/tmp/tiding-st14-security-initial.png`,
  `/tmp/tiding-st14-security-redacted.png`,
  `/tmp/tiding-st14-blocked-source.png`, and
  `/tmp/tiding-st14-security-mobile.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-08 Medium-Model Playbook Tightening

- Allowed inputs: user feedback about switching to a medium model for token
  economy, existing Tiding agent-loop docs, backlog, and completion criteria.
- Files produced: `docs/agent-loop/medium-model-playbook.md`, plus links and
  gate updates in README, overnight prompt, role prompts, completion criteria,
  backlog evidence, and this provenance entry.
- Verification: documentation diff only; no runtime behavior changed.
- Notes: The medium-model path now has a mechanical checklist, verification
  ladder, documentation duties, handoff packet, and explicit stronger-model
  escalation rules. No GPL source, templates, CSS, or exact reference layout
  were read.

### 2026-07-08 ST-19 Compatibility Fixture Evidence

- Allowed inputs: existing Tiding compatibility fixture, compatibility tests,
  product stories, completion report, and local browser/API/BMP evidence.
- Files produced: completion report ST-19 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "copied Inker database"`;
  configured-PIN browser story on local port `43384` using copied fixture
  `/tmp/tiding-st19-browser.sqlite`; dashboard row check; rendered admin page
  checks for `/screens`, `/screens/1`, `/screens/designer/1`, `/data-sources`,
  `/custom-widgets`, `/devices`, `/devices/3`, `/playlists`, `/playlists/1`,
  and `/settings` Compatibility; no-horizontal-overflow checks; authenticated
  browser API checks for `/api/schema`, `/api/screen-designs/1/preview`, and
  `/api/display` with fixture `HTTP_ID`; cached BMP header check for
  `/tmp/tiding-st19-cache/screen-1.bmp`; server stopped and port `43384`
  cleared.
- Notes: Closes ST-19 evidence gap. Browser evidence proved existing screens,
  designer widgets, data sources, custom widgets, device state, playlist items,
  settings compatibility report, and copied-fixture BMP display output remain
  usable without destructive migration. Screenshots saved to
  `/tmp/tiding-st19-screens.png`, `/tmp/tiding-st19-designer.png`,
  `/tmp/tiding-st19-data-sources.png`,
  `/tmp/tiding-st19-custom-widgets.png`, `/tmp/tiding-st19-devices.png`,
  `/tmp/tiding-st19-playlists.png`, and
  `/tmp/tiding-st19-compatibility-settings.png`. No GPL source, templates, CSS,
  or exact reference layout were read.

### 2026-07-08 ST-18 MCP Automation Evidence

- Allowed inputs: existing Tiding MCP source/tests, rendering-and-MCP spec,
  product stories, completion report, and local focused test output.
- Files produced: completion report ST-18 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "mcp"`; local tool
  metadata extraction from `src/mcp/tools.ts`.
- Notes: Closes ST-18 evidence gap. Focused tests prove MCP disabled-by-default
  config, 35 story-mapped tools with `ST-18` metadata, screen/widget/data-source
  lifecycle calls, custom-widget preview, playlist composition, device
  inventory/assignment/log workflows, data-source fetch/cache invalidation,
  render-preview metadata, HTTP-compatible validation errors, and JSON-RPC
  stdio initialize/list/call behavior. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 ST-16 Firmware Update Evidence

- Allowed inputs: existing Tiding firmware/device source tests, product
  stories, completion report, and local browser/API evidence.
- Files produced: completion report ST-16 status and evidence update only.
- Verification: focused `rtk bun test tests/db.test.ts -t "firmware"`; seeded
  `/tmp/tiding-st16.sqlite` through `DatabaseService`; configured-PIN browser
  story on local port `43385`; device list and detail UI checks; update and
  updates-disabled filter checks; authenticated browser API checks for
  `/api/firmware`, `/api/firmware/1`, and `/api/display` with update-current-
  newer firmware headers; SQLite persisted telemetry check; cached BMP header
  check for `/tmp/tiding-st16-cache/screen-1.bmp`; server stopped and port
  `43385` cleared.
- Notes: Closes ST-16 evidence gap. Browser evidence proved update available,
  current, and updates-disabled UI states. API evidence proved update signaling
  only for a valid newer stable artifact and no update for current or newer
  reported firmware. Screenshots saved to `/tmp/tiding-st16-devices.png` and
  `/tmp/tiding-st16-device-detail.png`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 ST-20 UX Evidence And Gaps

- Allowed inputs: existing Tiding frontend, completion report, backlog, product
  stories, copied compatibility fixture, and local browser screenshots.
- Files produced: ST-20 completion-report evidence update, backlog entries
  B-024/B-025/B-026, and this provenance entry.
- Verification: configured-PIN browser review on local port `43386` using
  copied fixture `/tmp/tiding-st20-browser.sqlite`; desktop `1280x900` and
  mobile `390x844` screenshots for dashboard, screens, designer, data sources,
  custom widgets, devices, playlists, plugins, extensions, and settings;
  no-horizontal-overflow checks for every captured page; console/error check;
  server stopped and port `43386` cleared.
- Notes: ST-20 remains partial. Evidence improved from "missing page-by-page
  review" to concrete visual findings: mobile admin navigation consumes too
  much first-viewport space, dense mobile table content is hard to read, and
  designer canvas labels/toolbar controls can clip or feel cramped. Screenshots
  saved under `/tmp/tiding-st20-desktop-*.png` and
  `/tmp/tiding-st20-mobile-*.png`. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-08 ST-20 UX Fixes And Closure

- Allowed inputs: existing Tiding frontend CSS/components, ST-20 evidence from
  local browser review, backlog items B-024/B-025/B-026, completion report, and
  copied compatibility fixture.
- Files produced: compact mobile shell CSS, mobile table-scroll CSS, designer
  canvas label/toolbar CSS, updated backlog evidence, completion report, and
  this provenance entry.
- Verification: focused `rtk bun test tests/db.test.ts -t "admin frontend source files stay below|admin frontend stays JSX"`;
  `rtk bun run build:frontend`; configured-PIN browser review on local port
  `43388` using copied fixture `/tmp/tiding-st20-fix.sqlite`; desktop
  `1280x900` and mobile `390x844` screenshots for dashboard, screens,
  designer, data sources, custom widgets, devices, playlists, plugins,
  extensions, and settings; no-horizontal-overflow checks for every captured
  page; mobile nav height `95px`; internal panel scrolling for dense mobile
  tables; mobile designer labels with `scrollWidth <= clientWidth`; console
  error check; server stopped and port `43388` cleared.
- Notes: Closes ST-20 plus B-024/B-025/B-026. The changes preserve the existing
  Park-shaped controls and direct-manipulation designer while making mobile
  operational pages usable in the first viewport. Screenshots saved under
  `/tmp/tiding-st20-final-desktop-*.png` and
  `/tmp/tiding-st20-final-mobile-*.png`. No GPL source, templates, CSS, or
  exact reference layout were read.

### 2026-07-09 Medium-Model Late-Stage Guidance

- Allowed inputs: user feedback about switching to a medium model for token
  economy, existing medium-model playbook, completion criteria, backlog, and
  completion report.
- Files produced: tightened medium-model playbook, agent-loop README,
  completion criteria, backlog evidence, and this provenance entry.
- Verification: source inspection of the existing agent-loop docs and current
  story baseline.
- Notes: The docs now direct cheaper models toward narrow verification-first
  slices for ST-10 and ST-12 physical device evidence, and away from broad
  architecture, dependency, or UI replanning unless a concrete failing proof
  requires it. No GPL source, templates, CSS, or exact reference layout were
  read.

### 2026-07-09 Device HTTP Verification Helper

- Allowed inputs: existing Tiding public setup/display handlers, ST-10/ST-12
  product story gaps, completion report, and package scripts.
- Files produced: `tools/verify-device-http.ts`, `verify:device-http` package
  script, README usage note, completion-report evidence update, and this
  provenance entry. Runtime route ordering now handles public device APIs before
  admin-page redirects when PIN auth is enabled.
- Verification: local disposable-server run of `bun run verify:device-http`
  against `/api/setup`, `/api/setup-screen.bmp`, `/api/display`, and the
  returned display BMP; focused device/display tests; `rtk bun run
  build:server`; `rtk git diff --check`.
- Notes: The helper uses only public HTTP endpoints, redacts setup API keys in
  `evidence.json`, validates 1-bit two-color BMP headers, non-empty pixel data,
  setup/display dimensions, and display telemetry query parameters, and can be
  rerun against a Pi or physical device-facing URL for the remaining
  ST-10/ST-12 evidence. No GPL source, templates, CSS, or exact reference
  layout were read.

### 2026-07-09 CSS Packaging Decision

- Allowed inputs: existing frontend build script, source-quality tests,
  completion criteria, frontend spec, completion report, and current focused CSS
  file layout.
- Files produced: CSS packaging decision, completion criteria/frontend spec
  wording, completion-report gap update, and this provenance entry.
- Verification: source inspection of `build-islands.sh`, frontend style files,
  and existing source-quality tests.
- Notes: Closes the stale non-physical CSS packaging audit. Tiding keeps the
  lightweight focused CSS bundle path and explicitly defers generated scoped
  CSS Modules unless a measured collision or ownership issue appears. No GPL
  source, templates, CSS, or exact reference layout were read.

### 2026-07-09 Physical Device Verification Runbook

- Allowed inputs: product story gaps for ST-10/ST-12, existing
  `verify:device-http` helper, completion criteria, completion report, and
  agent-loop docs.
- Files produced: `docs/agent-loop/physical-device-verification.md` plus links
  from agent-loop README, medium-model playbook, completion criteria,
  completion report, and this provenance entry.
- Verification: source inspection and documentation link checks.
- Notes: This does not close ST-10 or ST-12 by itself. It makes the remaining
  physical TRMNL/captive-portal evidence executable and defines the exact proof
  required before final completion. No GPL source, templates, CSS, or exact
  reference layout were read.

### 2026-07-10 Real-Data Designer And Navigation UX

- Allowed inputs: the user's screenshots and direct feedback about widget
  discoverability, icon quality, flat/gradient styling, designer manipulation,
  widget layering, navigation flash, render quality, and the requested restrained
  old-Mac/DOS-inspired visual direction; existing Tiding source and docs; the
  copied Inker database as factual compatibility data; and live black-box
  workflow observation of the user-authored reference application.
- Files produced: Lucide-backed design-system icons, restrained no-gradient
  feature styles, compact screen details, per-widget designer previews, layer
  controls, persistent page-outlet navigation, native-size render defaults,
  TypeScript 7 quality-gate configuration, tests, and completion evidence.
- Verification: `rtk bun run typecheck`, `rtk bun run lint`, `rtk bun test`,
  `rtk bun run build`, `rtk git diff --check`, live BMP header/dimension checks,
  and desktop/mobile browser automation against the populated local runtime on
  port `43337`.
- Notes: No Inker frontend source, templates, CSS, or exact layout was read or
  copied. Rendering reuse is recorded separately in the dirty-room log and is
  limited to the user-authorized Takumi/framework boundary.

### 2026-07-10 Persistent Shell Dogfood Fixes

- Allowed inputs: user feedback that the sidebar must remain stable without a
  white navigation flash, the existing Tiding runtime and docs, and black-box
  browser behavior observed against a disposable copy of the real database.
- Files produced: form-aware shell navigation, destination focus and status
  handling, a native mobile Menu disclosure using an individually imported
  Lucide icon, responsive designer inspector ordering, isolated GitHub fetch
  injection for deterministic tests, focused CSS, tests, backlog updates, and
  completion evidence.
- Verification: four-issue dogfood report with repro screenshots/videos under
  `/tmp/tiding-dogfood-july10/`; copied-DB live retest on port `43390` covering
  Settings save, screen create/delete, keyboard navigation, every mobile menu
  destination, and selected-widget mobile layout; repeated full-suite runs;
  typecheck; lint; production build; and diff hygiene.
- Notes: No Inker frontend source, templates, CSS, or exact layout was read or
  copied. The fixes use native browser form/details/history behavior and the
  existing Tiding outlet/island boundary.

### 2026-07-10 Production Bundle And Static Delivery

- Allowed inputs: the user's requirement to keep the server fast and simple,
  existing Tiding build/runtime code, local black-box HTTP timing against Inker,
  and browser behavior from the live Tiding runtime.
- Files produced: Bun-native production island build, precompressed JS/CSS
  artifacts, focused static-asset response boundary with gzip negotiation and
  ETag revalidation, static delivery tests, backlog entry, and completion
  evidence.
- Verification: bundle raw/gzip byte counts; live gzip headers and conditional
  `304`; read-only 50-request `/api/firmware` comparison; live production-mode
  Ark Dialog, Ark Tabs, designer selection, persistent navigation, and mobile
  menu checks; zero browser console errors; 96 tests; typecheck; lint;
  production build; and diff hygiene.
- Notes: A manual `process.env.NODE_ENV` define was rejected after browser
  verification exposed a JSX development-transform/runtime mismatch. Bun's
  native `--production` flag is the verified configuration because it keeps
  JSX compilation and the React runtime consistent. No GPL source was read.

### 2026-07-13 Raspberry Pi In-Place Trial

- Allowed inputs: the user-authorized live Raspberry Pi and SSH access, current
  Tiding source and docs, the user-owned live SQLite database as compatibility
  data, public npm packages already named in the lockfile, and black-box HTTP,
  BMP, process, systemd, and browser behavior.
- Files produced: production JSX helper binding fix, regression test, live
  ARM64 release, repeatable RPi packager, existing-device setup-assignment fix,
  rollback snapshots, HTTP/BMP evidence, screenshots, and this completion
  evidence update.
- Verification: local typecheck, lint, focused and full tests; ARM64 compile and
  SHA-256 comparison; isolated Pi startup/render on port `43338`; in-place
  systemd restart; live `/api/health`, `/api/version`, admin, designer, device,
  and BMP checks; browser hydration and console checks; SQLite `quick_check`;
  process CPU, memory, swap, thread, descriptor, size, and latency snapshots.
- Notes: No Inker source, frontend templates, or CSS were read. The live Inker
  directory was treated only as an operational rollback artifact and the live
  database as factual user-owned compatibility data. Verifier-only Welcome
  rows, assignment, telemetry, and log changes were identified by comparison
  with the preserved database and reversed before the final setup-only check.
  ST-10/ST-12 remain open for physical captive-portal/display proof despite the
  successful LAN HTTP verifier run.

### 2026-07-14 Render Clarity, Live Context, And Lazy Islands

- Allowed inputs: user screenshots and feedback, current Tiding source and
  tests, the user-owned live SQLite data, black-box Takumi output, the existing
  approved Lucide package, and the live Raspberry Pi HTTP/runtime boundary.
- Files produced: device-specific content-hashed render cache variants, live
  clock/date/battery/WiFi context, size-aware display font selection, scalable
  DejaVu fallback with license, strict JSX SVG attribute and namespace
  normalization, a render-safe Lucide `Icon` helper, cached SVG/chunk delivery,
  and page-scoped Ark/designer/DOM island chunks.
- Verification: red/green regressions for live context, device cache variants,
  SVG normalization, display font selection, opaque screen backgrounds, atomic
  cache publication, and lazy-island architecture; 108 passing tests;
  typecheck; lint; production and ARM64 package builds; browser Dashboard to
  Screens to Designer navigation with the same persistent shell; and no browser
  errors. Live device-specific 800x480x1 BMPs proved the icon and typography
  improvements but also exposed an intermittent ARM64 black-frame defect.
- Notes: Dashboard loads a 2,233-byte gzip entry plus a 4,686-byte shared gzip
  chunk and no React/Ark or interact code. The live Room Air path required an
  SVG namespace in addition to kebab-case attributes; this was diagnosed from
  the rendered HTML and Takumi output, not copied from another implementation.
  The local follow-up retains font buffers referenced by the cached native
  renderer, but physical verification is deferred while development is away
  from the Pi; no final-device claim is made for this slice.

### 2026-07-14 Device Detail Live Preview And Local Time

- Allowed inputs: user screenshot and feedback, current Tiding source and tests,
  and the user-owned local compatibility database.
- Files produced: sticky desktop navigation, a fresh device-context BMP route,
  device preview wiring, configured-timezone formatting, Raspberry Pi environment
  example, regression tests, and documentation.
- Verification: red/green tests under a UTC host timezone; a deliberately stale
  shared BMP was ignored; browser evidence showed local-time logs; and the live
  800x480 monochrome BMP showed the current clock and weather icon.
- Notes: No external implementation source was used.

### 2026-07-14 Takumi V2 And Bold Glyph Clarity

- Allowed inputs: the user's 800x480 rendering screenshot and direct feedback,
  current Tiding source/tests, the user-owned local compatibility database, and
  Takumi's public v2 documentation and package type declarations.
- Files produced: Takumi v2 dependency/lock updates, v2 renderer font
  registration, native-size TRMNL12/16/21 selection with scalable fallbacks,
  focused font regressions, and documentation updates.
- Verification: 115 passing tests, typecheck, server build, repeated identical
  800x480x1 BMP renders, and visual comparison of scaled TRMNL, Geist-first, and
  native-strike TRMNL candidates using the exact reported screen composition.
- Notes: No Inker source, frontend templates, CSS, or application structure was
  read or copied for this migration. Physical-device acceptance remains open.
