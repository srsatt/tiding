# Rendering And MCP Spec

Takumi rendering, framework support, and MCP are dirty-room allowed because the
project owner authored that work. Keep these areas isolated and documented.

## Takumi Renderer

Create a renderer boundary:

```ts
export interface RenderRequest {
  screenDesignId: number;
  width: number;
  height: number;
  widgets: RenderWidget[];
  data: Record<string, unknown>;
}

export interface RenderResult {
  imagePath: string;
  mimeType: "image/bmp";
  width: number;
  height: number;
  renderedAt: string;
}

export async function renderScreen(request: RenderRequest): Promise<RenderResult>;
```

Implementation rules:

- Use Takumi as the only renderer.
- Produce 1-bit monochrome BMP output suitable for e-ink partial updates.
- BMP output must use a two-color black/white palette and packed 1-bit rows.
- Keep text dark and high contrast by default.
- Cache render artifacts under `TIDING_RENDER_CACHE_DIR`.
- Record dirty-room provenance for any reused code.

## Framework Support

If framework support is ported from owner-authored work:

- Keep it under `src/framework/`.
- Document the public API.
- Add tests that demonstrate the supported extension points.
- Do not expose GPL-origin abstractions unless independently required.

## MCP

MCP support should be optional and disabled by default.

Minimum tools:

- List screen designs.
- Get a screen design.
- List widgets for a screen.
- Create/update/delete a widget.
- List data sources.
- Fetch a data source.
- Render a screen preview.

Rules:

- Keep MCP transport wiring separate from application services.
- Reuse backend service functions instead of duplicating DB logic.
- Validate tool input with the same validation rules as HTTP.
- Log dirty-room provenance for any reused MCP code.

## Tests

Rendering tests:

- Render a simple text widget to 1-bit BMP.
- Render a widget with fetched data.
- Verify output dimensions and non-empty image bytes.
- Verify BMP bit depth is 1.
- Verify missing data produces a controlled fallback.

MCP tests:

- Tool schema exists.
- Tool calls validate input.
- Tool calls use the same services as HTTP.
- MCP disabled mode does not start the server.
