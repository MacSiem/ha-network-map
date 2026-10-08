"""Network Map integration entry points.

Wires the :class:`NetworkScanner` and WebSocket handlers into Home
Assistant, registers the bundled Lovelace card as a frontend resource,
and exposes a ``ha_network_map.scan`` service so users can rescan from
HA's automation engine just as easily as from the card UI.
"""

from __future__ import annotations

import asyncio
import logging
import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.service import async_register_admin_service

from .const import (
    DATA_FRONTEND_REGISTERED,
    DATA_PANEL_REGISTERED,
    DATA_SCANNER,
    DATA_WS_REGISTERED,
    DOMAIN,
)
from .frontend import (
    async_register_card, async_register_panel, async_register_static,
    async_unregister_card, async_unregister_panel,
)
from .scanner import NetworkScanner
from .websocket_api import SCAN_FIELDS, async_register_commands

_LOGGER = logging.getLogger(__name__)
DATA_LIFECYCLE_LOCK = "ha_network_map_lifecycle_lock"
DATA_FRONTEND_CLEANUP_PENDING = "_frontend_cleanup_pending"


def _lifecycle_lock(hass: HomeAssistant) -> asyncio.Lock:
    if DATA_LIFECYCLE_LOCK not in hass.data:
        hass.data[DATA_LIFECYCLE_LOCK] = asyncio.Lock()
    return hass.data[DATA_LIFECYCLE_LOCK]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the integration from a config entry."""
    async with _lifecycle_lock(hass):
        return await _async_setup_entry_locked(hass, entry)


async def _async_setup_entry_locked(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Serialize setup with frontend cleanup."""
    bucket = hass.data.setdefault(DOMAIN, {})
    bucket[DATA_SCANNER] = NetworkScanner(hass)

    if not bucket.get(DATA_WS_REGISTERED):
        async_register_commands(hass)
        bucket[DATA_WS_REGISTERED] = True

    if not bucket.get(DATA_FRONTEND_REGISTERED) or bucket.get(DATA_FRONTEND_CLEANUP_PENDING):
        await async_register_static(hass)
        await async_register_card(hass)
        bucket[DATA_FRONTEND_REGISTERED] = True
        bucket.pop(DATA_FRONTEND_CLEANUP_PENDING, None)
    if not bucket.get(DATA_PANEL_REGISTERED):
        bucket[DATA_PANEL_REGISTERED] = await async_register_panel(hass)

    async def _handle_scan(call: ServiceCall) -> None:
        """Service callback — trigger a server-side scan."""
        scanner: NetworkScanner = hass.data[DOMAIN][DATA_SCANNER]
        await scanner.scan(
            ports=call.data.get("ports"),
            timeout=call.data.get("timeout", 0.7),
            max_concurrent=call.data.get("max_concurrent", 16),
            include_public_ips=call.data.get("include_public_ips", False),
        )

    async_register_admin_service(hass, DOMAIN, "scan", _handle_scan, schema=vol.Schema(SCAN_FIELDS))

    _LOGGER.debug("Network Map set up (entry_id=%s)", entry.entry_id)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the config entry."""
    async with _lifecycle_lock(hass):
        hass.services.async_remove(DOMAIN, "scan")
        bucket = hass.data.get(DOMAIN, {})
        bucket.pop(DATA_SCANNER, None)
        if bucket.pop(DATA_PANEL_REGISTERED, False):
            async_unregister_panel(hass)
        if bucket.get(DATA_FRONTEND_REGISTERED):
            # Service, scanner and panel are unloaded. Retain the receipt and
            # retry frontend cleanup on next setup, without FAILED_UNLOAD.
            try:
                await async_unregister_card(hass)
            except Exception:
                bucket[DATA_FRONTEND_CLEANUP_PENDING] = True
                _LOGGER.warning("Network Map resource cleanup deferred until next setup", exc_info=True)
            else:
                bucket[DATA_FRONTEND_REGISTERED] = False
                bucket.pop(DATA_FRONTEND_CLEANUP_PENDING, None)
        _LOGGER.debug("Network Map unloaded (entry_id=%s)", entry.entry_id)
        return True
