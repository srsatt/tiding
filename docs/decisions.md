# Decisions

Record architectural and dependency decisions here.

## Template

### YYYY-MM-DD: Title

- Decision:
- Reason:
- Alternatives considered:
- License impact:
- Follow-up:

### 2026-07-08: Framework-First Widget Model

- Decision: All widget types, including predefined widgets and user-authored
  custom JS widgets, are represented as Framework widget templates. The
  Framework registry owns metadata, defaults, minimum sizes, and JSX renderers.
- Reason: A single widget model keeps styling and placement behavior consistent
  and prevents custom/predefined widgets from drifting into separate UI and
  rendering systems.
- Alternatives considered: Keep predefined templates as the primary model and
  attach custom widgets to the first available template. Rejected because it
  makes custom widgets second-class and depends on seed ordering.
- License impact: Clean-room implementation; no GPL source, templates, or CSS
  copied.
- Follow-up: Continue replacing generic property editors with registry-derived
  Framework controls where it improves the designer UX.

### 2026-07-08: Framework Palette Is The Designer Widget Source

- Decision: The screen designer palette is built from one Framework palette
  model. Predefined widgets and user-authored JS widgets render as the same
  palette item shape; custom widgets use the explicit `custom-js` Framework
  template instead of a separate designer path.
- Reason: The designer should expose Framework widgets as the primary concept,
  with predefined widgets treated as bundled Framework widgets and custom
  widgets treated as user-defined Framework-backed widgets.
- Alternatives considered: Keep a separate custom-widget palette section with
  bespoke JSX. Rejected because it makes custom widgets look second-class and
  duplicates drag/drop metadata construction.
- License impact: Clean-room implementation; no GPL source, templates, or CSS
  copied.
- Follow-up: Replace remaining generic config JSON flows with registry-derived
  Framework controls where doing so improves readability.

### 2026-07-09: Focused CSS Bundle Instead Of Class-Map CSS Modules

- Decision: Admin styling uses focused, responsibility-scoped CSS files that are
  bundled by `build-islands.sh` into `public/static/admin.css`. The project does
  not require generated scoped CSS Modules or hand-written `*.module.ts` class
  maps for final completion.
- Reason: The current Preact SSR/admin shell does not need class-name maps to
  stay maintainable. The practical quality bar is small colocated feature CSS,
  shared design-system CSS, no route-local style blobs, no sprawling single
  stylesheet, and automated 150-line/source-architecture guards.
- Alternatives considered: Generated CSS Modules with hashed class names.
  Deferred because it adds bundler/codegen complexity without solving a current
  readability or collision problem. Hand-written `admin.module.ts` class maps
  were rejected because they create string indirection without real scoping.
- License impact: Clean-room implementation; no GPL source, templates, or CSS
  copied.
- Follow-up: Revisit generated CSS Modules only if class collisions or bundle
  ownership become a measured problem.
