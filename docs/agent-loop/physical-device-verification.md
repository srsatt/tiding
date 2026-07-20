# Physical Device Verification

This runbook closes the remaining ST-10 and ST-12 evidence gaps. Use it only
against a real TRMNL or TRMNL-compatible device on the same network as the
Tiding server.

## Scope

- ST-10: captive-portal onboarding or physical setup flow reaches Tiding.
- ST-12: the device receives and displays Tiding 1-bit BMP setup/display images.

Passing this runbook is required before the project can be marked complete.
Local HTTP checks and copied-database tests are not enough for these two
stories.

## Before Starting

1. Build the frontend and server:

   ```bash
   bun run build
   ```

2. Start Tiding on a LAN-reachable host:

   ```bash
   DB_PATH=/path/to/tiding.db \
   CACHE_PATH=/path/to/cache \
   TIDING_ADMIN_PIN=1111 \
   PORT=43337 \
   bun run src/index.ts
   ```

3. Open the admin UI and confirm `/devices/new` shows:

   - TRMNL Wi-Fi setup instructions.
   - Copyable API server URL.
   - Copyable setup BMP URL.
   - QR affordance for the setup image.
   - Manual registration fallback.

4. Confirm the server URL uses the device-reachable host/IP, not `localhost`.

## Captive-Portal Flow

1. Factory-reset or enter setup mode on the physical TRMNL device.
2. Connect a phone or laptop to the TRMNL setup Wi-Fi network.
3. Open the captive portal.
4. Enter normal Wi-Fi credentials.
5. Set the API server URL to the Tiding server URL shown in `/devices/new`.
6. Let the device finish setup.
7. In Tiding, verify a new device appears in `/devices` with a recent
   `last_seen_at`, friendly ID or MAC address, and setup/display log entries.
8. Assign the device to a playlist or confirm welcome auto-assignment.

Evidence to save:

- Screenshot or photo of captive portal showing the Tiding API server URL.
- Screenshot of `/devices` showing the new physical device.
- Screenshot of the physical device showing the setup or welcome/display image.
- Exported verifier output from the next section.

## HTTP Contract Verification

Run the verifier against the same server URL and the physical device HTTP ID.
Use the MAC address or friendly ID shown in `/devices`.

```bash
bun run verify:device-http -- \
  --base-url http://DEVICE_REACHABLE_HOST:43337 \
  --http-id AA:BB:CC:DD:EE:FF \
  --out-dir /tmp/tiding-physical-device
```

The verifier must produce:

- `/tmp/tiding-physical-device/evidence.json`
- `/tmp/tiding-physical-device/setup-screen.bmp`
- `/tmp/tiding-physical-device/display-screen.bmp`

The command must fail if:

- `/api/setup` does not return JSON setup data.
- `/api/setup-screen.bmp` is not an `800x480`, 1-bit, two-color, non-empty BMP.
- `/api/display` does not return a display image URL.
- The display BMP does not match `/api/display` `width` and `height`.
- The display image URL lacks cache/telemetry parameters: `t`, `battery`,
  `wifi`, `deviceName`, `macAddress`, and `format=bmp`.

## Pass Criteria

ST-10 can be marked satisfied only when:

- Captive-portal setup reaches Tiding without manually creating the device.
- The device appears in `/devices`.
- Device setup/display logs are visible.
- The device can be assigned to a playlist or receives the welcome playlist.

ST-12 can be marked satisfied only when:

- The physical device displays an image served by Tiding.
- `verify:device-http` passes against the physical device ID and LAN URL.
- The saved `evidence.json` redacts setup API keys.
- The saved BMP files are 1-bit, two-color, non-empty, and match expected
  dimensions.

## Completion Report Update

After passing, update:

- `docs/completion-report.md`: change ST-10 and ST-12 to `Satisfied` with the
  physical evidence path, screenshots/photos, device ID, server URL, and command
  used.
- `docs/provenance/clean-room-log.md`: record allowed inputs, files produced,
  command output, evidence locations, and that no GPL source/templates/CSS were
  read.
- `docs/backlog.md`: keep Open and In Progress empty.

Do not mark the overall project complete until both ST-10 and ST-12 are
recorded as satisfied with this evidence.
