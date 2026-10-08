DOMAIN = "ha_network_map"
VERSION = "5.0.21"
CARD_FILENAME = "ha-network-map.js"
CARD_URL = f"/{DOMAIN}/{CARD_FILENAME}"
STATIC_URL_BASE = f"/{DOMAIN}"
CARD_ELEMENT = "ha-network-map"
PANEL_URL_PATH = "ha-network-map"
PANEL_TITLE = "Network Map"
PANEL_ICON = "mdi:lan"

# Defaults — every value here is overridable through the config entry options.
DEFAULT_PORTS = (80, 443, 8123, 6053, 1883, 8883, 554, 22, 631)
DEFAULT_PROBE_TIMEOUT_SECONDS = 0.7
DEFAULT_MAX_CONCURRENT_PROBES = 16
DEFAULT_MAX_DEVICES_PER_SCAN = 256

CONF_PORTS = "ports"
CONF_PROBE_TIMEOUT = "probe_timeout"
CONF_MAX_CONCURRENT = "max_concurrent"
CONF_INCLUDE_PUBLIC = "include_public_ips"

DATA_SCANNER = "scanner"
DATA_FRONTEND_REGISTERED = "_frontend_registered"
DATA_PANEL_REGISTERED = "_panel_registered"
DATA_WS_REGISTERED = "_ws_registered"
