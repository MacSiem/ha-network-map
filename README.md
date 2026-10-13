# Network Map

![Network Map](banner.png)

Visualize the devices Home Assistant already knows about, and probe their
reachability from the Home Assistant host itself — not from your browser.
Ships as a Home Assistant integration with a bundled Lovelace card; no manual
resource entry required.

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2025.2+-blue.svg?logo=homeassistant)](https://www.home-assistant.io/) [![Version](https://img.shields.io/github/v/release/MacSiem/ha-network-map)](https://github.com/MacSiem/ha-network-map/releases) [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Part of the [HA Tools](https://github.com/MacSiem) ecosystem.

## How it works

**Short version: install the integration, add the card, browse.**

1. **Discovery is read-only and server-side.** The bundled Python integration
   reads HA's device and entity registries, `device_tracker.*` states and, where
   available, Zeroconf / DHCP discovery caches. By default it shows only
   devices with a MAC or IP address. HACS repository and service entries with
   no connection are excluded. The optional filter shows Bluetooth, Zigbee
   and other entries with an explicit connection but no network address.
2. **The card is bundled and auto-registered.** The integration serves
   `ha-network-map.js`, registers a storage-mode Lovelace resource and an
   administrator-only sidebar panel. YAML mode uses Home Assistant's frontend
   fallback. You can also add `custom:ha-network-map` to a dashboard.
   Manual resources, including duplicate URLs under the integration path and
   HACS card copies, stay user-owned. Only resources created by this integration
   have durable ID/URL/type receipts and can be updated or removed on unload.
   Editing an owned resource's URL or type relinquishes integration ownership.
   If resource cleanup fails, its receipt is retained and the next setup retries
   safely. For a manually managed resource, update its version query yourself
   when needed, then reload the page; the integration does not rewrite it.
3. **Reachability is probed from the HA host, not your browser.** TCP connect
   attempts against a smart-home port set (`80, 443, 8123, 6053, 1883, 8883,
   554, 22, 631` by default) run from the Home Assistant host, so results are
   consistent no matter where you're viewing the dashboard from (Nabu Casa
   Cloud, mobile data, hotel WiFi). Only RFC1918 / loopback / link-local
   addresses are probed unless `include_public_ips` is explicitly set.
4. **Reading the map is open to every logged-in user; scanning is admin-only.**
   `ha_network_map/list_devices` and `ha_network_map/status` are plain
   WebSocket commands with no admin requirement, so the card renders device
   data for non-admin household members too. `ha_network_map/scan` requires
   an administrator account, because it actively opens TCP connections
   against devices on your network.

### What is automatic vs. manual

| Automatic | Manual |
|---|---|
| Card JS registration (no Lovelace resource entry needed) | Adding the integration once (Settings → Devices & services) |
| Device discovery from HA's registries (all users can view it) | Triggering a scan (admin-only — button, service, or automation) |
| Reachability scope guard (RFC1918 / loopback / link-local only) | Enabling `include_public_ips` if you understand the implications |
| Cache-busting the card on integration upgrades | Adding `custom:ha-network-map` to a dashboard |
| Default MAC/IP filtering | Showing non-network connection types, hiding a device or changing its category |

Hidden devices and category choices use the HA Device Registry ID where
available, so an IP change does not lose the choice. The card links to the
HA device and entity pages. These choices are stored in this browser's
`localStorage`; they do not sync between browsers or household members.

## Screenshots

### Saved scan comparison in 5.1.0

| English · light | Polski · dark |
|---|---|
| ![Saved scan comparison: new device, absence and an IP change, English light theme](docs/screenshots/scan-comparison-en-light-5.1.0.png) | ![Porównanie zapisanych skanów: nowe urządzenie, brak w skanie i zmiana IP, polski ciemny motyw](docs/screenshots/scan-comparison-pl-dark-5.1.0.png) |

*Captured in real Home Assistant 2025.2.0 and 2026.10.1 using synthetic
loopback devices. The saved measurements survive a restart. Counts and changes
come first; expand **Measurement and scope details** for the exact timestamps,
method, scope and coverage. No household network is shown.*

### Device map in 5.0.20

| Light | Dark |
|---|---|
| ![Devices tab in English, administrator panel in light theme](docs/screenshots/card-map-light-5.0.20.jpg) | ![Devices tab in Polish, household Sections card in dark theme](docs/screenshots/card-map-dark-5.0.20.jpg) |

*Captured from 5.0.20 running in Home Assistant with synthetic QA devices.
The English light view shows the administrator panel; the Polish dark view
shows a household card in a Sections dashboard. These screenshots contain no household data.
The Topology tab renders the same devices as a hub-and-spoke graph. Dark mode
follows your Home Assistant theme.*

Table headers support keyboard sorting, and topology nodes expose their full
names when focused. The card supports English and Polish, including categories,
pagination and scan status.

## Installation

1. Open HACS → Integrations → ⋮ → **Custom repositories**.
2. Add `https://github.com/MacSiem/ha-network-map` with category
   **Integration**.
3. Install **Network Map** and restart Home Assistant.
4. **Settings → Devices & services → Add Integration → Network Map** (single
   instance, no fields to fill in).
5. Administrators can open **Network Map** in the sidebar. The Lovelace card is
   registered automatically — no resource entry needed.

Network Map is also available in the default HACS Integration catalog.
Search for **Network Map**; custom repository registration is optional.

If you previously installed v4 as a Lovelace plugin, remove the old
`/local/community/ha-network-map/...` resource entry under *Dashboards →
Resources* — it's superseded by `/ha_network_map/ha-network-map.js`, which
the integration now serves.

## Quick start

```yaml
type: custom:ha-network-map
```

That's it — no options are required. Optionally set a `title` or
`router_ip` (used only as the label under the topology hub):

```yaml
type: custom:ha-network-map
title: Network Map
router_ip: 192.168.1.1
```

## Bindings: optional links to device trackers

A binding links a device already displayed on the map to a Home Assistant
`device_tracker.*` entity. The card shows this reference in **HA Entity** and
**Bindings**. Devices discovered automatically, including eero trackers, do not
need a manual binding to appear on the map.

In **Bindings**, select the tracker entity, then choose **Bind** and enter the
map device's exact IP (for example `192.168.1.42`) or its displayed name. The name
must identify an existing map row: it is not a new label or a DNS hostname to
resolve. For a reachable device you can also open its details and use **Bind**
to select a tracker for that particular row.

Bindings do not rename devices, assign IP addresses, change tracker states or
change the integration's TCP reachability measurements. They are local to this
browser and origin; another browser does not inherit them. A uniquely matched
device uses its existing stable identity where available, so the link can
survive an IP change. **Unbind** removes the local reference.

## Entities

This integration exposes **no entities**. It is a WebSocket API + bundled
Lovelace card only — there are no `sensor.*` or `binary_sensor.*` platforms.
Device and reachability data live in the integration's in-memory state and
are read by the card over the WebSocket commands below. Completed scan history is stored separately in Home Assistant:

| WebSocket command | Access | Description |
|---|---|---|
| `ha_network_map/list_devices` | Any logged-in user | Current device map, no network probe |
| `ha_network_map/status` | Any logged-in user | Last-scan timestamps + device/reachable counts |
| `ha_network_map/scan` | Admin only | Triggers a fresh TCP reachability probe from the HA host |
| `ha_network_map/scan_history` | Admin only | Metadata for retained completed scans, without probing |
| `ha_network_map/compare_scans` | Admin only | Compare two retained scans, without probing |

## Services

### `ha_network_map.scan`

Probe TCP reachability for every HA-known device with an IP, from the Home
Assistant host itself.

```yaml
service: ha_network_map.scan
data:
  ports: [80, 443, 8123]      # optional, defaults to a smart-home set
  timeout: 0.7                # optional, 0.05 .. 5.0 seconds
  max_concurrent: 16          # optional, 1 .. 64
  include_public_ips: false   # optional, default false
```

Only private addresses (RFC1918 / loopback / link-local) are probed unless
`include_public_ips` is enabled. A scan already in progress causes new calls
to return the current status instead of running twice. A single scan probes
at most 256 devices (`DEFAULT_MAX_DEVICES_PER_SCAN`); on larger networks the
remaining devices are skipped for that run.

A request accepts at most 12 TCP ports. An unmeasured device shows `—`, including
devices without an IP and public addresses skipped by the default scope guard.
The current device map and last-scan status are held in memory and reset when
the integration reloads or Home Assistant restarts. Completed snapshots are
retained separately for the saved comparison described below. A temporary list error preserves the
existing map and offers **Retry**, which only reads the device list and does
not start a scan.

Use active scans only for devices and networks you administer. Reachability is
an informational check, not a security assessment or a guarantee of availability.

## Saved scan comparison

Administrators can open **Scan comparison** and select two completed scans.
The view starts with counts and device changes. Expand **Measurement and scope
details** for each scan’s exact UTC times, source, TCP method, configured scope,
limits and coverage. Devices with a stable registry ID or MAC can be compared
across IP changes. **Not in this scan** means the device was absent from that
measurement; it is not a claim of downtime. Incompatible methods or scopes,
missing identity and capped coverage remain partial or unconfirmed. Addressless
HA service entries are outside the network scope; real devices without an IP
remain visible as skipped coverage.

Completed scans are retained locally in Home Assistant: up to 30 scans from
30 days, with at most 256 measured devices per scan. The private store contains
device identifiers, labels and local addresses. It survives restarts and stays
subject to those limits. Only completed scans are captured; busy, cancelled or
failed requests do not invent history. If saving fails, the previous confirmed
history remains and the unavailable history status is shown. Opening, selecting
or paging through a comparison does not start a scan or rewrite the store.

After updating from HACS, restart Home Assistant to load the integration code,
then reload the browser. No manual history migration is needed. Existing device
preferences, tracker bindings and user-managed dashboard resources are preserved.
Unknown or damaged history is reported as unavailable and is not silently reset.

A scan’s **Success** confirms that the scan completed and the device list was
read. It does not mean every device is reachable. **Partial** means the scan
completed but the list could not be refreshed; **Retry** only reads that list.
A busy or unconfirmed response never triggers an automatic repeat scan.

## Automation example

```yaml
alias: Nightly network scan
trigger:
  - platform: time
    at: "03:00:00"
action:
  - service: ha_network_map.scan
    data:
      timeout: 1.0
      max_concurrent: 8
```

## Privacy and data

- All active probing happens on the Home Assistant host. The browser never
  fires TCP/HTTP probes against LAN IPs.
- Only RFC1918 / loopback / link-local addresses are probed by default —
  scanning does not leave your LAN unless you explicitly set
  `include_public_ips: true` on a call, and even then the connection
  originates from the HA host, not a third-party service.
- Device names, addresses, categories and entity links come from Home Assistant's
  registries, states and optional discovery caches. Reading the map sends no
  data to a third-party service. Every logged-in household user can read it.
- Explicit scans open TCP connections from the HA host. Enabling
  `include_public_ips: true` also permits connections to public addresses;
  the destination then sees the HA host's network address. No application
  payload, credentials or telemetry are sent by the probe.
- The card uses browser `localStorage` for intro dismissal, bindings, hidden
  device IDs and categories. Scan results are not persisted in the browser.
- No telemetry, no analytics, no CDN-hosted assets.

## FAQ

**Does scanning leave my LAN?**
No. The scanner only probes RFC1918 / loopback / link-local addresses unless
you explicitly pass `include_public_ips: true`, and every probe originates
from the Home Assistant host itself — never from your browser.

**Can non-admin users see the device map?**
Yes, as of 5.0.7. `list_devices` and `status` are open to every logged-in
user, so the card renders for the whole household. Only triggering a new
scan requires an administrator account.

**Why are my Zigbee/Bluetooth devices absent by default?**
The map starts with MAC/IP devices. Select **Show devices without MAC/IP** to
include entries with an explicit connection type, such as Zigbee or Bluetooth.
Addressless service entries stay excluded. Devices without an IP show `—` for
reachability because they cannot be probed.

**A device reachability shows "unreachable" even though it's online.**
A device only counts as unreachable when every probed port times out with no
response at all. A refused connection still proves the host is up, so most
IoT devices, printers and Modbus gear that expose none of the scanned ports
still show as reachable.

**Does this send data anywhere?**
No. Reading the map stays within Home Assistant. There is no telemetry or CDN
asset loading. An explicit scan connects to local addresses by default;
`include_public_ips: true` also permits connections to public addresses.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Support

If this tool makes your Home Assistant life easier, consider supporting
development:

- [Buy Me a Coffee](https://buymeacoffee.com/macsiem)
- [PayPal](https://www.paypal.com/donate/?hosted_button_id=Y967H4PLRBN8W)

The card shows a small support link to administrators. It can be dismissed in the browser or hidden with `show_support: false` in the card configuration.

## License

MIT — see [LICENSE](LICENSE).
