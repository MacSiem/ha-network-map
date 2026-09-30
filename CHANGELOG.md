# Changelog

## 5.0.17 (2026-09-29)

- Register one storage-mode Lovelace resource and an administrator-only sidebar panel; preserve an existing HACS resource, refresh the owned resource on upgrade and remove owned UI entries on unload. YAML mode keeps the frontend fallback.
- Require Home Assistant 2025.2 for Lovelace resource and panel APIs.
- Default map now includes only MAC/IP devices; HACS repositories and service entries without connection evidence stay out. Optional filter includes explicit non-network connections.
- Use the integration as the sole discovery source, avoiding duplicate browser tracker rows. Preserve reachability across list refreshes and remove stale registry rows.
- Hide/unhide devices and override category using a stable registry ID in local browser storage. Link to HA device and entity pages.
- Keep dense topology nodes and category summaries inside the canvas, limit visible nodes to 24, and expose full names through hover/focus labels instead of overlapping text.
- Leave gateway IP optional instead of inventing a default router address; empty topology points to registry/filter setup.
- A 600-entry registry fixture verifies that 50 addressed devices remain in the default view.

## 5.0.16 (2026-08-28)

- Isolation: Bento CSS is component-local and cannot be captured from `window.HAToolsBentoCSS` by load order.
- Isolation: removed the suite-wide DOM injector and all shared global escape-helper references.
- Security: card and editor values use local String-before-escape helpers.
- Tests: added deterministic residual checks for both defect classes.
- UX: restored the donate footer within the Network Map card's own shadow root.

## 5.0.15 (2026-08-21)

- Security: require Home Assistant administrator privileges for the
  `ha_network_map.scan` service, matching the existing admin-only WebSocket
  scan command.
- Compatibility: raise the minimum Home Assistant version to 2024.7, where
  the integration's `StaticPathConfig` frontend registration API is available.
- Chore: align the bundled card version header with the integration release.

## 5.0.14 (2026-08-20)

- Fix: move the bundled card existence check to Home Assistant's executor so
  integration setup no longer performs a synchronous filesystem call in the
  event loop.

## 5.0.13 (2026-07-18)

- Fix: remove the Subnets tab. Since v5 the bundled integration owns scanning server-side and never received the client-side subnet list, so the tab looked like a setting but changed nothing.

## 5.0.12 (2026-07-18)

- Fix (UI): the small accent dot before section titles no longer detaches from the title text (it was pushed to the opposite edge by the header's flex space-between); it is now pinned next to the title.

## 5.0.11 (2026-07-17)

- Fix (UI): responsive tab bar — tabs stretch to fill the card width and wrap on narrow layouts instead of being pinned to content width and clipped (shared HA Tools tab styling).

## 5.0.11 (2026-07-17)

- Fix (UI): responsive tab bar — tabs stretch to fill the card width and wrap on narrow layouts instead of being pinned to content width and clipped (shared HA Tools tab styling).

## 5.0.9 (2026-07-12)

- Fix: manifest version for the card cache-bust URL is now read through HA's
  integration loader instead of a blocking `open()` inside the event loop
  (removes the "Detected blocking call" warning on setup).

## [5.0.8] - 2026-07-12

- Fix: corrected the stale `websocket_api.py` docstring — `list_devices` and `status` are open read commands; only `scan` is admin-only.
- Docs: README now documents that a single scan probes at most 256 devices (`DEFAULT_MAX_DEVICES_PER_SCAN`); on larger networks the remaining devices are skipped for that run.
- Chore: removed the `country` key from `hacs.json` — it hid the repository from HACS users outside PL/GB/US/DE.
- Chore: aligned card JS version header with `manifest.json` (5.0.8).

## [5.0.7] - 2026-07-12

- Fix: the card now renders for non-admin Home Assistant users — read-only `list_devices` and `status` websocket commands no longer require admin. `scan` stays admin-only — it actively probes the network.

## [5.0.6] - 2026-06-15

- Theme: dark/light now follows the active Home Assistant theme (luminance of --card-background-color) instead of OS prefers-color-scheme.


## [5.0.5] - 2026-06-15

- Theme: dark/light now follows the active Home Assistant theme (luminance of --card-background-color) instead of OS prefers-color-scheme.


## [5.0.4] - 2026-06-15

- Theme: dark/light now follows the active Home Assistant theme (luminance of --card-background-color) instead of OS prefers-color-scheme.


## [5.0.3] - 2026-06-15

- Theme: dark/light now follows the active Home Assistant theme (luminance of --card-background-color) instead of OS prefers-color-scheme.


## 5.0.2 — 2026-06-13

### Fixed
- **Reachability no longer flags live devices as "unreachable" just because they expose no scanned port.** A refused TCP connection now counts as "host up" (only a total no-response/timeout on every port means unreachable), so most online IoT / Modbus / printer devices show reachable. Devices with no IP (Zigbee, Z-Wave, serial Modbus, etc.) stay "—" (not IP-scannable), never red.
- **Card no longer drops input focus or resets the device list to page 1 on every refresh.** A full re-render on each `hass` update (very frequent on large networks) was wiping the focused field ("one character at a time" when typing an IP/subnet) and snapping pagination back to page 1 every second. The card now preserves focus + caret across re-renders, defers rebuilding while you are typing, and only resets the page on an explicit search/filter/sort change.

## 5.0.1 — 2026-06-13

### Added
- `getGridOptions()` for correct sizing in Home Assistant's sections (grid) dashboard layout.

### Fixed
- Clear the pending render-debounce timer in `disconnectedCallback`.

## 5.0.0 — 2026-05-14

**Breaking architectural rewrite.** The card no longer scans the network from the browser. Reachability is now probed by a bundled Python integration that runs from the Home Assistant host itself, so probes always target the home LAN regardless of how the dashboard is being accessed.

### Added
- `custom_components/ha_network_map/` Python integration with `config_flow` setup.
- WebSocket API: `ha_network_map/list_devices`, `/scan`, `/status` (admin-only).
- Service: `ha_network_map.scan` with `ports`, `timeout`, `max_concurrent`, `include_public_ips` fields.
- Server-side discovery from HA's device registry, entity registry, `device_tracker.*` states, and (where available) Zeroconf / DHCP discovery caches.
- Server-side TCP probe on a smart-home port set (`80, 443, 8123, 6053, 1883, 8883, 554, 22, 631`).
- RFC1918 / loopback / link-local scope guard. Public IPs are listed but skipped at scan time unless `include_public_ips: true` is passed explicitly.
- Concurrency cap (16 by default, hard cap 64) and a scan lock so duplicate `scan` calls coalesce.
- Bundled card is auto-registered as a frontend resource on setup.

### Removed
- Browser-side `_pingIp` / `_scanSubnet` path that fired `fetch('http://IP:port/')` HEAD probes against `[80, 443, 8080, 8123]` for every IP on the configured subnet. The integration's server-side probe replaces it.
- Browser-side `localStorage` cache of scan results (`ha-tools-net-scan`). The integration is the source of truth.
- Reliance on `device_tracker.*` alone for device discovery. The integration reads the full device registry, so Bluetooth / Zigbee / Z-Wave / MQTT / ESPHome / cloud-integration devices now show up.

### Migration
- v4 was a HACS `plugin` install. v5 is a HACS `integration`. After upgrading, remove the old `/local/community/ha-network-map/ha-network-map.js` Lovelace resource entry — the integration now serves the card from `/ha_network_map/ha-network-map.js`.
- The legacy "Subnets" input in the card settings tab is kept for visual compatibility but does not affect scan scope in v5. It will be removed in a future minor.

## 4.1.4 — 2026-05-12
- Donate / intro / prereq injector cleanup; release readiness pass.

## 4.0.0 — 2026-05-10
- HA Tools monorepo split — Network Map extracted into its own HACS-installable repo.
