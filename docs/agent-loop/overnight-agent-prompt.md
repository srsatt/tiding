# Overnight Agent Prompt

You are building `tiding`, a new Apache-2.0 Bun-native backend and lightweight
frontend for TRMNL e-ink screens. This is a clean-room rewrite of an existing
GPL project/fork, with narrow dirty-room reuse only for code the project owner
authored: Takumi rendering, framework support, and MCP.

Read these files before writing code:

1. `docs/agent-loop/protocol.md`
2. `docs/agent-loop/architecture.md`
3. `docs/agent-loop/database-compatibility.md`
4. `docs/agent-loop/product-stories.md`
5. `docs/agent-loop/frontend.md`
6. `docs/agent-loop/backend.md`
7. `docs/agent-loop/rendering-and-mcp.md`
8. `docs/agent-loop/completion-criteria.md`
9. `docs/backlog.md`
10. `docs/agent-loop/medium-model-playbook.md`

## Medium-Model Operating Mode

This project should be runnable by a medium-cost model by default. Assume
limited planning depth and keep the loop explicit:

- Prefer ordinary medium-model execution for routine code, docs, tests,
  browser story evidence, and backlog grooming. Expensive-model work is not the
  default for this project.
- Work one story slice at a time. Prefer a slice that touches one feature area,
  one test area, and the evidence docs.
- Good medium-model slices are narrow implementation gaps, focused UX fixes,
  missing tests, source splits under the 150-line limit, backlog/evidence
  updates, and single-story browser proofs.
- Bad medium-model slices are broad prompts such as "finish the frontend",
  "make the designer good", "clean the architecture", or "close all remaining
  UI gaps". Split them first by story ID, route, visible behavior, expected
  evidence, and file set.
- Before editing, write a short local checklist from the relevant story,
  backlog item, and current code. Do not rely on memory of previous turns.
- Re-read the exact docs and files for the slice. Treat chat history as helpful
  context, not as source of truth.
- Keep patches small enough to review mechanically. Avoid broad refactors,
  dependency changes, schema changes, or visual redesigns unless the docs name
  the exact target and tests/evidence prove it.
- Prefer one commit per coherent slice. If a slice grows beyond roughly five
  source files plus docs/tests, stop, update the backlog with the split, and
  hand off the smaller next slice.
- Use focused tests during the slice, then run type/build/diff gates before a
  commit. Do not spend tokens on repeated browser runs unless the slice changes
  a user-visible workflow or is collecting story evidence.
- Prefer source and test evidence for backend/data/model work. Use browser
  evidence for UX claims, designer behavior, and final story parity.
- If a requirement is ambiguous, add or update a backlog item instead of
  inventing a large interpretation.
- Do not mark a broad story or backlog item complete from narrow evidence.
- After every slice, leave the next medium-model agent a concrete next step:
  status, changed files, commands run, evidence produced, and the smallest
  remaining gap. Do not leave broad "continue polishing UI" handoffs.
- Status must be evidence-first. Say "verified by X" or "still missing Y";
  avoid unsupported summaries like "mostly done", "looks polished", or "should
  work".

Escalate to a stronger model or pause for owner review when the next step
requires GPL/clean-room boundary judgment, a new dependency or architecture
direction, a cross-cutting refactor, final completion audit, multi-page visual
design judgment, or debugging a repeated failure after two focused attempts.

Use this handoff shape for every medium-model slice:

- Scope: one story ID and any backlog IDs.
- Current gap: one sentence tied to current code or evidence.
- Files likely touched: exact paths or directories.
- Checks: focused tests first, then type/build/diff gates before commit.
- Evidence: browser/BMP/API proof only when the slice changes a user workflow.
- Stop rule: what should trigger escalation instead of broad guessing.

Use this resume shape after every completed or paused slice:

- Done: changed files and the concrete behavior/doc/test now covered.
- Verified: commands, browser screenshots, API captures, or BMP artifacts.
- Not verified: anything the next agent must not assume.
- Next slice: one smallest action with story/backlog ID and likely files.
- Escalate if: the exact repeated failure or decision that needs stronger
  reasoning or owner input.

When context is tight, prefer the shorter mechanical checklist in
`docs/agent-loop/medium-model-playbook.md` over broad replanning. It is the
default operating contract for cheaper-model runs.

## Non-Negotiable Rules

- Do not read, copy, translate, or mechanically port source files from
  `../inker` for clean-room CRUD, backend routing, database access, or frontend.
- Do not use GPL dependencies or copy GPL text, templates, styles, migrations,
  tests, screenshots, or UI layout as implementation input.
- Keep the implementation Apache-2.0 compatible.
- Use Bun native APIs where practical.
- Keep external dependencies minimal and justified in `docs/decisions.md`.
- Use SQLite for persistence and preserve compatibility with the current Inker
  database layout.
- Use Takumi as the only screen renderer.
- Use Preact plus Ark UI (`https://ark-ui.com/`) as the project-wide headless
  component primitive set for the frontend. Do not limit Ark usage to
  Collapsible.
- Use Park UI (`https://park-ui.com/`) on top of Ark UI where it helps achieve
  production-quality admin UX, after recording dependency/license rationale.
- Do not rely on generic raw CSS or unstyled native form controls for production
  UI. Build a reusable Ark/Park-backed design-system layer first, keep theme
  persistence flash-free, and use individually imported SVG icons only.
- Keep frontend source small and readable: no hand-written file under
  `src/frontend/` may exceed 150 logical lines. Split routes, components,
  forms, islands, and CSS modules before they become monolithic.
- Keep frontend architecture layered: design-system components, feature modules,
  thin routes, focused islands, and shared helpers.
- Use mature focused libraries when they make the code simpler and lighter than
  custom glue. `preact-iso` (`https://preactjs.com/guide/v10/preact-iso/`) is
  allowed for routing, route utilities, hydration/prerender helpers, and
  route-level code splitting after dependency/license rationale is recorded.
  Use `interact.js` (`https://interactjs.io/`) for screen-designer drag,
  resize, restrict, snap, and gesture behavior instead of expanding custom
  pointer-event code.
- Prefer prerendered HTML with islands of interactivity.
- Maintain provenance logs while working:
  - `docs/provenance/clean-room-log.md`
  - `docs/provenance/dirty-room-log.md`
  - `docs/provenance/dependency-log.md`
- Maintain `docs/backlog.md`: every user-raised point, correction, prompt
  change, quality bar, UX concern, implementation concern, and follow-up request
  must be added unless it is fully completed in the same change. Final
  completion requires the backlog to be clear.

## Build Loop

Repeat this loop until every completion gate passes:

1. Read the relevant spec section.
2. Write a small implementation slice.
3. Map the slice to one or more story IDs in
   `docs/agent-loop/product-stories.md`.
4. Add or update `docs/backlog.md` for all user feedback addressed or
   discovered by the slice, including prompt/process feedback.
5. Add or update tests and browser/API/MCP reproduction evidence for that
   story slice.
6. Run the narrowest useful test/build command.
7. Batch compatible tests and browser checks where safe. Use browser automation
   for story/page evidence, not every narrow non-UI slice. Prefer the
   format/lint daemon or editor integration during development; run full lint as
   a commit/finalization gate.
8. Record decisions and provenance.
9. Commit only when the slice is coherent and verified.

For medium-model runs, keep the slice small enough that the final report can
name every changed file, every verification command, and the exact remaining
gap without hand-waving.

Do not stop after scaffolding. Continue through schema compatibility, CRUD,
rendering, frontend, MCP, packaging, tests, and documentation.

## Phase Order

1. Compliance scaffold: license, provenance files, clean/dirty room guardrails.
2. Project scaffold: Bun app, TypeScript, test runner, formatting, directory
   layout, minimal dependency set.
3. SQLite compatibility: open existing DB, introspect schema, define typed
   repositories without generated GPL migrations.
4. Backend API: implement CRUD and device endpoints from factual behavior
   specs, not source code.
5. Takumi dirty-room import/reimplementation: isolate renderer package and
   document provenance.
6. Product stories: work through `docs/agent-loop/product-stories.md` and keep
   `docs/completion-report.md` updated with per-story evidence and gaps.
7. Frontend: split route/component modules under the 150-line limit, use
   lightweight mature helpers where they reduce custom glue, then build the
   prerendered shell, Preact islands, Ark/Park UI primitives, CRUD flows, and a
   production-quality screen designer.
8. MCP dirty-room support: tool surface, server wiring, tests, provenance.
9. Backward compatibility: run against a copy of the existing DB and verify no
   destructive migrations.
10. Device verification: render 1-bit screen BMPs for partial updates and serve
   TRMNL-compatible display responses.
11. UX parity pass: compare `http://localhost:3337/screens/designer/1` and the
    other live Inker admin pages as black-box product references. Match their
    workflow quality and interaction coverage without copying GPL source,
    templates, CSS, or exact layout.
12. Final hardening: package, docs, CI-style checks, final criteria report.

## Expected Final Output

Before ending, produce `docs/completion-report.md` containing:

- What was built.
- Which specs are satisfied.
- Story-by-story evidence for every story in
  `docs/agent-loop/product-stories.md`.
- Commands run and their results.
- Dependency and license summary.
- Any remaining gaps with concrete file/line references.

The task is only complete when `docs/agent-loop/completion-criteria.md` passes.
