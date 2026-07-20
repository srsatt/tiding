# Clean-Room And Dirty-Room Protocol

This project targets Apache-2.0 licensing. The original/forked Inker repository
is treated as GPL-contaminated for clean-room implementation work.

This is an engineering protocol, not legal advice. If the result will be
distributed publicly, get a legal review before release.

## Roles

Clean-room implementer:

- May build CRUD, database access, API routing, and frontend.
- Must not read source code, templates, styles, tests, or migrations from the
  GPL project/fork.
- May use factual interface documents, black-box observations, exported SQLite
  schema, OpenAPI-like endpoint notes, user-written product requirements, and
  independently authored tests.
- Must log inputs in `docs/provenance/clean-room-log.md`.

Dirty-room implementer:

- May inspect and reuse only code that the project owner personally authored:
  Takumi rendering, framework support, and MCP.
- Must not touch unrelated GPL-origin files.
- Must document provenance, original path, author claim, and transformation in
  `docs/provenance/dirty-room-log.md`.
- Must publish only interface notes to clean-room code when clean-room code
  needs to call the dirty-room component.

Reviewer:

- Checks that clean-room commits do not contain text/code copied from GPL
  sources.
- Checks that dirty-room reuse is limited to project-owner-authored work.
- Checks dependencies and generated artifacts for Apache-2.0 compatibility.

## Allowed Inputs For Clean-Room Work

- This `docs/agent-loop` packet.
- User-authored natural-language requirements.
- SQLite `.schema` output or equivalent factual database description.
- Black-box HTTP request/response captures.
- Screenshots of behavior only when used as product-level references, not as
  pixel-copy UI source.
- Public documentation for TRMNL device behavior, Bun, SQLite, Preact, Ark UI,
  Park UI, Takumi, and MCP.
- Interface notes written by the dirty-room implementer.

## Forbidden Inputs For Clean-Room Work

- Source files from the original GPL repository or fork.
- GPL migrations, tests, fixtures, frontend files, CSS, templates, or route
  handlers.
- Mechanical translation of GPL code into new syntax.
- Copying names, comments, organization, or unusual implementation structure
  from GPL files when those details are not required by public interfaces.

## Dirty-Room Component Contract

Dirty-room code must be isolated under clearly named modules, for example:

- `src/rendering/takumi/`
- `src/framework/`
- `src/mcp/`

Each dirty-room module must expose a small documented interface and tests. Clean
code may call that interface but must not depend on private implementation
details copied from the fork.

## Provenance Files

Create these files before implementation:

- `docs/provenance/clean-room-log.md`
- `docs/provenance/dirty-room-log.md`
- `docs/provenance/dependency-log.md`

Each log entry should include date, actor/agent, input used, files produced, and
license/provenance note.

## Dependency Policy

Prefer Bun native APIs. Every runtime dependency must be justified. Avoid GPL,
AGPL, LGPL unless explicitly approved and isolated with legal review.

Acceptable likely dependencies:

- `preact`
- `preact-iso` when it replaces custom frontend routing, prerender/hydration
  glue, or route-level code-splitting code with a smaller and clearer
  implementation
- `@ark-ui/react` or the specific Ark UI packages required for the frontend
  component primitives
- Park UI packages after license/dependency review when they improve admin UX
- Tree-shakable SVG icon packages such as Lucide when imported per icon; do not
  add icon fonts, remote icon sprites, or dependencies that force whole-pack
  frontend bundles
- `@takumi-rs/core` or the exact Takumi package chosen after license check

Do not add ORMs, unrelated CSS frameworks, or broad state managers unless the
completion criteria cannot be met with simpler code. Bundlers, routers, and
focused utilities are acceptable when they remove bespoke glue and keep the
runtime lightweight. Park UI is the approved UI-kit/design-system candidate for
this project and should be evaluated before building custom UI framework code.
Repeated explicit Biome invocations should be avoided during active development
when a daemon/editor integration is available; use focused tests while slicing,
then run full CI-style gates before commits and finalization.
