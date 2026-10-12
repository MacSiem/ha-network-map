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

SCAN_FIELDS = {
    vol.Optional("ports"): vol.All([vol.All(int, vol.Range(min=1, max=65535))], vol.Length(max=12)),
    vol.Optional("timeout", default=DEFAULT_PROBE_TIMEOUT_SECONDS): vol.All(
        vol.Coerce(float), vol.Range(min=0.05, max=5.0)
    ),
    vol.Optional("max_concurrent", default=DEFAULT_MAX_CONCURRENT_PROBES): vol.All(
        int, vol.Range(min=1, max=64)
    ),
    vol.Optional("include_public_ips", default=False): bool,
}


def _scanner(hass: HomeAssistant) -> NetworkScanner:
    """Return the scanner instance registered by ``async_setup_entry``."""
    return hass.data[DOMAIN][DATA_SCANNER]


@websocket_api.websocket_command(
    {vol.Required("type"): "ha_network_map/list_devices", vol.Optional("include_non_network", default=False): bool}
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
        devices = await _scanner(hass).list_devices(include_non_network=msg["include_non_network"])
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.exception("list_devices failed: %s", err)
        connection.send_error(msg["id"], "list_failed", str(err))
        return
    connection.send_result(msg["id"], {"devices": devices})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "ha_network_map/scan",
        **SCAN_FIELDS,
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



@websocket_api.websocket_command({vol.Required("type"): "ha_network_map/scan_history"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_history(hass, connection, msg):
    """Private persisted metadata; memory-only read, no probe or Store write."""
    history = hass.data.get(DOMAIN,{}).get("scan_history")
    if history is None:
        connection.send_error(msg["id"],"history_unavailable","Scan history is not loaded")
        return
    connection.send_result(msg["id"],history.history())


@websocket_api.websocket_command({
    vol.Required("type"): "ha_network_map/compare_scans",
    vol.Optional("before_id"): vol.All(str,vol.Length(min=1,max=36)),
    vol.Optional("after_id"): vol.All(str,vol.Length(min=1,max=36)),
})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_compare(hass,connection,msg):
    """Compare already validated measurements without refreshing devices."""
    history = hass.data.get(DOMAIN,{}).get("scan_history")
    if history is None:
        connection.send_error(msg["id"],"history_unavailable","Scan history is not loaded")
        return
    connection.send_result(msg["id"],history.comparison(msg.get("before_id"),msg.get("after_id")))

def async_register_commands(hass: HomeAssistant) -> None:
    """Register every websocket command exported by this module."""
    for handler in (_ws_list, _ws_scan, _ws_status, _ws_history, _ws_compare):
        websocket_api.async_register_command(hass, handler)
