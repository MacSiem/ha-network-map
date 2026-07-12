"""WebSocket API for the Network Map integration.

Exposes three commands consumed by the bundled Lovelace card — two open
read commands (``list_devices``, ``status``) and one admin-only command
(``scan``, which actively probes the network):

* ``ha_network_map/list_devices`` – return the current device map (no probe)
* ``ha_network_map/scan``          – probe TCP reachability from the HA host
* ``ha_network_map/status``        – last-scan timestamps + counts
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import (
    DATA_SCANNER,
    DEFAULT_MAX_CONCURRENT_PROBES,
    DEFAULT_PROBE_TIMEOUT_SECONDS,
    DOMAIN,
)
from .scanner import NetworkScanner

_LOGGER = logging.getLogger(__name__)


def _scanner(hass: HomeAssistant) -> NetworkScanner:
    """Return the scanner instance registered by ``async_setup_entry``."""
    return hass.data[DOMAIN][DATA_SCANNER]


@websocket_api.websocket_command(
    {vol.Required("type"): "ha_network_map/list_devices"}
)
# Read-only: open to every logged-in user so the card renders for non-admins.
# scan stays admin-only — it actively probes the network.
@websocket_api.async_response
async def _ws_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the device map without touching the network."""
    try:
        devices = await _scanner(hass).list_devices()
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.exception("list_devices failed: %s", err)
        connection.send_error(msg["id"], "list_failed", str(err))
        return
    connection.send_result(msg["id"], {"devices": devices})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "ha_network_map/scan",
        vol.Optional("ports"): [vol.All(int, vol.Range(min=1, max=65535))],
        vol.Optional("timeout", default=DEFAULT_PROBE_TIMEOUT_SECONDS): vol.All(
            vol.Coerce(float), vol.Range(min=0.05, max=5.0)
        ),
        vol.Optional("max_concurrent", default=DEFAULT_MAX_CONCURRENT_PROBES): vol.All(
            int, vol.Range(min=1, max=64)
        ),
        vol.Optional("include_public_ips", default=False): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_scan(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Trigger a fresh server-side reachability probe."""
    try:
        status = await _scanner(hass).scan(
            ports=msg.get("ports"),
            timeout=msg["timeout"],
            max_concurrent=msg["max_concurrent"],
            include_public_ips=msg["include_public_ips"],
        )
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.exception("scan failed: %s", err)
        connection.send_error(msg["id"], "scan_failed", str(err))
        return
    connection.send_result(msg["id"], status)


@websocket_api.websocket_command(
    {vol.Required("type"): "ha_network_map/status"}
)
@websocket_api.async_response
async def _ws_status(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return last-scan timestamps and aggregate counts."""
    connection.send_result(msg["id"], _scanner(hass).get_status())


def async_register_commands(hass: HomeAssistant) -> None:
    """Register every websocket command exported by this module."""
    for handler in (_ws_list, _ws_scan, _ws_status):
        websocket_api.async_register_command(hass, handler)
