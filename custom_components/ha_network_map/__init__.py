"""Network Map integration entry points.

Wires the :class:`NetworkScanner` and WebSocket handlers into Home
Assistant, registers the bundled Lovelace card as a frontend resource,
and exposes a ``ha_network_map.scan`` service so users can rescan from
HA's automation engine just as easily as from the card UI.
"""

from __future__ import annotations

import json
import logging
import os

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall

from .const import (
    DATA_FRONTEND_REGISTERED,
    DATA_SCANNER,
    DATA_WS_REGISTERED,
    DOMAIN,
)
from .scanner import NetworkScanner
from .websocket_api import async_register_commands

_LOGGER = logging.getLogger(__name__)

_CARD_URL_PATH = "/ha_network_map/ha-network-map.js"
_CARD_FILENAME = "ha-network-map.js"
_CARD_PACKAGE_DIR = "www"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the integration from a config entry."""
    bucket = hass.data.setdefault(DOMAIN, {})
    bucket[DATA_SCANNER] = NetworkScanner(hass)

    if not bucket.get(DATA_WS_REGISTERED):
        async_register_commands(hass)
        bucket[DATA_WS_REGISTERED] = True

    await _async_register_frontend(hass)

    async def _handle_scan(call: ServiceCall) -> None:
        """Service callback — trigger a server-side scan."""
        scanner: NetworkScanner = hass.data[DOMAIN][DATA_SCANNER]
        await scanner.scan(
            ports=call.data.get("ports"),
            timeout=call.data.get("timeout", 0.7),
            max_concurrent=call.data.get("max_concurrent", 16),
            include_public_ips=call.data.get("include_public_ips", False),
        )

    hass.services.async_register(DOMAIN, "scan", _handle_scan)

    _LOGGER.debug("Network Map set up (entry_id=%s)", entry.entry_id)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the config entry."""
    hass.services.async_remove(DOMAIN, "scan")
    bucket = hass.data.get(DOMAIN, {})
    bucket.pop(DATA_SCANNER, None)
    _LOGGER.debug("Network Map unloaded (entry_id=%s)", entry.entry_id)
    return True


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Register the bundled Lovelace card so users get it for free.

    Runs at most once per HA process. The static path makes the bundled
    JS file reachable at ``_CARD_URL_PATH``; ``add_extra_js_url`` tells
    the HA frontend to load it eagerly so the ``custom:ha-network-map``
    element is defined before any dashboard renders it.
    """
    bucket = hass.data.setdefault(DOMAIN, {})
    if bucket.get(DATA_FRONTEND_REGISTERED):
        return

    card_path = os.path.join(
        os.path.dirname(__file__), _CARD_PACKAGE_DIR, _CARD_FILENAME
    )
    if not os.path.isfile(card_path):
        _LOGGER.error(
            "Bundled card file missing at %s; card will not load", card_path
        )
        return

    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(_CARD_URL_PATH, card_path, cache_headers=True)]
        )
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.exception(
            "Failed to register static path %s -> %s: %s",
            _CARD_URL_PATH,
            card_path,
            err,
        )
        return

    # Cache-bust on integration upgrades by reading manifest.version.
    version_suffix = ""
    try:
        # Non-blocking: HA's loader caches integration metadata (reading the
        # manifest with open() here runs inside the event loop and triggers
        # HA's blocking-call warning).
        from homeassistant.loader import async_get_integration

        integration = await async_get_integration(hass, DOMAIN)
        version_suffix = f"?v={integration.version or '0'}"
    except Exception:  # pragma: no cover - non-fatal
        version_suffix = ""

    add_extra_js_url(hass, f"{_CARD_URL_PATH}{version_suffix}")
    bucket[DATA_FRONTEND_REGISTERED] = True
    _LOGGER.debug(
        "Registered Lovelace card at %s (file=%s)", _CARD_URL_PATH, card_path
    )
