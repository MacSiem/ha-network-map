# Changelog

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
