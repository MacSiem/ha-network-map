# 🌐 Network Map

Visualize your smart home network topology and device connections

Part of the [HA Tools](https://github.com/MacSiem/ha-tools-panel) collection for Home Assistant.

## Installation

### HACS (recommended)
1. Open HACS in Home Assistant
2. Go to Frontend > Explore & Download Repositories
3. Search for "Network Map"
4. Install and restart Home Assistant

### Manual
1. Download `ha-network-map.js` from this repository
2. Copy to `/config/www/community/ha-network-map/`
3. Add as a Lovelace resource

## Screenshot

![Screenshot](screenshot.png)

## Changelog

### v2.3 (2026-03-17)
- Bento Light Mode UI redesign (Inter font, blue accent #3B82F6)
- Throttled hass updates (5s) to prevent UI lag
- Stable pagination and data persistence
- Fixed dual-script loading (customElements.define guard)
- CSS custom properties for theming (--bento-primary, --bento-bg, etc.)
- Improved readability and layout consistency

## License

MIT