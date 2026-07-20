# Dirty-Room Log

Record dirty-room inspection and reuse here.

## Template

### YYYY-MM-DD HH:MM Agent

- Inspected source:
- Owner-authorship basis:
- Scope: Takumi rendering | framework support | MCP
- Files produced:
- Transformation summary:
- Verification:
- Notes:


### 2026-06-24 Agent

- Inspected source: `../inker/backend/src/screen-designer/services/screen-renderer.takumi.service.ts`
- Owner-authorship basis: Takumi rendering logic as per project spec.
- Scope: Takumi rendering
- Files produced: `src/rendering/takumi/renderer.ts`, updated `src/index.ts` for render endpoint.
- Transformation summary: Abstracted the Takumi renderer into a standalone wrapper class, removing NestJS dependencies and using Bun's native capabilities. Simplified font loading.
- Verification: Integrated into /api/screen-designs/:id/render as a test.
- Notes: Using `takumi-js` npm package.

### 2026-07-10 Codex

- Inspected source: `../inker/backend/src/screen-designer/services/screen-renderer.takumi.service.ts`
  and `../inker/backend/src/screen-designer/services/screen-renderer.service.ts`.
- Owner-authorship basis: explicit user authorization in this conversation to
  copy the rendering logic they authored.
- Scope: Takumi rendering only.
- Files produced: `src/rendering/takumi/renderer.ts`,
  `src/rendering/bmp/mono-pixels.ts`, `src/services/render-settings.ts`, and the
  regular and bold display-font assets under `assets/fonts/`.
- Transformation summary: restored the lazy Takumi renderer, explicit
  `TRMNL12/16/21` regular and bold font registration, the original
  Inter-to-TRMNL16 mapping used by imported framework widget templates, legacy
  `eink_rendering` settings compatibility, and Inker's Floyd-Steinberg contrast
  clamp. Added an optional 2x Takumi geometry rasterization path with
  box-filtered downsampling, then restored native-size rendering as the default
  after real-screen comparison showed that 2x made bold framework glyphs too
  heavy.
- Verification: focused rendering and settings regressions plus real Inker DB
  comparisons at `800x480` across native/2x/4x rasterization, thresholds
  128-200, and threshold/Floyd-Steinberg conversion.
- Notes: no Inker frontend/designer source, styles, or templates were copied.

### 2026-07-14 Codex

- Inspected source: selected font-registration and render-boundary sections of
  `../inker/backend/src/screen-designer/services/screen-renderer.satori.service.ts`
  and
  `../inker/backend/src/screen-designer/services/screen-renderer.takumi.service.ts`.
- Owner-authorship basis: explicit user authorization in this conversation to
  reuse the rendering logic they authored.
- Scope: Takumi font registration and native-size framework rendering only.
- Files produced: `src/rendering/takumi/display-fonts.ts`, updates to
  `src/rendering/takumi/renderer.ts`, and the DejaVu Sans render asset plus
  license under `assets/fonts/`.
- Transformation summary: retained native-size Takumi rendering, measured the
  available TRMNL strikes independently at 1-bit output, selected native
  12/16/21 faces at their readable sizes, and added DejaVu Sans for larger text
  instead of scaling a pixel face. No source text was copied; the DejaVu asset
  came from the Raspberry Pi system font package, not Inker.
- Verification: font/weight matrices, copied live-database BMP comparison,
  focused font-selection tests, full test suite, and final live 800x480 Pi BMP.
- Notes: no Inker frontend, designer CSS, templates, or application structure
  was copied.

### 2026-07-14 Codex - TRMNL text isolation follow-up

- Inspected source: no additional external source.
- Owner-authorship basis: direct user clarification that TRMNL display fonts
  are required and that other raster content must not cause text dithering.
- Scope: Takumi font selection and 1-bit text/image compositing.
- Files produced: `src/rendering/takumi/display-fonts.ts`,
  `src/rendering/takumi/renderer.ts`, `src/rendering/bmp/mono-bmp.ts`,
  `src/rendering/bmp/mono-pixels.ts`, and focused rendering tests.
- Transformation summary: responsive text now stays on TRMNL12/16/21; the
  renderer creates a layout-identical textless raster only for non-threshold
  conversion and composites threshold-only text over the converted artwork.
- Verification: a deterministic Takumi fixture reproduces scalable-font and
  scaled-font diffusion artifacts; regressions require text-only threshold and
  Floyd-Steinberg BMPs to match while a grayscale artwork fixture must differ.

### 2026-07-14 Codex - Takumi v2 migration

- Inspected source: Takumi's public `llms-full.txt` v2 upgrade documentation and
  the installed Takumi 2.2 TypeScript declarations.
- Owner-authorship basis: public upstream dependency documentation supplied by
  the user.
- Scope: Takumi rendering boundary and font selection only.
- Files produced: `package.json`, `bun.lock`,
  `src/rendering/takumi/renderer.ts`,
  `src/rendering/takumi/display-fonts.ts`, focused rendering tests, and
  dependency/completion documentation.
- Transformation summary: replaced the v1 constructor and `loadFonts` API with
  a bare v2 `Renderer` and awaited `registerFont` calls. Kept raw RGBA output as
  the input to Tiding's 1-bit conversion. Responsive text now snaps both family
  and CSS size to native TRMNL12/16/21 strikes; v2's built-in Geist family is
  used only when the requested size is more than 4px from every native strike.
- Verification: v2 typecheck and server build, 115 tests, font specimens, and
  repeated exact-screen 800x480x1 BMP comparison.
