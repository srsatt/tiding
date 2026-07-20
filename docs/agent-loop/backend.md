# Backend Spec

The backend is a Bun-native HTTP app with a small local router and SQLite
repositories.

## API Groups

Implement JSON endpoints for:

- Health:
  - `GET /api/health`
  - `GET /api/version`
- Firmware:
  - `GET /api/firmware`
  - `GET /api/firmware/:id`
- Screen designs:
  - `GET /api/screen-designs`
  - `POST /api/screen-designs`
  - `GET /api/screen-designs/:id`
  - `PATCH /api/screen-designs/:id`
  - `DELETE /api/screen-designs/:id`
- Screen widgets:
  - `GET /api/screen-designs/:id/widgets`
  - `POST /api/screen-designs/:id/widgets`
  - `PATCH /api/widgets/:id`
  - `DELETE /api/widgets/:id`
- Widget templates:
  - `GET /api/widget-templates`
  - `GET /api/widget-templates/:id`
- Playlists:
  - `GET /api/playlists`
  - `GET /api/playlists/:id`
  - `GET /api/playlists/:id/items`
- Custom widgets:
  - `GET /api/custom-widgets`
  - `POST /api/custom-widgets`
  - `GET /api/custom-widgets/:id`
  - `GET /api/custom-widgets/:id/preview`
  - `PATCH /api/custom-widgets/:id`
  - `DELETE /api/custom-widgets/:id`
- Data sources:
  - `GET /api/data-sources`
  - `POST /api/data-sources`
  - `GET /api/data-sources/:id`
  - `PATCH /api/data-sources/:id`
  - `DELETE /api/data-sources/:id`
  - `POST /api/data-sources/:id/fetch`
- Rendering:
  - `POST /api/screen-designs/:id/render`
  - `GET /api/screen-designs/:id/preview`
  - `GET /api/setup-screen.bmp`
- Device:
  - `GET /api/devices`
  - `GET /api/devices/:id`
  - `GET /api/devices/:id/assignments`
  - `GET /api/devices/:id/logs`
  - `GET /api/setup`
  - `GET /api/display`
  - `POST /api/log`

Exact response fields should follow observed factual compatibility notes where
available. Otherwise choose simple stable JSON and document it.

## Validation

- Validate IDs as integers.
- Validate JSON config fields before write.
- Return `400` for malformed input.
- Return `404` for missing records.
- Return `409` for compatibility or constraint conflicts.
- Return `500` only for unexpected failures.

## Data Source Fetching

Support at minimum:

- HTTP GET data source.
- HTTP POST data source if present in observed DB.
- Cached `last_data`, `last_error`, and `last_fetched_at` fields when present.
- `json_path` extraction with dotted properties, numeric array indexes, and
  bracket-quoted object keys.

Fetching must:

- Use Bun `fetch`.
- Enforce timeouts.
- Store successful response data.
- Store error text without throwing away the old successful data unless the
  observed DB behavior requires it.

## Device Endpoint

`GET /api/display` must provide a TRMNL-compatible response using the active
device assignment, or a playlist-backed screen when no direct assignment exists.
The response must point devices at cached 1-bit monochrome BMP render artifacts
so e-ink firmware can use partial updates without PNG conversion.
Display image URLs must use BMP filenames and `image/bmp` artifacts; do not
serve PNG/JPEG display images from this endpoint.
`GET /api/setup-screen.bmp` must return a no-store 1-bit BMP setup image for
device setup or unassigned-device flows.
`GET /api/setup` must accept TRMNL device identity headers, provision or return
the matching device, and return an API key, friendly ID, setup BMP image URL,
and setup message. `POST /api/log` must persist device logs for known devices
and report unknown devices clearly.

If compatibility is uncertain, implement the endpoint behind a narrow adapter
and document the remaining verification step in `docs/completion-report.md`.

## Tests

Backend tests must cover:

- Router method/path matching.
- JSON parsing and error handling.
- CRUD success and validation failures.
- SQLite repository behavior on a copied fixture DB.
- Data source fetch success and failure.
- Render endpoint calls Takumi boundary.
- Device endpoint returns compatible metadata.
