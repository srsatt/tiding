# Frontend Spec

The frontend is a lightweight admin UI for managing screen designs, widgets,
custom widgets, data sources, and previews.

## Technology

- Preact for islands.
- Server-rendered Preact JSX for page markup; do not build admin pages as raw
  concatenated HTML strings.
- Frontend source must be split into small files. No hand-written file under
  `src/frontend/` may exceed 150 logical lines of code. Split route modules,
  page sections, form components, data mappers, and browser islands before a
  file becomes hard to scan.
- Takumi-bound setup and screen-render documents should also be assembled with
  JSX/render-to-string instead of ad hoc document template strings. Inject
  custom widget HTML only at the narrow custom-widget boundary after escaping or
  framework rendering.
- Park UI (`https://park-ui.com/`) is the first frontend implementation
  priority. Establish the Park-compatible design-system layer before deeper page
  rewrites so controls, tokens, and themes do not need to be replaced later.
  Use Park component semantics, variants, sizing, and theme tokens for buttons,
  cards, forms, tables, dialogs, selects, tabs, menus, tooltips, and badges.
  Raw page-level CSS is not a design system. New UI should be built from shared
  Ark/Park-backed components and styled through component-scoped CSS modules or
  generated Park/Panda styles, not one-off global selectors.
- Ark UI (`https://ark-ui.com/`) is the project-wide headless component
  primitive library, not just a Collapsible dependency. Use Ark components for
  dialogs, menus, selects, tabs, accordions/collapsibles, tooltips, toggles,
  radio groups, switches, segmented controls, and other interactive controls
  instead of hand-rolling custom UI behavior.
- Park UI sits on top of Ark UI after license/dependency review. Use it to reach
  a coherent production-quality admin UI faster when it fits the
  Bun/Preact/React island architecture.
- Theme choice must persist across page loads without flashing the default
  theme. The server-rendered shell should read a theme cookie when available,
  the client island should update that cookie and any local mirror, and any
  bootstrap needed before first paint must be tiny and deterministic.
- Use a tree-shakable, permissively licensed SVG icon library such as Lucide.
  Import individual icons only; do not ship whole icon packs, icon fonts,
  remote sprite sheets, or multi-megabyte icon bundles. Icon buttons must have
  accessible labels/tooltips.
- Server-prerendered HTML for page shells and initial data.
- Admin page routing must be expressed as route definitions/handlers backed by
  `preact-iso` route matching, not a growing `if`/`else` switch or custom
  path-regex router that directly renders every page from one file.
- CSS modules for admin page styling. They must be handled by the build/bundler
  path or generated mechanically by it; do not maintain hand-written
  `*.module.ts` class-map files.
- Wrap visible UI strings with an i18n marker such as `ttag` so later
  translation extraction does not require rewriting the page layer.
- Avoid bespoke UI framework code. Local CSS modules should style and compose
  the chosen Ark/Park primitives rather than replacing them.
- Keep the project pragmatic and lightweight, not framework-averse. Mature
  focused libraries are allowed when they make code smaller, clearer, and more
  reliable without materially hurting startup, render latency, bundle size, or
  Raspberry Pi runtime behavior. `preact-iso`
  (`https://preactjs.com/guide/v10/preact-iso/`) is an acceptable candidate for
  routing, route utilities, hydration/prerender helpers, and route-level code
  splitting if it reduces hand-written routing/page glue. `interact.js`
  (`https://interactjs.io/`) is the preferred lightweight DOM interaction layer
  for designer drag, resize, restrict, snap, and gesture behavior.
- Do not hand-write framework substitutes when a small, well-maintained library
  solves the problem with less code and lower maintenance risk.

## Frontend Architecture

Keep the frontend small, but not flat. Organize code by responsibility:

- `src/frontend/design-system/`: shared Ark/Park-backed components, tokens,
  icon wrappers, theme utilities, and form-control primitives.
- `src/frontend/features/<feature>/`: domain UI for screens, designer,
  data sources, custom widgets, devices, playlists, and settings.
- `src/frontend/routes/`: route-level composition only; route files should load
  data and assemble feature components, not own large forms or workflows.
- `src/frontend/islands/` or focused island files: hydration entrypoints with
  one responsibility each.
- `src/frontend/shared/`: formatting, DTO mappers, and small framework-agnostic
  helpers.

Do not treat `src/frontend/` as a dumping ground. Reusable controls belong in
the design-system layer; repeated domain UI belongs in feature folders. A route
file that grows because it owns tables, forms, toolbar logic, and dialogs must
be split before more behavior is added.

## Pages

Implement:

- `/` redirects to or renders the screen design list.
- `/screens` lists screen designs and render status.
- `/screens/:id` edits widgets and shows preview.
- `/devices` lists TRMNL devices and telemetry.
- `/devices/:id` shows read-only device state, screen assignments, and logs.
- `/playlists` lists display playlists.
- `/playlists/:id` shows read-only playlist state and ordered items.
- `/custom-widgets` manages custom widget templates.
- `/data-sources` manages data sources and cached fetch state.
- `/settings` shows database path, app version, MCP state, and renderer state.

## Interaction Requirements

Screen editor:

- Add widget.
- Move widget by editing numeric coordinates.
- Resize widget by editing numeric width/height.
- Choose template or custom widget.
- Edit JSON config with validation.
- Trigger preview render.
- Provide an actual screen-designer workflow, not only CRUD forms. The designer
  must support direct manipulation or an equivalent ergonomic editing model,
  visible widget hierarchy/state, preview refresh, and fast navigation back to
  related screens/widgets.

Data source editor:

- Create, edit, delete data source.
- Test fetch.
- Show last fetched time, error, and redacted cached data preview.

Custom widget editor:

- Create, edit, delete custom widget.
- Edit template/source text.
- Edit JSON config.
- Preview through Takumi render path where practical.
- Treat Framework widgets as first-class. The Framework widget registry is the
  source of truth for predefined widget metadata, defaults, minimum sizes, and
  JSX rendering. Predefined widgets are seeded Framework widgets, not a
  separate rendering system with duplicated styling. Custom JS widgets are also
  placed through an explicit Framework template; never attach them to an
  arbitrary default template or make behavior depend on template seed order.
- Keep the designer and renderer speaking in Framework widget instances. The
  database can keep compatibility names such as `template_id`, but page,
  palette, and composer code should resolve that storage shape at the boundary
  and then render through the shared Framework path. Bundled/predefined widgets
  are first-class Framework widgets; custom JS widgets are user-authored
  Framework widgets using the explicit `custom-js` Framework definition.

## UI Constraints

- Admin-tool layout, not marketing layout.
- Dense but readable.
- No card-inside-card layouts.
- Use Ark/Park primitives for standard controls and icon buttons where
  available.
- Native radios, checkboxes, selects, and range controls must not appear as
  unstyled browser defaults in production UI. Use Ark/Park radio groups,
  switches, selects, sliders, segmented controls, or intentionally styled
  component wrappers with clear focus/hover/disabled/error states.
- Avoid single-hue purple/blue or beige-heavy visual theme.
- Text must not overflow controls on mobile or desktop.
- The UI does not need to be a pixel-perfect copy of Inker, but it must reach
  the same UX/UI quality level. Treat the live black-box pages, especially
  `http://localhost:3337/screens/designer/1`, as product-level UX references:
  inspect workflows, information density, interaction affordances, navigation,
  and error states. Do not copy GPL source, CSS, templates, or exact layout
  implementation.
- Temporary scaffolding pages are not acceptable for final completion. Before
  finalization, review the screen designer and every implemented admin page
  against the comparable Inker page and record gaps in
  `docs/completion-report.md`.
- Use `docs/agent-loop/product-stories.md` as the UI workflow checklist. A page
  shell or backend endpoint does not satisfy a story until the expected admin
  interaction can be reproduced and recorded.
- Avoid monolithic page modules. Route files, shared components, form
  components, island entrypoints, and focused CSS files should each stay below
  150 logical lines; if a module needs more, extract named subcomponents or
  helpers into focused sibling files.

## Islands

Each island should have one focused responsibility:

- `CollapsibleSection`
- `JsonEditor`
- `ScreenPreview`
- `WidgetForm`
- `DataSourceTester`

Pass initial data through serialized JSON script tags with escaping. Do not
fetch all page data again on hydration unless needed.

## Tests

Add tests for:

- HTML rendering of each page shell.
- API form/action integration where used.
- Island hydration smoke tests.
- JSON editor validation behavior.
- Screen preview refresh behavior.
- Screen designer workflow parity at the interaction level.
- Product-story reproduction coverage for every UI-dependent story in
  `docs/agent-loop/product-stories.md`.
- Desktop and mobile screenshots for the designer and the main operational
  pages, with no overlapping controls or unusable narrow layouts.

Use browser automation for story-level reproduction evidence and UX audits, not
for every narrow backend or repository slice. Batch browser checks by story/page
when possible: one desktop and one mobile pass can cover several related UI
changes if the evidence is recorded clearly.
