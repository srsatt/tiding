# Completion Criteria

The project is complete only when every required gate below passes.

## Product Story Gates

- Every story in `docs/agent-loop/product-stories.md` has reproducible
  evidence recorded in `docs/completion-report.md`.
- The completion report includes a story matrix with one row for every story
  ID, its current status, and links to browser runs, screenshots, tests, API
  captures, MCP runs, or physical-device evidence.
- No story may be marked complete if it was only implemented through backend
  APIs while the expected admin UI workflow remains missing.
- Authenticated black-box inspection of the reference admin pages has been
  performed where the story depends on UI parity. If reference access is not
  available, the corresponding UI parity story remains incomplete.

## Compliance Gates

- `LICENSE` exists and is Apache-2.0.
- Every source file has compatible licensing or project-default licensing.
- `docs/provenance/clean-room-log.md` exists and records all clean-room inputs.
- `docs/provenance/dirty-room-log.md` exists and records all dirty-room reuse.
- `docs/provenance/dependency-log.md` lists every runtime dependency, version,
  license, and reason.
- Clean-room code was not written after reading GPL source.
- Dirty-room code is limited to Takumi rendering, framework support, and MCP.

## Architecture Gates

- Bun app starts with `bun run dev` or equivalent.
- Production app starts with `bun run start` or equivalent.
- No Prisma, libSQL, browser renderer fallback, or large web framework.
- SQLite path is configurable.
- Port defaults to `43337`.
- Takumi is the only screen renderer.

## Database Gates

- Existing Inker DB copy opens successfully.
- Schema validation reports supported/unsupported state clearly.
- CRUD operations preserve unknown columns and JSON config fields.
- No destructive migration runs automatically.
- Additive migrations create a timestamped backup first.

## Backend Gates

- Health, CRUD, data source, render, preview, and device endpoints exist.
- API validation returns correct `400`, `404`, `409`, and `500` classes.
- Data source fetch updates cache fields and records errors.
- Device endpoint returns TRMNL-compatible display data.

## Frontend Gates

- Required admin pages exist.
- Pages are server-prerendered.
- Preact islands hydrate only where needed.
- Admin styling uses focused design-system and feature CSS bundled through the
  frontend build path, not hand-written `*.module.ts` class maps, route-local
  style blobs, or sprawling single-file global selectors.
- Shared admin UI is built from a reusable Ark/Park-backed design-system layer,
  not one-off raw CSS in route files.
- Theme selection persists across server-rendered page loads with no visible
  default-theme flash.
- Radios, checkboxes, selects, switches, segmented controls, and similar inputs
  use Ark/Park primitives or styled wrappers, not unstyled system defaults.
- Icons are SVG, individually imported from a tree-shakable permissive library,
  and do not add a large icon-pack/font payload.
- Every hand-written frontend file under `src/frontend/` is 150 logical lines
  or fewer. Large page, component, island, or CSS files must be split before the
  frontend gate can pass.
- Frontend modules follow a reusable architecture: design-system components,
  feature modules, thin routes, focused islands, and shared helpers.
- Frontend routing/page composition uses `preact-iso` route matching or route
  components where that keeps the code simpler than custom route glue.
- Admin route dispatch is kept as explicit route definitions/handlers instead
  of a monolithic page-rendering branch chain or custom path-regex router.
- Park UI is implemented as the design-system layer before broad page polish:
  shared controls use Park-compatible variants/sizes/tokens, themes are
  switchable, and new UI work uses those primitives by default.
- Ark UI is used under Park-compatible controls as the project-wide primitive
  library for interactive behavior where applicable.
- Screen editor supports widget add/edit/delete and preview refresh.
- Screen designer reaches production-quality UX: direct manipulation or an
  equivalent ergonomic workflow, clear widget hierarchy/state, reliable preview
  feedback, and no temporary scaffold UI.
- Data source editor supports test fetch and error display.
- Custom widget editor supports create/edit/delete.
- The designer and main admin pages have been compared against the live Inker
  pages, especially `http://localhost:3337/screens/designer/1`, at workflow and
  UX-quality level without copying GPL implementation.
- Desktop and mobile browser checks show no overlapping controls or unusable
  layouts on the designer and main operational pages.
- Browser automation evidence is batched by story/page where practical, instead
  of running Web/MCP checks for every narrow non-UI slice.

## Rendering And MCP Gates

- A simple screen renders to a non-empty 1-bit BMP with expected dimensions.
- Predefined widgets are seeded from the first-class Framework widget registry;
  there is no duplicate predefined renderer/style source.
- Rendered BMP artifacts are suitable for partial e-ink updates.
- Render artifacts are cached in the configured cache directory.
- MCP is disabled by default and can be enabled by config.
- MCP tools cover screen, widget, data source, and render workflows.
- MCP tests verify validation and service reuse.

## Quality Gates

- `bun test` passes.
- Type checking passes.
- Build or packaging command passes.
- Lint/format command passes if configured.
- During development, agents should use the available format/lint daemon or
  editor integration instead of repeatedly invoking Biome manually; explicit
  full lint remains a commit/finalization gate.
- Medium-model runs keep slices narrow, record exact changed files and checks,
  avoid broad completion claims from narrow evidence, and escalate documented
  hard calls instead of guessing.
- Medium-model runs follow `docs/agent-loop/medium-model-playbook.md` for slice
  selection, verification ladder, documentation duties, and handoff packets.
- Medium-model handoffs include scope, current gap, likely files, checks,
  evidence target, and stop rule. Stronger-model use is limited to documented
  escalation cases, not routine implementation.
- Each completed slice leaves enough concrete state for a medium model to
  resume without rebuilding context from chat history: changed files, commands,
  evidence, remaining gap, and next smallest step.
- Medium-model handoffs include explicit "Done", "Verified", "Not verified",
  "Next slice", and "Escalate if" sections when work is paused or handed off.
- Broad tasks such as UI polish, architecture cleanup, designer parity, or
  frontend completion are split into story-sized slices before implementation,
  each with route/workflow scope, expected evidence, and a bounded file set.
- Late-stage remaining work is treated as verification-first: ST-10 and ST-12
  should be closed with physical device/captive-portal/BMP evidence or with a
  narrowly documented fix for the exact failing proof, not with another broad
  project plan.
- ST-10 and ST-12 physical evidence follows
  `docs/agent-loop/physical-device-verification.md`, including saved verifier
  output, screenshots/photos, and completion-report provenance.
- A frontend size check verifies the 150-line file limit for hand-written
  `src/frontend/` files.
- At least one integration test runs against a copied compatibility DB fixture.
- `docs/completion-report.md` summarizes commands, results, gaps, and license
  state.
- `docs/completion-report.md` includes the product-story evidence matrix.
- `docs/backlog.md` is clear: no Open or In Progress items remain, every
  user-raised point is present and is Done with evidence or Deferred with
  explicit user approval, and the completion report links the evidence.

## Stop Conditions

Stop and report clearly if:

- Required compatibility behavior can only be learned by reading GPL source.
- Takumi package/license is incompatible with Apache-2.0 distribution.
- Existing DB schema cannot be opened or safely observed.
- TRMNL device protocol cannot be verified from public docs or black-box
  captures.
