# 🌐 Network Map

![Preview](banner.png)

Visualize and scan your Home Assistant network and devices.

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-blue.svg?logo=homeassistant)](https://www.home-assistant.io/) [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![Version](https://img.shields.io/badge/Version-4.0.0-success.svg)](#changelog)

> Part of the [HA Tools](https://github.com/MacSiem) ecosystem — split into individual HACS-installable plugins.

## Installation (HACS)

1. Open HACS → Frontend → ⋮ → **Custom repositories**
2. Repository URL: `https://github.com/MacSiem/ha-network-map` — Category: **Lovelace**
3. Install **Network Map** from HACS
4. Restart Home Assistant

## Usage

### Lovelace card

```yaml
type: custom:ha-network-map
```

### Optional sidebar panel (`configuration.yaml`)

```yaml
panel_custom:
  - name: ha-network-map
    sidebar_title: Network Map
    sidebar_icon: mdi:home-assistant
    url_path: ha-network-map
    js_url: /local/community/ha-network-map/ha-network-map.js
    embed_iframe: false
    config: {}
```

After restart, **Network Map** appears in the HA sidebar.

## Features

- Visualize and scan your Home Assistant network and devices.
- Bundled Bento Design System (light + dark mode, mobile-friendly)
- Self-contained — no shared HA Tools dependency
- Tool settings and dismissed-banner state are cached in browser `localStorage`
## Privacy

- No telemetry, no analytics, no tracking
- No external network calls, no CDN-hosted assets (system fonts only)
- No data leaves your device (no external network calls)
## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Support

If this tool makes your Home Assistant life easier, consider supporting development:

- [☕ Buy Me a Coffee](https://buymeacoffee.com/macsiem)
- [💳 PayPal](https://www.paypal.com/donate/?hosted_button_id=Y967H4PLRBN8W)

## License

MIT — see [LICENSE](LICENSE).
